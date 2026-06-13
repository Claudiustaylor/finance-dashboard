const fs = require('fs');
const { Client } = require('pg');

const SQL_PATH = process.env.SCHEMA_PATH || '/Users/ct/schema.sql';
const DB_HOST = 'db.uyvkqgmuxerjdqarjgbh.supabase.co';
const DB_PASS = 'ciq0LBfgo3Iz9VxO';

async function main() {
  const client = new Client({
    host: DB_HOST,
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: DB_PASS,
    ssl: { rejectUnauthorized: false },
    statement_timeout: 30000,
  });

  await client.connect();
  console.log('Connected to Supabase DB');

  const sql = fs.readFileSync(SQL_PATH, 'utf-8');

  // Split SQL into statements, respecting $$-delimited blocks
  const statements = splitSql(sql);
  console.log(`Total statements: ${statements.length}`);

  let success = 0, failed = 0, errors = [];

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i].trim();
    if (!stmt) continue;

    const preview = stmt.split('\n')[0].substring(0, 60);
    try {
      await client.query(stmt);
      success++;
      if (i % 10 === 0 || i < 5) {
        console.log(`[${i+1}/${statements.length}] OK: ${preview}`);
      }
    } catch (err) {
      failed++;
      const msg = err.message || String(err);
      // Ignore "already exists" / "duplicate" errors
      if (msg.includes('already exists') || msg.includes('Duplicate')) {
        success++;
        failed--;
        if (i % 10 === 0) console.log(`[${i+1}/${statements.length}] SKIP (exists): ${preview}`);
        continue;
      }
      errors.push({ preview, message: msg });
      console.error(`[${i+1}/${statements.length}] FAIL: ${preview} — ${msg.substring(0, 120)}`);
    }
  }

  // Verify tables exist
  const { rows } = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `);
  console.log('\nDeployed tables:');
  rows.forEach(r => console.log('  ✅', r.table_name));

  console.log(`\nSummary: ${success} success, ${failed} failed`);
  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.slice(0, 5).forEach(e => console.log('  •', e.preview, '→', e.message.substring(0, 200)));
  }

  await client.end();
  process.exit(failed > 0 ? 1 : 0);
}

function splitSql(sql) {
  const statements = [];
  let current = '';
  let inDollarQuote = false;
  let dollarTag = '';
  let i = 0;

  while (i < sql.length) {
    const ch = sql[i];
    const nextTwo = sql.slice(i, i + 2);

    // Handle $$ or $tag$ blocks
    if (ch === '$') {
      const match = sql.slice(i).match(/^\$([A-Za-z0-9_]*)\$/);
      if (match) {
        const tag = match[1];
        if (!inDollarQuote) {
          inDollarQuote = true;
          dollarTag = tag;
          current += match[0];
          i += match[0].length;
          continue;
        } else if (tag === dollarTag) {
          inDollarQuote = false;
          dollarTag = '';
          current += match[0];
          i += match[0].length;
          continue;
        }
      }
    }

    if (!inDollarQuote && ch === ';') {
      current += ch;
      statements.push(current);
      current = '';
      i++;
      continue;
    }

    if (!inDollarQuote && nextTwo === '--') {
      while (i < sql.length && sql[i] !== '\n') i++;
      continue;
    }

    current += ch;
    i++;
  }

  if (current.trim()) statements.push(current);
  return statements;
}

main().catch(e => { console.error(e); process.exit(1); });
