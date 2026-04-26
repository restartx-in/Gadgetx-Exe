import React, { useState, useEffect, useMemo } from "react";
import { FaPlus, FaTrash } from "react-icons/fa";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/Modal";
import HStack from "@/components/HStack";
import InputField from "@/components/InputField";
import AmountSymbol from "@/components/AmountSymbol";
import LedgerAutoCompleteWithAddOptionWithBalance from "@/apps/user/components/LedgerAutoCompleteWithAddOptionWithBalance/component";
import ModeOfPaymentAutoCompleteWithAddOption from "@/apps/user/components/ModeOfPaymentAutoCompleteWithAddOption";
import { useModeOfPayments } from "@/hooks/api/modeOfPayment/useModeOfPayments";
import { useIsMobile } from "@/utils/useIsMobile";

const PaymentModal = ({
  isOpen,
  onClose,
  calculations,
  onSubmit,
  isProcessing,
  accounts,
  initialPayments = [],
  mode,
}) => {
  const isMobile = useIsMobile();
  const [payments, setPayments] = useState([]);
  const [note, setNote] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("paid");
  const [cashInHand, setCashInHand] = useState(null);

  const { data: modeOfPayments } = useModeOfPayments();

  useEffect(() => {
    if (isOpen && calculations) {
      let cashInHandAccount = accounts?.length
        ? accounts.find((acc) => acc.name.toLowerCase() === "cash in hand")
        : null;
      setCashInHand(cashInHandAccount);

      let defaultMOP = modeOfPayments?.length
        ? modeOfPayments.find((mop) => mop.name.toLowerCase().includes("cash"))
        : null;

      const isEditOrView = mode === "edit" || mode === "view";

      if (isEditOrView) {
        if (initialPayments && initialPayments.length > 0) {
          const mappedPayments = initialPayments.map((p, index) => ({
            id: index,
            mode_of_payment_id: p.mode_of_payment_id || "",
            amount: parseFloat(p.amount).toFixed(2),
            account_id: p.account_id || "",
          }));
          setPayments(mappedPayments);
        } else {
          setPayments([
            {
              id: 0,
              mode_of_payment_id: defaultMOP ? defaultMOP.id : "",
              amount: "0.00",
              account_id: cashInHandAccount ? cashInHandAccount.id : "",
            },
          ]);
        }
      } else {
        setPayments([
          {
            id: 0,
            mode_of_payment_id: defaultMOP ? defaultMOP.id : "",
            amount: (calculations.total ?? 0).toFixed(2),
            account_id: cashInHandAccount ? cashInHandAccount.id : "",
          },
        ]);
      }

      setNote("");
      setPaymentStatus("paid");
    }
  }, [isOpen, calculations, accounts, modeOfPayments, initialPayments, mode]);

  const billTotal = calculations?.total ?? 0;

  const totalTendered = useMemo(
    () =>
      payments
        .filter((p) => parseFloat(p.amount) > 0)
        .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0),
    [payments]
  );

  const changeToReturn = useMemo(
    () => (totalTendered > billTotal ? totalTendered - billTotal : 0),
    [totalTendered, billTotal]
  );

  const remainingBalance = useMemo(
    () => (billTotal > totalTendered ? billTotal - totalTendered : 0),
    [totalTendered, billTotal]
  );

  const handlePaymentChange = (id, field, value) => {
    setPayments(
      payments.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const addPaymentLine = () => {
    const newAmount = remainingBalance > 0 ? remainingBalance.toFixed(2) : "";
    setPayments([
      ...payments,
      {
        id: payments.length + Math.random(),
        mode_of_payment_id: "",
        amount: newAmount,
        account_id: "",
      },
    ]);
  };

  const removePaymentLine = (id) => {
    if (payments.length === 1) return;
    setPayments(payments.filter((p) => p.id !== id));
  };

  const handleSubmit = (print = false) => {
    const invalidLines = payments.filter((p) => !p.mode_of_payment_id);
    if (invalidLines.length > 0) {
      alert("Please select a Mode of Payment for all entries.");
      return;
    }

    const invalidAccounts = payments.filter((p) => !p.account_id);
    if (invalidAccounts.length > 0) {
      alert("Please select an Account for all entries.");
      return;
    }

    let payment_methods = payments.map(
      ({ account_id, amount, mode_of_payment_id }) => ({
        account_id,
        mode_of_payment_id,
        amount: parseFloat(amount) || 0,
      })
    );

    // Subtract change from cash payment for accounting accuracy
    if (changeToReturn > 0) {
      let remainingChangeToDeduct = changeToReturn;
      let deducted = false;

      if (cashInHand) {
        payment_methods = payment_methods.map((p) => {
          if (
            !deducted &&
            p.account_id === cashInHand.id &&
            p.amount >= remainingChangeToDeduct
          ) {
            deducted = true;
            return { ...p, amount: p.amount - remainingChangeToDeduct };
          }
          return p;
        });
      }

      if (!deducted) {
        const maxIndex = payment_methods.reduce(
          (iMax, x, i, arr) => (x.amount > arr[iMax].amount ? i : iMax),
          0
        );

        if (
          payment_methods[maxIndex] &&
          payment_methods[maxIndex].amount >= remainingChangeToDeduct
        ) {
          payment_methods[maxIndex].amount -= remainingChangeToDeduct;
        }
      }
    }

    const netPaidAmount = payment_methods.reduce(
      (sum, p) => sum + (parseFloat(p.amount) || 0),
      0
    );

    const totalAmount = calculations?.total ?? 0;

    let calculatedStatus = "pending";
    if (netPaidAmount >= totalAmount - 0.01) {
      calculatedStatus = "paid";
    } else if (netPaidAmount > 0) {
      calculatedStatus = "partial";
    } else {
      calculatedStatus = "pending"; 
    }

    const payload = {
      paid_amount: netPaidAmount,
      change_return: changeToReturn, // <<< Added change_return to payload
      status: calculatedStatus, 
      note,
      payment_methods,
    };
    onSubmit(payload, print);
  };

  const containerStyle = isMobile
    ? { display: "flex", flexDirection: "column", gap: "20px" }
    : { display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" };

  const summaryStyle = isMobile
    ? { borderTop: "1px solid #e2e8f0", paddingTop: "20px" }
    : {};

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={isMobile ? "full" : "5xl"}>
      <ModalHeader>
        <h2>Make Payment</h2>
      </ModalHeader>
      <ModalBody>
        <div className="payment-modal-layout" style={containerStyle}>
          {/* LEFT COLUMN: Inputs */}
          <div className="payment-inputs-section">
            {!isMobile && (
              <div
                className="payment-header-labels"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.5fr 1fr 1.5fr 40px",
                  gap: "10px",
                  marginBottom: "2px",
                  fontWeight: "400",
                  color: "#2f343aff",
                }}
              >
                <span></span>
              </div>
            )}

            {payments.map((p) => (
              <React.Fragment key={p.id}>
                {isMobile ? (
                  <div
                    className="mobile-payment-card"
                    style={{
                      border: "1px solid #e2e8f0",
                      padding: "12px",
                      borderRadius: "8px",
                      marginBottom: "12px",
                      backgroundColor: "#f8fafc",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "8px",
                        gap: "10px",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: 600,
                            color: "#64748b",
                          }}
                        >
                     
                        </span>
                        <ModeOfPaymentAutoCompleteWithAddOption
                          name="mode_of_payment_id"
                          value={p.mode_of_payment_id}
                          onChange={(e) =>
                            handlePaymentChange(
                              p.id,
                              "mode_of_payment_id",
                              e.target.value
                            )
                          }
                          placeholder="Select Mode"
                        />
                      </div>
                      <button
                        className="delete-btn"
                        onClick={() => removePaymentLine(p.id)}
                        disabled={payments.length === 1}
                        style={{
                          background: "none",
                          border: "none",
                          color: payments.length === 1 ? "#cbd5e1" : "red",
                          padding: "8px",
                        }}
                      >
                        <FaTrash size={18} />
                      </button>
                    </div>

                    <div style={{ display: "flex", gap: "10px" }}>
                      <div style={{ flex: 1 }}>
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: 600,
                            color: "#64748b",
                          }}
                        >
                      
                        </span>
                        <InputField
                        label="Amount"
                          type="number"
                          value={p.amount}
                          onChange={(e) =>
                            handlePaymentChange(p.id, "amount", e.target.value)
                          }
                          disabled={
                            !p.mode_of_payment_id || parseFloat(p.amount) < 0
                          }
                          placeholder="0.00"
                        />
                      </div>

                      <div
                        style={{
                          flex: 1,
                          opacity: !p.mode_of_payment_id ? 0.5 : 1,
                        }}
                      >
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: 600,
                            color: "#64748b",
                          }}
                        >
                        
                        </span>
                        <LedgerAutoCompleteWithAddOptionWithBalance
                          onChange={(e) =>
                            handlePaymentChange(
                              p.id,
                              "account_id",
                              e?.target ? e.target.value : e
                            )
                          }
                          disabled={!p.mode_of_payment_id}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    className="payment-line"
                    style={{
                      opacity: p.amount < 0 ? 0.8 : 1,
                      display: "grid",
                      gridTemplateColumns: "1.5fr 1fr 1.5fr 40px",
                      gap: "10px",
                      marginBottom: "10px",
                      alignItems: "center",
                    }}
                  >
                    <ModeOfPaymentAutoCompleteWithAddOption
                      name="mode_of_payment_id"
                      value={p.mode_of_payment_id}
                      onChange={(e) =>
                        handlePaymentChange(
                          p.id,
                          "mode_of_payment_id",
                          e.target.value
                        )
                      }
                      placeholder="Select Mode"
                    />

                    <InputField
                    label="Amount"
                      type="number"
                      value={p.amount}
                      onChange={(e) =>
                        handlePaymentChange(p.id, "amount", e.target.value)
                      }
                      disabled={
                        !p.mode_of_payment_id || parseFloat(p.amount) < 0
                      }
                      placeholder="0.00"
                    />

                    <LedgerAutoCompleteWithAddOptionWithBalance
                      value={p.account_id}
                      onChange={(e) =>
                        handlePaymentChange(
                          p.id,
                          "account_id",
                          e?.target ? e.target.value : e
                        )
                      }
                      disabled={!p.mode_of_payment_id}
                    />

                    <button
                      className="delete-btn"
                      onClick={() => removePaymentLine(p.id)}
                      disabled={payments.length === 1}
                      style={{
                        background: "none",
                        border: "none",
                        color: "red",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <FaTrash />
                    </button>
                  </div>
                )}
              </React.Fragment>
            ))}

            <div className="payment-actions" style={{ marginTop: "10px" }}>
              <button
                className="add-btn"
                onClick={addPaymentLine}
                disabled={remainingBalance <= 0}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  color: remainingBalance <= 0 ? "#94a3b8" : "#3b82f6",
                  fontWeight: 600,
                  background: "none",
                  border: "none",
                  cursor: remainingBalance <= 0 ? "not-allowed" : "pointer",
                }}
              >
                <FaPlus /> Add Another Payment
              </button>
            </div>

            <div className="note-section" style={{ marginTop: "20px" }}>
              <label
                htmlFor="payment-note"
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: 600,
                }}
              >
                Note:
              </label>
              <textarea
                id="payment-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows="3"
                placeholder="Enter Note"
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "4px",
                }}
              ></textarea>
            </div>
          </div>

          <div
            className="payment-summary-section"
            id="printable-bill-summary"
            style={summaryStyle}
          >
            <h3
              className="print-only-header"
              style={{
                marginBottom: "15px",
                fontSize: "1.25rem",
                fontWeight: "bold",
              }}
            >
              Invoice Summary
            </h3>
            <table
              className="payment-summary-table"
              style={{ width: "100%", borderCollapse: "collapse" }}
            >
              <tbody>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "8px 0" }}>Total Products</td>
                  <td style={{ textAlign: "right", padding: "8px 0" }}>
                    <span className="summary-value">
                      {(calculations?.totalQty ?? 0).toFixed(2)}
                    </span>
                  </td>
                </tr>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "8px 0" }}>Total Amount</td>
                  <td style={{ textAlign: "right", padding: "8px 0" }}>
                    <AmountSymbol>{calculations?.subTotal ?? 0}</AmountSymbol>
                  </td>
                </tr>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "8px 0" }}>Order Tax</td>
                  <td style={{ textAlign: "right", padding: "8px 0" }}>
                    <AmountSymbol>{calculations?.taxAmount ?? 0}</AmountSymbol>
                  </td>
                </tr>
                <tr
                  className="grand-total"
                  style={{
                    fontWeight: "bold",
                    fontSize: "1.1em",
                    borderBottom: "1px solid #cbd5e1",
                  }}
                >
                  <td style={{ padding: "12px 0" }}>Grand Total</td>
                  <td style={{ textAlign: "right", padding: "12px 0" }}>
                    <AmountSymbol>{billTotal}</AmountSymbol>
                  </td>
                </tr>
                <tr style={{ color: changeToReturn > 0 ? "green" : "inherit" }}>
                  <td style={{ padding: "12px 0" }}>Change Return</td>
                  <td style={{ textAlign: "right", padding: "12px 0" }}>
                    <AmountSymbol>{changeToReturn ?? 0}</AmountSymbol>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <HStack
          style={
            isMobile
              ? { flexDirection: "column", width: "100%", gap: "10px" }
              : {}
          }
        >
          <button
            className="btn-primary"
            onClick={() => handleSubmit(false)}
            disabled={isProcessing}
            style={isMobile ? { width: "100%" } : {}}
          >
            {isProcessing ? "Submitting..." : "Submit"}
          </button>
          <button
            className="btn-primary"
            onClick={() => handleSubmit(true)}
            disabled={isProcessing}
            style={isMobile ? { width: "100%" } : {}}
          >
            Submit & Print
          </button>
          <button
            className="btn-secondary"
            onClick={onClose}
            style={isMobile ? { width: "100%" } : {}}
          >
            Cancel
          </button>
        </HStack>
      </ModalFooter>
    </Modal>
  );
};

export default PaymentModal;