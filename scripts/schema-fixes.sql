-- Fix 1: v_net_worth_daily ambiguous column
DROP VIEW IF EXISTS v_net_worth_daily;
CREATE OR REPLACE VIEW v_net_worth_daily AS
SELECT
  bs.user_id,
  bs.snapshot_date,
  SUM(
    CASE
      WHEN a.type IN ('depository','investment') THEN bs.current_balance
      WHEN a.type IN ('credit','loan') THEN -bs.current_balance
      ELSE bs.current_balance
    END
  ) AS computed_net_worth,
  SUM(CASE WHEN a.type IN ('depository') THEN bs.current_balance ELSE 0 END) AS cash_total,
  SUM(CASE WHEN a.type IN ('investment') THEN bs.current_balance ELSE 0 END) AS investment_total,
  SUM(CASE WHEN a.type IN ('credit','loan') THEN bs.current_balance ELSE 0 END) AS liability_total
FROM balance_snapshots bs
JOIN accounts a ON a.id = bs.account_id
GROUP BY bs.user_id, bs.snapshot_date;

-- Fix 2: v_transactions_monthly ambiguous column
DROP VIEW IF EXISTS v_transactions_monthly;
CREATE OR REPLACE VIEW v_transactions_monthly AS
SELECT
  t.user_id,
  DATE_TRUNC('month', t.date)::DATE AS month,
  t.currency_code,
  SUM(CASE WHEN t.amount > 0 AND c.is_income THEN t.amount ELSE 0 END) AS income,
  SUM(CASE WHEN t.amount > 0 AND NOT c.is_income THEN t.amount ELSE 0 END) AS spending,
  COUNT(*) FILTER (WHERE t.pending = false) AS settled_count,
  COUNT(*) FILTER (WHERE t.pending = true) AS pending_count
FROM transactions t
LEFT JOIN categories c ON c.id = t.category_id
GROUP BY t.user_id, DATE_TRUNC('month', t.date)::DATE, t.currency_code;

-- Fix 3: Drop broken trigger and recreate with valid WHEN clause
DROP TRIGGER IF EXISTS trigger_transactions_recurring_check ON transactions;
CREATE TRIGGER trigger_transactions_recurring_check
  AFTER INSERT OR UPDATE ON transactions
  FOR EACH ROW
  WHEN (NEW.is_recurring = true)
  EXECUTE FUNCTION refresh_recurring_flags();
