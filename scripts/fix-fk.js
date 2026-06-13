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
  
  // Drop the FK on plaid_items.user_id -> auth.users.id
  await client.query('ALTER TABLE plaid_items DROP CONSTRAINT IF EXISTS plaid_items_user_id_fkey');
  console.log('plaid_items FK dropped');
  
  const tablesToCheck = ['accounts', 'transactions', 'balance_snapshots', 'recurring_transactions', 'savings_goals', 'plaid_webhooks', 'subscriptions'];
  
  for (const tbl of tablesToCheck) {
    const res = await client.query(`
      SELECT con.conname
      FROM pg_constraint AS con
      JOIN pg_attribute AS a ON a.attnum = ANY(con.conkey) AND a.attrelid = con.conrelid
      WHERE con.contype = 'f'
        AND conrelid = '${tbl}'::regclass
        AND a.attname = 'user_id'
    `);
    for (const row of res.rows) {
      console.log(`Dropping FK ${row.conname} on ${tbl}`);
      await client.query(`ALTER TABLE ${tbl} DROP CONSTRAINT IF EXISTS ${row.conname}`);
    }
    if (res.rows.length === 0) {
      console.log(`${tbl}: no user_id FK`);
    }
  }
  
  // Verify the insert now works
  const testInsert = await client.query(`
    INSERT INTO plaid_items (user_id, plaid_item_id, plaid_access_token, plaid_institution_id, institution_name, status)
    VALUES ('550e8400-e29b-41d4-a716-446655440000', 'test-item-1', 'test-access-1', 'ins_109508', 'Capital One', 'active')
    RETURNING id
  `);
  console.log('Test insert succeeded:', testInsert.rows[0].id);
  
  // Clean up test row
  await client.query("DELETE FROM plaid_items WHERE plaid_item_id = 'test-item-1'");
  console.log('Test row cleaned up');
  
  await client.end();
}

main().catch(e => { console.error(e); process.exit(1); });
