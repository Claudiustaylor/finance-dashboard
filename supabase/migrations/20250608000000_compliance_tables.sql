-- ============================================
-- Titan Finance: Compliance Center Tables
-- ============================================

-- Drop existing if re-running (dev only; prod uses schema diff)
DROP TABLE IF EXISTS filing_reminders CASCADE;
DROP TABLE IF EXISTS compliance_filings CASCADE;
DROP TABLE IF EXISTS compliance_entities CASCADE;

-- Business Entities (multi-user ready)
CREATE TABLE compliance_entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL DEFAULT 'titan_default_user',
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('LLC','Corp','Nonprofit','Partnership','Sole Proprietorship')),
    state TEXT NOT NULL,
    formation_date DATE NOT NULL,
    ein TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_compliance_entities_user ON compliance_entities(user_id);
CREATE INDEX idx_compliance_entities_state ON compliance_entities(state);

-- Compliance Filings per entity
CREATE TABLE compliance_filings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID NOT NULL REFERENCES compliance_entities(id) ON DELETE CASCADE,
    filing_type TEXT NOT NULL,
    due_date DATE,
    cost TEXT NOT NULL DEFAULT '$0',
    late_fee TEXT NOT NULL DEFAULT '$0',
    completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMPTZ,
    filing_link TEXT,
    guidance TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_compliance_filings_entity ON compliance_filings(entity_id);
CREATE INDEX idx_compliance_filings_due ON compliance_filings(due_date);
CREATE INDEX idx_compliance_filings_completed ON compliance_filings(completed, due_date);

-- Reminders / Calendar events
CREATE TABLE filing_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filing_id UUID NOT NULL REFERENCES compliance_filings(id) ON DELETE CASCADE,
    remind_at TIMESTAMPTZ NOT NULL,
    notified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_filing_reminders_notify ON filing_reminders(notified, remind_at);

-- Row Level Security (RLS) — enabled but policy open for now until auth layer is wired
ALTER TABLE compliance_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_filings ENABLE ROW LEVEL SECURITY;
ALTER TABLE filing_reminders ENABLE ROW LEVEL SECURITY;

-- Upsert helper for state rule generation
COMMENT ON TABLE compliance_entities IS 'Tracks business entities across states for the compliance center';
COMMENT ON TABLE compliance_filings IS 'Tracks required filings (annual reports, franchise tax, etc) per entity';
