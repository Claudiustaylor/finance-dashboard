-- Add updated_at to compliance_filings (missing from original migration)
ALTER TABLE compliance_filings
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Add default updated_at trigger for compliance_filings
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_compliance_filings_updated_at ON compliance_filings;
CREATE TRIGGER trg_compliance_filings_updated_at
    BEFORE UPDATE ON compliance_filings
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
