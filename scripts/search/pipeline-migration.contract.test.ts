import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assertDisposableTarget,
  buildImportPlan,
  PIPELINE_TABLES,
  rowsEqual,
  sortCategories,
} from './pipeline-migration-core.ts';

test('migration plan covers exactly the 23 pipeline tables and no catalog table', () => {
  const columns = Object.fromEntries(PIPELINE_TABLES.map((table) => [table, ['id']])) as Record<typeof PIPELINE_TABLES[number], readonly string[]>;
  const plan = buildImportPlan(columns);
  assert.equal(plan.length, 23);
  assert.ok(plan.every((item) => item.table.startsWith('pipeline_')));
  assert.ok(!plan.some((item) => item.table.includes('catalog') || item.table.includes('company_pipeline_link')));
});

test('existing equal rows are skipped, while any immutable conflict fails comparison', () => {
  const columns = ['id', 'body', 'status'];
  assert.equal(rowsEqual(columns, { id: '1', body: 'مرحبا', status: null }, { id: '1', body: 'مرحبا', status: null }), true);
  assert.equal(rowsEqual(columns, { id: '1', body: 'مرحبا', status: null }, { id: '1', body: 'Bonjour', status: null }), false);
});

test('category parents are imported before children and cycles are rejected', () => {
  const result = sortCategories([
    { category_code: 'child', parent_category_code: 'parent' },
    { category_code: 'parent', parent_category_code: null },
  ]);
  assert.deepEqual(result.map((row) => row.category_code), ['parent', 'child']);
  assert.throws(() => sortCategories([
    { category_code: 'a', parent_category_code: 'b' },
    { category_code: 'b', parent_category_code: 'a' },
  ]), /cycle/);
});

test('import guard only accepts explicitly confirmed localhost disposable databases', () => {
  assert.throws(() => assertDisposableTarget('postgresql://localhost/wossol_export_g1c_test', false), /confirm/);
  assert.throws(() => assertDisposableTarget('postgresql://localhost/wossol_export_dev', true), /Refusing/);
  assert.throws(() => assertDisposableTarget('postgresql://remote.example/wossol_export_g1c_test', true), /Refusing/);
  assert.deepEqual(assertDisposableTarget('postgresql://localhost/wossol_export_g1c_test', true).database, 'wossol_export_g1c_test');
});

test('migration core has no SMTP or catalog-link operation surface', async () => {
  const source = await import('node:fs/promises');
  const text = await source.readFile(new URL('./pipeline-migrate.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(text, /nodemailer|sendMail|smtp\.connect/i);
  assert.doesNotMatch(text, /CompanyPipelineLink|company_pipeline_links/);
});
