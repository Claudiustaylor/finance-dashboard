const { Client } = require('pg');

const client = new Client({
  host: 'db.uyvkqgmuxerjdqarjgbh.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'ciq0LBfgo3Iz9VxO',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  
  // Check all NOT NULL columns with no defaults on accounts
  const nn = await client.query(`
    SELECT column_name, is_nullable, column_default, data_type
    FROM information_schema.columns
    WHERE table_name = 'accounts' AND is_nullable = 'NO' AND column_default IS NULL
  `);
  console.log('accounts required columns (no default):', JSON.stringify(nn.rows, null, 2));
  
  // Check plaid_items same
  const pn = await client.query(`
    SELECT column_name, is_nullable, column_default, data_type
    FROM information_schema.columns
    WHERE table_name = 'plaid_items' AND is_nullable = 'NO' AND column_default IS NULL
  `);
  console.log('plaid_items required columns (no default):', JSON.stringify(pn.rows, null, 2));
  
  // Count rows
  const items = await client.query('SELECT COUNT(*) as c FROM plaid_items');
  console.log('plaid_items count:', items.rows[0].c);
  
  const accts = await client.query('SELECT COUNT(*) as c FROM accounts');
  console.log('accounts count:', accts.rows[0].c);
  
  await client.end();
}

main().catch(e => { console.error(e); process.exit(1); });
