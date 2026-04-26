module.exports = async (client) => {
  try {
    // Using client.exec for multi-statement trigger creation
    await client.exec(accountTriggers);
    console.log("✅ Account triggers (Initial Balance & Cleanup) added");
  } catch (e) {
    console.error("❌ Error creating account triggers:", e.message);
    throw e;
  }
};

const accountTriggers = `
-- =====================================================
-- Trigger for Initial Balance (INSERT)
-- =====================================================
DROP TRIGGER IF EXISTS trg_account_initial_balance;
CREATE TRIGGER trg_account_initial_balance
AFTER INSERT ON account
FOR EACH ROW
WHEN (NEW.balance IS NOT NULL AND NEW.balance != 0)
BEGIN
    -- Insert into transaction
    INSERT INTO "transaction" (
        tenant_id,
        transaction_type,
        reference_id,
        description
    ) VALUES (
        NEW.tenant_id,
        'deposit',
        NEW.id,
        'Initial balance for account: ' || NEW.name
    );

    -- Insert into transaction_ledger
    INSERT INTO transaction_ledger (
        tenant_id,
        transaction_id,
        account_id,
        credit
    ) VALUES (
        NEW.tenant_id,
        (SELECT last_insert_rowid()),
        NEW.id,
        NEW.balance
    );
END;

-- =====================================================
-- Trigger for Account Cleanup (DELETE)
-- =====================================================
DROP TRIGGER IF EXISTS trg_account_delete_cleanup;
CREATE TRIGGER trg_account_delete_cleanup
BEFORE DELETE ON account
FOR EACH ROW
BEGIN
    -- Delete related transactions (Ledger entries will cascade)
    DELETE FROM "transaction"
    WHERE transaction_type = 'deposit' 
      AND reference_id = OLD.id
      AND description LIKE 'Initial balance%';
END;
`;
