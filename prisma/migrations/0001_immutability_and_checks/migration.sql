-- Chặn sửa/xóa bản ghi sổ cái (LedgerEntry) và nhật ký kiểm toán (AuditLog)
CREATE OR REPLACE FUNCTION prevent_mutation_append_only()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Table % is append-only: UPDATE and DELETE are forbidden', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ledger_entry_immutable ON "LedgerEntry";
CREATE TRIGGER trg_ledger_entry_immutable
BEFORE UPDATE OR DELETE ON "LedgerEntry"
FOR EACH ROW EXECUTE FUNCTION prevent_mutation_append_only();

DROP TRIGGER IF EXISTS trg_audit_log_immutable ON "AuditLog";
CREATE TRIGGER trg_audit_log_immutable
BEFORE UPDATE OR DELETE ON "AuditLog"
FOR EACH ROW EXECUTE FUNCTION prevent_mutation_append_only();

-- Ràng buộc số dư không âm ở tầng DB
ALTER TABLE "Wallet"
  DROP CONSTRAINT IF EXISTS chk_wallet_balance_non_negative,
  ADD CONSTRAINT chk_wallet_balance_non_negative CHECK ("balance" >= 0 AND "held" >= 0);
