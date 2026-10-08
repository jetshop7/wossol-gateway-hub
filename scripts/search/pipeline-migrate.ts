import { createHash } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import {
  assertDisposableTarget,
  buildImportPlan,
  canonicalRow,
  isPipelineTable,
  PIPELINE_TABLES,
  rowsEqual,
  sortCategories,
  TABLE_PRIMARY_KEYS,
  type PipelineTable,
  type Scalar,
} from './pipeline-migration-core.ts';

type SourceDb = { query(sql: string): { all(): Record<string, Scalar>[] }; close(): void };
type TargetDb = { $queryRawUnsafe(sql: string, ...values: Scalar[]): Promise<Record<string, Scalar>[]>; $executeRawUnsafe(sql: string, ...values: Scalar[]): Promise<number>; $transaction<T>(fn: (tx: TargetDb) => Promise<T>): Promise<T>; $disconnect(): Promise<void> };

const quote = (name: string) => `"${name.replaceAll('"', '""')}"`;
const placeholders = (count: number) => Array.from({ length: count }, (_, i) => `$${i + 1}`).join(', ');

async function openSource(path: string): Promise<SourceDb> {
  const { Database } = await import('bun:sqlite');
  return new Database(path, { readonly: true, strict: true }) as unknown as SourceDb;
}

function inspectSource(db: SourceDb) {
  const names = new Set(db.query("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'").all().map((row) => String(row.name)));
  for (const table of PIPELINE_TABLES) if (!names.has(table.replace(/^pipeline_/, ''))) {
    throw new Error(`Source is missing legacy table ${table.replace(/^pipeline_/, '')}.`);
  }
  const sourceColumns = Object.fromEntries(PIPELINE_TABLES.map((table) => {
    const sourceName = table.replace(/^pipeline_/, '');
    const columns = db.query(`PRAGMA table_info(${quote(sourceName)})`).all().map((row) => String(row.name));
    return [table, columns];
  })) as Record<PipelineTable, readonly string[]>;
  const counts = Object.fromEntries(PIPELINE_TABLES.map((table) => {
    const sourceName = table.replace(/^pipeline_/, '');
    return [table, Number(db.query(`SELECT COUNT(*) AS count FROM ${quote(sourceName)}`).all()[0].count)];
  }));
  const fkViolations = db.query('PRAGMA foreign_key_check').all();
  if (fkViolations.length) throw new Error(`Source foreign-key audit failed with ${fkViolations.length} violation(s).`);
  return { sourceColumns, counts, plan: buildImportPlan(sourceColumns), foreignKeyViolations: 0 };
}

function sourceRows(db: SourceDb, table: PipelineTable, columns: readonly string[]) {
  const sourceName = table.replace(/^pipeline_/, '');
  const order = TABLE_PRIMARY_KEYS[table].map(quote).join(', ');
  return db.query(`SELECT ${columns.map(quote).join(', ')} FROM ${quote(sourceName)} ORDER BY ${order}`).all();
}

function checksum(rows: Record<string, Scalar>[], columns: readonly string[]) {
  const hash = createHash('sha256');
  for (const row of rows) hash.update(JSON.stringify(canonicalRow(columns, row)) + '\n');
  return hash.digest('hex');
}

async function importRows(target: TargetDb, table: PipelineTable, columns: readonly string[], rows: Record<string, Scalar>[]) {
  const keys = TABLE_PRIMARY_KEYS[table];
  const select = `SELECT ${columns.map(quote).join(', ')} FROM ${quote(table)} WHERE ${keys.map((key, i) => `${quote(key)} = $${i + 1}`).join(' AND ')}`;
  const insert = `INSERT INTO ${quote(table)} (${columns.map(quote).join(', ')}) VALUES (${placeholders(columns.length)})`;
  let inserted = 0, skipped = 0;
  for (const row of rows) {
    const keyValues = keys.map((key) => row[key] ?? null);
    const existing = await target.$queryRawUnsafe(select, ...keyValues);
    if (existing.length) {
      if (!rowsEqual(columns, row, existing[0])) throw new Error(`Immutable conflict in ${table} for primary key ${JSON.stringify(keyValues)}.`);
      skipped++;
      continue;
    }
    await target.$executeRawUnsafe(insert, ...columns.map((column) => row[column] ?? null));
    inserted++;
  }
  return { inserted, skipped };
}

async function runImport(sourcePath: string, targetUrl: string, confirm: boolean) {
  assertDisposableTarget(targetUrl, confirm);
  const source = await openSource(sourcePath);
  const target = new PrismaClient({ datasources: { db: { url: targetUrl } } }) as unknown as TargetDb;
  try {
    const audit = inspectSource(source);
    const summary: Record<string, { source: number; inserted: number; skipped: number }> = {};
    for (const item of audit.plan) {
      let rows = sourceRows(source, item.table, item.columns);
      if (item.table === 'pipeline_categories') rows = sortCategories(rows);
      const result = await target.$transaction((tx) => importRows(tx, item.table, item.columns, rows));
      summary[item.table] = { source: rows.length, ...result };
    }
    const verification = await verifyTarget(source, target, audit);
    return { status: 'COMPLETE', summary, verification };
  } catch (error) {
    return { status: 'FAILED', error: error instanceof Error ? error.message : String(error) };
  } finally {
    source.close();
    await target.$disconnect();
  }
}

async function verifyTarget(source: SourceDb, target: TargetDb, audit: ReturnType<typeof inspectSource>) {
  const tables: Record<string, { count: number; checksum: string }> = {};
  for (const item of audit.plan) {
    const rows = sourceRows(source, item.table, item.columns);
    const targetRows = await target.$queryRawUnsafe(`SELECT ${item.columns.map(quote).join(', ')} FROM ${quote(item.table)} ORDER BY ${TABLE_PRIMARY_KEYS[item.table].map(quote).join(', ')}`);
    if (targetRows.length !== rows.length || checksum(rows, item.columns) !== checksum(targetRows, item.columns)) {
      throw new Error(`Verification mismatch in ${item.table}.`);
    }
    tables[item.table] = { count: targetRows.length, checksum: checksum(rows, item.columns) };
  }
  return { tables, noCatalogTablesTouched: true, smtpUsed: false };
}

function args(argv: string[]) {
  const values = new Map<string, string>();
  for (let i = 0; i < argv.length; i++) if (argv[i].startsWith('--')) values.set(argv[i], argv[i + 1] ?? '');
  return values;
}

async function main() {
  const options = args(process.argv.slice(2));
  const mode = options.get('--mode') ?? 'plan';
  const sourcePath = options.get('--source');
  if (!sourcePath) throw new Error('--source is required.');
  const source = await openSource(sourcePath);
  try {
    const audit = inspectSource(source);
    if (mode === 'audit' || mode === 'plan') {
      console.log(JSON.stringify({ mode, status: 'DRY_RUN', tables: audit.plan.map((item) => ({ table: item.table, columns: item.columns, rows: audit.counts[item.table] })), foreignKeyViolations: audit.foreignKeyViolations, targetWrites: 0, smtpUsed: false }, null, 2));
      return;
    }
  } finally {
    source.close();
  }
  if (mode !== 'import') throw new Error(`Unsupported mode ${mode}. Use audit, plan, or import.`);
  const targetUrl = options.get('--target-url');
  if (!targetUrl) throw new Error('--target-url is required for import.');
  const result = await runImport(sourcePath, targetUrl, options.get('--confirm-disposable-target') === 'yes');
  console.log(JSON.stringify(result, null, 2));
  if (result.status !== 'COMPLETE') process.exitCode = 1;
}

if (import.meta.main) await main();

export { inspectSource, verifyTarget, runImport };
