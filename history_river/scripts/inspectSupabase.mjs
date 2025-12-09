import { Client } from 'pg'
import fs from 'fs'
import path from 'path'

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local')
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8')
    for (const line of content.split(/\r?\n/)) {
      const m = line.match(/^([A-Za-z0-9_]+)=(.*)$/)
      if (m) process.env[m[1]] = m[2]
    }
  }
}

async function run() {
  loadEnv()
  const url = process.env.SUPABASE_DIRECT_URL
  if (!url) {
    console.error('SUPABASE_DIRECT_URL not found in .env.local')
    process.exit(1)
  }
  const conn = url.includes('?') ? `${url}&sslmode=require` : `${url}?sslmode=require`
  const client = new Client({ connectionString: conn })
  await client.connect()
  const basic = await client.query('select current_database() as db, current_user as usr')
  const schemas = await client.query("select nspname as schema, pg_get_userbyid(nspowner) as owner from pg_namespace where nspname not like 'pg_%' and nspname <> 'information_schema' order by 1")
  const tables = await client.query("select schemaname, tablename from pg_catalog.pg_tables where schemaname not like 'pg_%' and schemaname <> 'information_schema' order by 1,2")
  const columns = await client.query("select table_schema, table_name, column_name, data_type, is_nullable, coalesce(column_default,'') as default from information_schema.columns where table_schema not like 'pg_%' and table_schema <> 'information_schema' order by table_schema, table_name, ordinal_position limit 400")
  const indexes = await client.query("select n.nspname as schema, t.relname as table, i.relname as index, ix.indisprimary as primary, ix.indisunique as unique from pg_index ix join pg_class i on i.oid = ix.indexrelid join pg_class t on t.oid = ix.indrelid join pg_namespace n on n.oid = t.relnamespace where n.nspname not like 'pg_%' and n.nspname <> 'information_schema' order by 1,2 limit 200")
  const rows = await client.query('select schemaname as schema, relname as table, n_live_tup as rows_est from pg_stat_user_tables order by n_live_tup desc')
  await client.end()
  const summary = {
    basic: basic.rows[0],
    schemas: schemas.rows,
    tables: tables.rows,
    columnsSample: columns.rows.slice(0, 100),
    indexesSample: indexes.rows.slice(0, 50),
    rowCounts: rows.rows.slice(0, 50),
  }
  console.log(JSON.stringify(summary, null, 2))
}

run().catch(err => { console.error(err); process.exit(1) })