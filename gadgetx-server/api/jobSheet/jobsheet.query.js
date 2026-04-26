module.exports = async (client) => {
  try {
    await client.exec(jobSheetQuery);
    console.log("✅ JobSheet triggers added");
  } catch (e) {
    console.error("❌ Error creating job sheet triggers:", e.message);
    throw e;
  }
};

const jobSheetQuery = `
-- INDEX (performance)
CREATE INDEX IF NOT EXISTS idx_transaction_reference
ON "transaction"(transaction_type, reference_id);

-- =====================================================
-- INSERT trigger (Completed & income > 0)
-- =====================================================
DROP TRIGGER IF EXISTS trg_jobsheet_insert;
CREATE TRIGGER trg_jobsheet_insert
AFTER INSERT ON job_sheets
FOR EACH ROW
WHEN (
  NEW.status = 'Completed'
  AND (COALESCE(NEW.service_charges,0) - COALESCE(NEW.service_cost,0)) > 0
  AND NEW.account_id IS NOT NULL
)
BEGIN
  INSERT INTO "transaction" (
    tenant_id,
    transaction_type,
    reference_id,
    cost_center_id,
    done_by_id,
    description
  ) VALUES (
    NEW.tenant_id,
    'service',
    NEW.job_id,
    NEW.cost_center_id,
    NEW.done_by_id,
    'Service income - ' || NEW.invoice_number
  );

  INSERT INTO transaction_ledger (
    tenant_id,
    transaction_id,
    account_id,
    credit
  ) VALUES (
    NEW.tenant_id,
    (SELECT last_insert_rowid()),
    NEW.account_id,
    (COALESCE(NEW.service_charges,0) - COALESCE(NEW.service_cost,0))
  );
END;

-- =====================================================
-- FIRST COMPLETION trigger
-- =====================================================
DROP TRIGGER IF EXISTS trg_jobsheet_update_first_complete;
CREATE TRIGGER trg_jobsheet_update_first_complete
AFTER UPDATE ON job_sheets
FOR EACH ROW
WHEN (
  NEW.status = 'Completed'
  AND OLD.status IS NOT 'Completed'
  AND (COALESCE(NEW.service_charges,0) - COALESCE(NEW.service_cost,0)) > 0
  AND NEW.account_id IS NOT NULL
)
BEGIN
  INSERT INTO "transaction" (
    tenant_id,
    transaction_type,
    reference_id,
    cost_center_id,
    done_by_id,
    description
  ) VALUES (
    NEW.tenant_id,
    'service',
    NEW.job_id,
    NEW.cost_center_id,
    NEW.done_by_id,
    'Service income - ' || NEW.invoice_number
  );

  INSERT INTO transaction_ledger (
    tenant_id,
    transaction_id,
    account_id,
    credit
  ) VALUES (
    NEW.tenant_id,
    (SELECT last_insert_rowid()),
    NEW.account_id,
    (COALESCE(NEW.service_charges,0) - COALESCE(NEW.service_cost,0))
  );
END;

-- =====================================================
-- UPDATE trigger (Completed & amount changed)
-- =====================================================
DROP TRIGGER IF EXISTS trg_jobsheet_update;
CREATE TRIGGER trg_jobsheet_update
AFTER UPDATE ON job_sheets
FOR EACH ROW
WHEN (
  OLD.status = 'Completed'
  AND NEW.status = 'Completed'
  AND (
    COALESCE(NEW.service_charges,0) IS NOT COALESCE(OLD.service_charges,0)
    OR COALESCE(NEW.service_cost,0) IS NOT COALESCE(OLD.service_cost,0)
    OR NEW.account_id IS NOT OLD.account_id
  )
)
BEGIN
  UPDATE "transaction"
  SET
    cost_center_id = NEW.cost_center_id,
    done_by_id = NEW.done_by_id,
    description = 'Service income updated - ' || NEW.invoice_number
  WHERE transaction_type = 'service'
    AND reference_id = NEW.job_id;

  UPDATE transaction_ledger
  SET
    credit = (COALESCE(NEW.service_charges,0) - COALESCE(NEW.service_cost,0)),
    account_id = NEW.account_id
  WHERE transaction_id IN (
    SELECT id FROM "transaction" 
    WHERE transaction_type = 'service' 
      AND reference_id = NEW.job_id
  );
END;

-- =====================================================
-- DELETE trigger
-- =====================================================
DROP TRIGGER IF EXISTS trg_jobsheet_delete;
CREATE TRIGGER trg_jobsheet_delete
AFTER DELETE ON job_sheets
FOR EACH ROW
BEGIN
  DELETE FROM "transaction"
  WHERE transaction_type = 'service'
    AND reference_id = OLD.job_id;
END;
`;
