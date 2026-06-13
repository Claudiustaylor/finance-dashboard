-- ============================================
-- Titan Finance: Premium Bookkeeping Tables
-- ============================================

-- Allow UUID generation (Supabase default, idempotent)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop new tables if re-running in dev (prod uses schema diff)
DROP TABLE IF EXISTS ai_messages CASCADE;
DROP TABLE IF EXISTS ai_conversations CASCADE;
DROP TABLE IF EXISTS reconciliation_status CASCADE;
DROP TABLE IF EXISTS revenue_recognition_schedules CASCADE;
DROP TABLE IF EXISTS recurring_rules CASCADE;
DROP TABLE IF EXISTS receipts CASCADE;
DROP TABLE IF EXISTS balance_snapshots CASCADE;
DROP TABLE IF EXISTS gl_accounts CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- =========================================================
-- 1. User Profiles (links to Supabase Auth)
-- =========================================================
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    company_name TEXT,
    default_currency TEXT NOT NULL DEFAULT 'USD',
    onboarding_done BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE user_profiles IS 'Extended profile tied to Supabase Auth users';

-- =========================================================
-- 2. Chart of Accounts (GL)
-- =========================================================
CREATE TABLE gl_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('asset','liability','equity','revenue','expense')),
    subtype TEXT,
    parent_id UUID REFERENCES gl_accounts(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    default_tax_category TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT gl_accounts_user_code_unique UNIQUE (user_id, code)
);

CREATE INDEX idx_gl_accounts_user ON gl_accounts(user_id);
CREATE INDEX idx_gl_accounts_type ON gl_accounts(type);
CREATE INDEX idx_gl_accounts_parent ON gl_accounts(parent_id);

COMMENT ON TABLE gl_accounts IS 'User chart of accounts for bookkeeping categorization';

-- =========================================================
-- 3. Receipts with OCR results
-- =========================================================
CREATE TABLE receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
    file_url TEXT,
    ocr_text TEXT,
    ocr_confidence DECIMAL(5,4),
    extracted_amount DECIMAL(12,2),
    extracted_merchant TEXT,
    extracted_date DATE,
    extracted_items JSONB,
    extracted_tax DECIMAL(12,2),
    extracted_total DECIMAL(12,2),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processed','failed','review')),
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_receipts_user ON receipts(user_id);
CREATE INDEX idx_receipts_transaction ON receipts(transaction_id);
CREATE INDEX idx_receipts_status ON receipts(status);

-- =========================================================
-- 4. Recurring Transaction Rules
-- =========================================================
CREATE TABLE recurring_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    cadence TEXT NOT NULL CHECK (cadence IN ('weekly','biweekly','monthly','quarterly','yearly')),
    day_of_month INTEGER CHECK (day_of_month BETWEEN 1 AND 31),
    gl_account_id UUID REFERENCES gl_accounts(id) ON DELETE SET NULL,
    next_expected_date DATE,
    end_date DATE,
    confidence DECIMAL(5,4),
    match_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_recurring_rules_user ON recurring_rules(user_id);
CREATE INDEX idx_recurring_rules_next_date ON recurring_rules(next_expected_date);
CREATE INDEX idx_recurring_rules_gl_account ON recurring_rules(gl_account_id);

-- =========================================================
-- 5. Revenue Recognition Schedules
-- =========================================================
CREATE TABLE revenue_recognition_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    total_amount DECIMAL(12,2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    recognized_to_date DECIMAL(12,2) NOT NULL DEFAULT 0,
    method TEXT NOT NULL DEFAULT 'straight_line' CHECK (method IN ('straight_line','performance_based','milestone','manual')),
    schedule_entries JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_revenue_schedules_user ON revenue_recognition_schedules(user_id);
CREATE INDEX idx_revenue_schedules_transaction ON revenue_recognition_schedules(transaction_id);

-- =========================================================
-- 6. Reconciliation Status
-- =========================================================
CREATE TABLE reconciliation_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    transaction_id UUID NOT NULL UNIQUE REFERENCES transactions(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','matched','cleared','flagged')),
    bank_statement_date DATE,
    reconciled_at TIMESTAMPTZ,
    discrepancy_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reconciliation_user ON reconciliation_status(user_id);
CREATE INDEX idx_reconciliation_status ON reconciliation_status(status);

-- =========================================================
-- 7. AI Conversations & Messages
-- =========================================================
CREATE TABLE ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    title TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_conversations_user ON ai_conversations(user_id);

CREATE TABLE ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('system','user','assistant','tool')),
    content TEXT,
    tool_calls JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_messages_conversation ON ai_messages(conversation_id);
CREATE INDEX idx_ai_messages_created ON ai_messages(conversation_id, created_at);

-- =========================================================
-- 8. Balance Snapshots
-- =========================================================
CREATE TABLE balance_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    balance DECIMAL(12,2) NOT NULL,
    captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_balance_snapshots_account ON balance_snapshots(account_id);
CREATE INDEX idx_balance_snapshots_captured ON balance_snapshots(account_id, captured_at);
CREATE INDEX idx_balance_snapshots_user ON balance_snapshots(user_id);

-- =========================================================
-- 9. Augment existing transactions table for AI suggestions
-- =========================================================
ALTER TABLE transactions
    ADD COLUMN IF NOT EXISTS gl_account_id UUID REFERENCES gl_accounts(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS suggested_gl_account_id UUID REFERENCES gl_accounts(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS ai_category TEXT,
    ADD COLUMN IF NOT EXISTS ai_confidence DECIMAL(5,4),
    ADD COLUMN IF NOT EXISTS ai_suggested_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_transactions_gl_account ON transactions(gl_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_suggested_gl_account ON transactions(suggested_gl_account_id);

-- =========================================================
-- 10. Row Level Security (RLS)
-- =========================================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE gl_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_recognition_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliation_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE balance_snapshots ENABLE ROW LEVEL SECURITY;

-- Helper function to compare auth uid to our text user_id column
CREATE OR REPLACE FUNCTION public.is_owner(user_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN auth.uid()::TEXT = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies: user_profiles
CREATE POLICY "Users own their profile"
    ON user_profiles FOR ALL
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policies: gl_accounts
CREATE POLICY "Users manage their own chart of accounts"
    ON gl_accounts FOR ALL
    TO authenticated
    USING (public.is_owner(user_id))
    WITH CHECK (public.is_owner(user_id));

-- Policies: receipts
CREATE POLICY "Users manage their own receipts"
    ON receipts FOR ALL
    TO authenticated
    USING (public.is_owner(user_id))
    WITH CHECK (public.is_owner(user_id));

-- Policies: recurring_rules
CREATE POLICY "Users manage their own recurring rules"
    ON recurring_rules FOR ALL
    TO authenticated
    USING (public.is_owner(user_id))
    WITH CHECK (public.is_owner(user_id));

-- Policies: revenue_recognition_schedules
CREATE POLICY "Users manage their own revenue schedules"
    ON revenue_recognition_schedules FOR ALL
    TO authenticated
    USING (public.is_owner(user_id))
    WITH CHECK (public.is_owner(user_id));

-- Policies: reconciliation_status
CREATE POLICY "Users manage their own reconciliation status"
    ON reconciliation_status FOR ALL
    TO authenticated
    USING (public.is_owner(user_id))
    WITH CHECK (public.is_owner(user_id));

-- Policies: ai_conversations
CREATE POLICY "Users manage their own AI conversations"
    ON ai_conversations FOR ALL
    TO authenticated
    USING (public.is_owner(user_id))
    WITH CHECK (public.is_owner(user_id));

-- Policies: ai_messages (scoped through conversation ownership)
CREATE POLICY "Users manage messages in their conversations"
    ON ai_messages FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM ai_conversations c
            WHERE c.id = ai_messages.conversation_id
            AND public.is_owner(c.user_id)
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM ai_conversations c
            WHERE c.id = ai_messages.conversation_id
            AND public.is_owner(c.user_id)
        )
    );

-- Policies: balance_snapshots
CREATE POLICY "Users manage their own balance snapshots"
    ON balance_snapshots FOR ALL
    TO authenticated
    USING (public.is_owner(user_id))
    WITH CHECK (public.is_owner(user_id));
