-- Audit current data
SELECT 'plaid_items count' as check_name, COUNT(*) as count FROM plaid_items
UNION ALL
SELECT 'accounts count', COUNT(*) FROM accounts
UNION ALL
SELECT 'transactions count', COUNT(*) FROM transactions
UNION ALL
SELECT 'item_holdings count', COUNT(*) FROM item_holdings
UNION ALL
SELECT 'users count', COUNT(*) FROM users;

-- Show all plaid_items with details
SELECT id, item_id, institution_name, institution_id, user_id, created_at, status 
FROM plaid_items;

-- Show all accounts
SELECT a.id, a.name, a.mask, a.type, a.subtype, a.balance_current, a.plaid_item_id, p.institution_name
FROM accounts a
LEFT JOIN plaid_items p ON a.plaid_item_id = p.id;
