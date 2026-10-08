export type Scalar = string | number | null;

export const PIPELINE_TABLES = [
  'pipeline_categories', 'pipeline_countries', 'pipeline_companies', 'pipeline_discovery_candidates',
  'pipeline_discovery_runs', 'pipeline_contacts', 'pipeline_contact_points', 'pipeline_contact_point_sources',
  'pipeline_communications', 'pipeline_actions', 'pipeline_company_audit_events', 'pipeline_outreach_drafts',
  'pipeline_outreach_draft_versions', 'pipeline_send_plans', 'pipeline_send_plan_recipients',
  'pipeline_send_attempts', 'pipeline_discovery_events', 'pipeline_discovery_candidate_contacts',
  'pipeline_discovery_candidate_categories', 'pipeline_discovery_candidate_events', 'pipeline_company_categories',
  'pipeline_company_classifications', 'pipeline_discovery_run_results',
] as const;

export type PipelineTable = (typeof PIPELINE_TABLES)[number];

export const TABLE_PRIMARY_KEYS: Record<PipelineTable, readonly string[]> = {
  pipeline_categories: ['category_code'], pipeline_countries: ['country_code'], pipeline_companies: ['company_id'],
  pipeline_discovery_candidates: ['candidate_id'], pipeline_discovery_runs: ['run_id'], pipeline_contacts: ['contact_id'],
  pipeline_contact_points: ['contact_point_id'], pipeline_contact_point_sources: ['contact_point_source_id'],
  pipeline_communications: ['communication_id'], pipeline_actions: ['action_id'],
  pipeline_company_audit_events: ['audit_id'], pipeline_outreach_drafts: ['draft_id'],
  pipeline_outreach_draft_versions: ['version_id'], pipeline_send_plans: ['send_plan_id'],
  pipeline_send_plan_recipients: ['send_plan_recipient_id'], pipeline_send_attempts: ['send_attempt_id'],
  pipeline_discovery_events: ['event_id'], pipeline_discovery_candidate_contacts: ['candidate_contact_id'],
  pipeline_discovery_candidate_categories: ['candidate_id', 'category_code'],
  pipeline_discovery_candidate_events: ['event_id'], pipeline_company_categories: ['company_id', 'category_code'],
  pipeline_company_classifications: ['classification_id'], pipeline_discovery_run_results: ['result_id'],
};

export const isPipelineTable = (name: string): name is PipelineTable =>
  (PIPELINE_TABLES as readonly string[]).includes(name);

export function canonicalRow(columns: readonly string[], row: Record<string, Scalar>) {
  return columns.map((column) => [column, row[column] ?? null]);
}

export function rowsEqual(columns: readonly string[], left: Record<string, Scalar>, right: Record<string, Scalar>) {
  return JSON.stringify(canonicalRow(columns, left)) === JSON.stringify(canonicalRow(columns, right));
}

export function assertDisposableTarget(targetUrl: string, confirm: boolean) {
  if (!confirm) throw new Error('Import requires --confirm-disposable-target.');
  let parsed: URL;
  try { parsed = new URL(targetUrl); } catch { throw new Error('Import target URL is not a valid PostgreSQL URL.'); }
  const database = parsed.pathname.replace(/^\//, '').toLowerCase();
  const host = parsed.hostname.toLowerCase();
  const forbidden = /(^|[_-])(prod|production|live)([_-]|$)|wossol_export(?:_dev)?$/.test(database);
  const allowedHost = host === '127.0.0.1' || host === 'localhost' || host === '::1';
  if (forbidden || !allowedHost || !/^wossol_export_g1c_[a-z0-9_-]+$/.test(database)) {
    throw new Error('Refusing import: target must be a localhost disposable wossol_export_g1c_* database.');
  }
  return { host, database };
}

export function sortCategories<T extends Record<string, Scalar>>(rows: T[]) {
  const byCode = new Map(rows.map((row) => [String(row.category_code), row]));
  const result: T[] = [], visiting = new Set<string>(), visited = new Set<string>();
  const visit = (code: string) => {
    if (visited.has(code)) return;
    if (visiting.has(code)) throw new Error(`Category parent cycle detected at ${code}.`);
    const row = byCode.get(code);
    if (!row) throw new Error(`Category parent ${code} is missing from source.`);
    visiting.add(code);
    if (row.parent_category_code) visit(String(row.parent_category_code));
    visiting.delete(code); visited.add(code); result.push(row);
  };
  for (const row of rows) visit(String(row.category_code));
  return result;
}

export function buildImportPlan(sourceColumns: Record<PipelineTable, readonly string[]>) {
  return PIPELINE_TABLES.map((table) => {
    if (!sourceColumns[table]?.length) throw new Error(`Source table ${table} has no readable columns.`);
    return { table, columns: [...sourceColumns[table]], primaryKey: [...TABLE_PRIMARY_KEYS[table]] };
  });
}
