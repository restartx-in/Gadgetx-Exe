module.exports = async (client) => {
  try {
    console.log('🚀 Setting up Expense Triggers (Transaction & Ledger Sync)...');

    await client.exec(expenseTriggers);

    console.log('✅ Expense triggers successfully.');
  } catch (err) {
    console.error('❌ Failed to create Expense queries:', err.message);
    throw err;
  }
};

const expenseTriggers = `
-- 1. HANDLE INSERT
DROP TRIGGER IF EXISTS trg_expense_insert;
CREATE TRIGGER trg_expense_insert
AFTER INSERT ON expenses
FOR EACH ROW
WHEN NEW.amount_paid > 0
BEGIN
  INSERT INTO "transaction" (
    tenant_id, transaction_type, reference_id, description, 
    cost_center_id, done_by_id, created_at
  ) VALUES (
    NEW.tenant_id, 'expense', NEW.id, NEW.description, 
    NEW.cost_center_id, NEW.done_by_id, NEW.date
  );
  
  INSERT INTO "transaction_ledger" (
    tenant_id, transaction_id, account_id, debit, credit, created_at
  ) VALUES (
    NEW.tenant_id, (SELECT last_insert_rowid()), NEW.account_id, NEW.amount_paid, 0, NEW.date
  );
END;

-- 2. HANDLE UPDATE
DROP TRIGGER IF EXISTS trg_expense_update;
CREATE TRIGGER trg_expense_update
AFTER UPDATE ON expenses
FOR EACH ROW
BEGIN
  -- CASE A: Payment was 0, now it's > 0 (Create Transaction if not exists)
  INSERT INTO "transaction" (
    tenant_id, transaction_type, reference_id, description, 
    cost_center_id, done_by_id, created_at
  ) 
  SELECT NEW.tenant_id, 'expense', NEW.id, NEW.description, 
         NEW.cost_center_id, NEW.done_by_id, NEW.date
  WHERE NEW.amount_paid > 0 AND NOT EXISTS (
    SELECT 1 FROM "transaction" WHERE transaction_type = 'expense' AND reference_id = NEW.id
  );

  INSERT INTO "transaction_ledger" (
    tenant_id, transaction_id, account_id, debit, credit, created_at
  )
  SELECT NEW.tenant_id, (SELECT id FROM "transaction" WHERE transaction_type = 'expense' AND reference_id = NEW.id),
         NEW.account_id, NEW.amount_paid, 0, NEW.date
  WHERE NEW.amount_paid > 0 AND NOT EXISTS (
    SELECT 1 FROM "transaction_ledger" WHERE transaction_id IN (
      SELECT id FROM "transaction" WHERE transaction_type = 'expense' AND reference_id = NEW.id
    )
  );

  -- CASE B: Update existing
  UPDATE "transaction" SET
      description = NEW.description,
      cost_center_id = NEW.cost_center_id,
      done_by_id = NEW.done_by_id,
      created_at = NEW.date
  WHERE transaction_type = 'expense' AND reference_id = NEW.id AND NEW.amount_paid > 0;

  UPDATE "transaction_ledger" SET
      account_id = NEW.account_id,
      debit = NEW.amount_paid,
      created_at = NEW.date
  WHERE transaction_id IN (
    SELECT id FROM "transaction" WHERE transaction_type = 'expense' AND reference_id = NEW.id
  ) AND NEW.amount_paid > 0;

  -- CASE C: Payment becomes 0
  DELETE FROM "transaction" 
  WHERE transaction_type = 'expense' AND reference_id = NEW.id 
    AND (NEW.amount_paid IS NULL OR NEW.amount_paid <= 0);
END;

-- 3. HANDLE DELETE
DROP TRIGGER IF EXISTS trg_expense_delete;
CREATE TRIGGER trg_expense_delete
AFTER DELETE ON expenses
FOR EACH ROW
BEGIN
  DELETE FROM "transaction" 
  WHERE transaction_type = 'expense' AND reference_id = OLD.id;
END;
`;