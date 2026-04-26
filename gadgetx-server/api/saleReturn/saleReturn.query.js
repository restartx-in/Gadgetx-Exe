module.exports = async (client) => {
  try {
    await client.exec(saleReturnPaymentQuery);
    console.log("✅ Sale Return payment triggers added");
  } catch (e) {
    console.error("❌ Error creating sale return payment triggers:", e.message);
    throw e;
  }
};

const saleReturnPaymentQuery = `
-- =====================================================
-- INSERT trigger
-- =====================================================
DROP TRIGGER IF EXISTS trg_sale_return_payment_insert;
CREATE TRIGGER trg_sale_return_payment_insert
AFTER INSERT ON transaction_payments
FOR EACH ROW
WHEN (NEW.sale_return_id IS NOT NULL AND NEW.amount != 0 AND NEW.account_id IS NOT NULL)
BEGIN
  INSERT INTO "transaction" (
    tenant_id,
    transaction_type,
    reference_id,
    description
  ) VALUES (
    NEW.tenant_id,
    'sale_return',
    NEW.sale_return_id,
    'Sale return refund'
  );

  INSERT INTO transaction_ledger (
    tenant_id,
    transaction_id,
    account_id,
    debit
  ) VALUES (
    NEW.tenant_id,
    (SELECT last_insert_rowid()),
    NEW.account_id,
    ABS(NEW.amount)
  );
END;

-- =====================================================
-- UPDATE trigger
-- =====================================================
DROP TRIGGER IF EXISTS trg_sale_return_payment_update;
CREATE TRIGGER trg_sale_return_payment_update
AFTER UPDATE ON transaction_payments
FOR EACH ROW
WHEN (NEW.sale_return_id IS NOT NULL)
BEGIN
  -- Handle delete if amount becomes 0 or account becomes null
  DELETE FROM "transaction"
  WHERE (NEW.amount = 0 OR NEW.account_id IS NULL)
    AND reference_id = OLD.sale_return_id
    AND id IN (
      SELECT transaction_id
      FROM transaction_ledger
      WHERE account_id = OLD.account_id
    );

  -- Update transaction if amount is not 0 and account is not null
  UPDATE "transaction"
  SET
    description = 'Sale return refund updated'
  WHERE NEW.amount != 0 AND NEW.account_id IS NOT NULL
    AND reference_id = NEW.sale_return_id
    AND id IN (
      SELECT transaction_id
      FROM transaction_ledger
      WHERE account_id = OLD.account_id
    );

  UPDATE transaction_ledger
  SET
    account_id = NEW.account_id,
    debit = ABS(NEW.amount)
  WHERE NEW.amount != 0 AND NEW.account_id IS NOT NULL
    AND transaction_id IN (
      SELECT t.id
      FROM "transaction" t
      JOIN transaction_ledger tl ON tl.transaction_id = t.id
      WHERE t.reference_id = NEW.sale_return_id
        AND tl.account_id = OLD.account_id
    );
END;

-- =====================================================
-- DELETE trigger
-- =====================================================
DROP TRIGGER IF EXISTS trg_sale_return_payment_delete;
CREATE TRIGGER trg_sale_return_payment_delete
AFTER DELETE ON transaction_payments
FOR EACH ROW
WHEN (OLD.sale_return_id IS NOT NULL)
BEGIN
  DELETE FROM "transaction"
  WHERE reference_id = OLD.sale_return_id
    AND id IN (
      SELECT transaction_id
      FROM transaction_ledger
      WHERE account_id = OLD.account_id
    );
END;
`;
