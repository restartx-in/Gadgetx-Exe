import React, { useState, useEffect, useMemo } from "react";
import { FaPlus, FaTrash } from "react-icons/fa";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/Modal";
import HStack from "@/components/HStack";
import InputField from "@/components/InputField";
import AmountSymbol from "@/apps/user/components/AmountSymbol";
import { useModeOfPayments } from "@/apps/user/hooks/api/modeOfPayment/useModeOfPayments";
import { useIsMobile } from "@/utils/useIsMobile";
import { useToast } from "@/context/ToastContext";
import { TOASTSTATUS, TOASTTYPE } from "@/constants/object/toastType";

const PAYMENT_PREF_KEY = "gadgetx_pos_recent_payment_pref";

const getStoredPaymentPreference = () => {
  try {
    const raw = localStorage.getItem(PAYMENT_PREF_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.mode_of_payment_id || !parsed?.account_id) return null;
    return parsed;
  } catch {
    return null;
  }
};

const PaymentModal = ({
  isOpen,
  onClose,
  calculations,
  onSubmit,
  isProcessing,
  accounts,
  initialPayments = [],
  mode,
  currentSession,
}) => {
  const isMobile = useIsMobile();
  const showToast = useToast();
  const [payments, setPayments] = useState([]);
  const [note, setNote] = useState("");
  const [validationError, setValidationError] = useState("");
  const [activePaymentId, setActivePaymentId] = useState(null);
  const [recentPaymentPref, setRecentPaymentPref] = useState(null);
  const [saveAsDefault, setSaveAsDefault] = useState(true);

  const { data: modeOfPayments } = useModeOfPayments();

  const activeSessionLedgerId = useMemo(() => {
    if (currentSession?.session?.ledger_id) {
      return currentSession.session.ledger_id;
    }
    const cashInHand = accounts?.find(
      (acc) => acc.name.toLowerCase() === "cash in hand",
    );
    return cashInHand?.id || "";
  }, [currentSession, accounts]);

  const cashModeId = useMemo(() => {
    const cashMode = modeOfPayments?.find((mop) =>
      mop.name?.toLowerCase().includes("cash"),
    );
    return cashMode?.id || "";
  }, [modeOfPayments]);

  const cardModeId = useMemo(() => {
    const cardMode = modeOfPayments?.find((mop) => {
      const name = mop.name?.toLowerCase() || "";
      return (
        name.includes("card") ||
        name.includes("credit") ||
        name.includes("debit")
      );
    });
    return cardMode?.id || "";
  }, [modeOfPayments]);

  const notifyLedgerNotConnected = (modeName = "") => {
    const readableName = modeName || "Selected mode";
    showToast({
      type: TOASTTYPE.GENARAL,
      message: `${readableName} is not connected to a ledger. Please set Default Ledger in Mode of Payments.`,
      status: TOASTSTATUS.WARNING,
    });
  };

  const handleSelectModeForPayment = (paymentId, selectedMode) => {
    if (!selectedMode) return;

    const defaultLedgerId = selectedMode?.default_ledger_id || "";

    setActivePaymentId(paymentId);
    setValidationError("");
    setPayments((prev) =>
      prev.map((p) =>
        p.id === paymentId
          ? {
              ...p,
              mode_of_payment_id: selectedMode.id,
              account_id: defaultLedgerId,
            }
          : p,
      ),
    );

    if (!defaultLedgerId) {
      notifyLedgerNotConnected(selectedMode?.name);
    }
  };

  useEffect(() => {
    if (isOpen && calculations) {
      const storedPref = getStoredPaymentPreference();
      setRecentPaymentPref(storedPref);

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
          setActivePaymentId(mappedPayments[0]?.id ?? null);
        } else {
          const defaultPayments = [
            {
              id: 0,
              mode_of_payment_id: defaultMOP ? defaultMOP.id : "",
              amount: "0.00",
              account_id: activeSessionLedgerId,
            },
          ];
          setPayments(defaultPayments);
          setActivePaymentId(defaultPayments[0].id);
        }
      } else {
        const preferredModeId =
          storedPref?.mode_of_payment_id || (defaultMOP ? defaultMOP.id : "");
        const modeFromPref = modeOfPayments?.find(
          (mop) => String(mop.id) === String(preferredModeId),
        );
        const preferredLedgerId =
          storedPref?.account_id || modeFromPref?.default_ledger_id || "";

        const defaultPayments = [
          {
            id: 0,
            mode_of_payment_id: preferredModeId,
            amount: (calculations.total ?? 0).toFixed(2),
            account_id: preferredLedgerId,
          },
        ];
        setPayments(defaultPayments);
        setActivePaymentId(defaultPayments[0].id);
      }

      setNote("");
      setValidationError("");
      setSaveAsDefault(true);
    }
  }, [
    isOpen,
    calculations,
    accounts,
    modeOfPayments,
    initialPayments,
    mode,
    activeSessionLedgerId,
  ]);

  const billTotal = calculations?.total ?? 0;

  const totalTendered = useMemo(
    () =>
      payments
        .filter((p) => parseFloat(p.amount) > 0)
        .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0),
    [payments],
  );

  const changeToReturn = useMemo(
    () => (totalTendered > billTotal ? totalTendered - billTotal : 0),
    [totalTendered, billTotal],
  );

  const remainingBalance = useMemo(
    () => (billTotal > totalTendered ? billTotal - totalTendered : 0),
    [totalTendered, billTotal],
  );

  const handlePaymentChange = (id, field, value) => {
    setActivePaymentId(id);
    setValidationError("");
    setPayments((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    );
  };

  const applyModePreset = (modeType, targetId = null) => {
    const idToUpdate = targetId ?? activePaymentId ?? payments[0]?.id;
    if (idToUpdate === null || idToUpdate === undefined) return;

    const nextModeId = modeType === "cash" ? cashModeId : cardModeId;
    const selectedMode = modeOfPayments?.find(
      (mop) => String(mop.id) === String(nextModeId),
    );
    if (!selectedMode) return;
    handleSelectModeForPayment(idToUpdate, selectedMode);
  };

  const addPaymentLine = () => {
    const newAmount = remainingBalance > 0 ? remainingBalance.toFixed(2) : "";
    const newId = payments.length + Math.random();
    setPayments([
      ...payments,
      {
        id: newId,
        mode_of_payment_id: "",
        amount: newAmount,
        account_id: "",
      },
    ]);
    setActivePaymentId(newId);
  };

  const applyRecentlyUsedPreference = () => {
    if (!recentPaymentPref) return;
    const targetId = activePaymentId ?? payments[0]?.id;
    if (targetId === null || targetId === undefined) return;

    setPayments((prev) =>
      prev.map((p) =>
        p.id === targetId
          ? {
              ...p,
              mode_of_payment_id:
                recentPaymentPref.mode_of_payment_id || p.mode_of_payment_id,
              account_id: recentPaymentPref.account_id || p.account_id,
            }
          : p,
      ),
    );
  };

  const persistRecentPreference = (paymentMethods) => {
    const candidate = [...paymentMethods]
      .sort((a, b) => (b.amount || 0) - (a.amount || 0))
      .find((p) => p.mode_of_payment_id && p.account_id);

    if (!candidate) return;

    const preference = {
      mode_of_payment_id: candidate.mode_of_payment_id,
      account_id: candidate.account_id,
      updated_at: Date.now(),
    };

    try {
      localStorage.setItem(PAYMENT_PREF_KEY, JSON.stringify(preference));
      setRecentPaymentPref(preference);
    } catch {
      // Ignore storage write failures
    }
  };

  const removePaymentLine = (id) => {
    if (payments.length === 1) return;
    const nextPayments = payments.filter((p) => p.id !== id);
    setPayments(nextPayments);
    if (activePaymentId === id) {
      setActivePaymentId(nextPayments[0]?.id ?? null);
    }
  };

  const quickTenderAmount = (mode) => {
    const total = Number(billTotal) || 0;
    if (mode === "exact") return total;
    if (mode === "up5") return Math.ceil(total / 5) * 5;
    if (mode === "up10") return Math.ceil(total / 10) * 10;
    if (mode === "up20") return Math.ceil(total / 20) * 20;
    return total;
  };

  const applyQuickTender = (mode) => {
    const amount = quickTenderAmount(mode);
    const targetId = activePaymentId ?? payments[0]?.id;
    if (targetId === null || targetId === undefined) return;

    setValidationError("");
    
    // Apply amount first
    setPayments((prev) =>
      prev.map((p) =>
        p.id === targetId
          ? { ...p, amount: amount.toFixed(2) }
          : p,
      ),
    );

    // Apply mode preset (which enforces ledger)
    if (mode === "cash") {
      applyModePreset("cash", targetId);
    }
  };

  const handleSubmit = (print = false) => {
    const invalidLines = payments.filter((p) => !p.mode_of_payment_id);
    if (invalidLines.length > 0) {
      setValidationError("Please select a mode of payment for all entries.");
      return;
    }

    const invalidAccounts = payments.filter((p) => !p.account_id);
    if (invalidAccounts.length > 0) {
      setValidationError(
        "Selected mode is not connected to ledger. Please set Default Ledger in Mode of Payments.",
      );
      showToast({
        type: TOASTTYPE.GENARAL,
        message:
          "One or more selected payment modes are not connected to ledger. Please set Default Ledger in Mode of Payments.",
        status: TOASTSTATUS.WARNING,
      });
      return;
    }

    setValidationError("");

    let payment_methods = payments.map(
      ({ account_id, amount, mode_of_payment_id }) => ({
        account_id,
        mode_of_payment_id,
        amount: parseFloat(amount) || 0,
      }),
    );

    if (changeToReturn > 0) {
      let remainingChangeToDeduct = changeToReturn;

      // Try to deduct from session ledger first (usually cash)
      for (let i = 0; i < payment_methods.length; i++) {
        if (payment_methods[i].account_id === activeSessionLedgerId) {
          if (payment_methods[i].amount >= remainingChangeToDeduct) {
            payment_methods[i].amount -= remainingChangeToDeduct;
            remainingChangeToDeduct = 0;
            break;
          } else {
            remainingChangeToDeduct -= payment_methods[i].amount;
            payment_methods[i].amount = 0;
          }
        }
      }

      // If still have change to deduct, try highest amount payment method
      if (remainingChangeToDeduct > 0) {
        const maxIndex = payment_methods.reduce(
          (iMax, x, i, arr) => (x.amount > arr[iMax].amount ? i : iMax),
          0,
        );

        if (payment_methods[maxIndex] && payment_methods[maxIndex].amount >= remainingChangeToDeduct) {
          payment_methods[maxIndex].amount -= remainingChangeToDeduct;
        }
      }
    }

    const netPaidAmount = payment_methods.reduce(
      (sum, p) => sum + (parseFloat(p.amount) || 0),
      0,
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
      change_return: changeToReturn,
      status: calculatedStatus,
      note,
      payment_methods,
    };

    if (saveAsDefault) {
      persistRecentPreference(payment_methods);
    }

    onSubmit(payload, print);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.altKey && (e.key === "c" || e.key === "C")) {
        e.preventDefault();
        applyModePreset("cash");
        return;
      }

      if (e.altKey && (e.key === "d" || e.key === "D")) {
        e.preventDefault();
        applyModePreset("card");
        return;
      }

      if (e.key !== "Enter" || e.shiftKey) return;
      const tag = e.target?.tagName;
      if (tag === "TEXTAREA") return;
      e.preventDefault();
      e.stopPropagation();
      e.nativeEvent?.stopImmediatePropagation?.();
      if (!isProcessing) {
        handleSubmit(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [isOpen, isProcessing, handleSubmit, applyModePreset]);

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
          <div className="payment-inputs-section">
            {payments.map((p, index) => (
              <div
                key={p.id}
                className={`payment-method-card ${
                  activePaymentId === p.id ? "is-active" : ""
                }`}
                onClick={() => setActivePaymentId(p.id)}
              >
                <div className="payment-method-card__header">
                  <span className="payment-method-card__title">
                    Payment #{index + 1}
                  </span>
                  <button
                    className="delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      removePaymentLine(p.id);
                    }}
                    disabled={payments.length === 1}
                    title="Remove payment line"
                  >
                    <FaTrash />
                  </button>
                </div>

                <div className="payment-method-card__fields">
                  <div className="payment-mode-options" role="radiogroup">
                    {modeOfPayments?.map((modeOption) => {
                      const isSelected =
                        String(p.mode_of_payment_id) ===
                        String(modeOption.id);
                      return (
                        <button
                          key={modeOption.id}
                          type="button"
                          className={`mode-option-btn ${
                            isSelected ? "active" : ""
                          }`}
                          onClick={() =>
                            handleSelectModeForPayment(p.id, modeOption)
                          }
                          title={
                            modeOption.default_ledger_id
                              ? `Linked ledger: ${modeOption.default_ledger_name || "Configured"}`
                              : "No default ledger linked"
                          }
                        >
                          {modeOption.name}
                        </button>
                      );
                    })}
                  </div>

                  <InputField
                    label="Amount"
                    type="number"
                    value={p.amount}
                    onChange={(e) =>
                      handlePaymentChange(p.id, "amount", e.target.value)
                    }
                    disabled={!p.mode_of_payment_id || parseFloat(p.amount) < 0}
                    placeholder="0.00"
                  />
                </div>
              </div>
            ))}

            <div className="payment-actions" style={{ marginTop: "10px" }}>
              <div className="payment-default-row">
                {recentPaymentPref && (
                  <button
                    type="button"
                    className="quick-tender-btn quick-tender-btn--recent"
                    onClick={applyRecentlyUsedPreference}
                  >
                    Use Recently Used
                  </button>
                )}

                <label className="default-preference-check">
                  <input
                    type="checkbox"
                    checked={saveAsDefault}
                    onChange={(e) => setSaveAsDefault(e.target.checked)}
                  />
                  Save this as default
                </label>
              </div>

              <div className="quick-tender-actions">
                <button
                  type="button"
                  className="quick-tender-btn quick-tender-btn--cash"
                  onClick={() => applyModePreset("cash")}
                >
                  Cash (Alt+C)
                </button>
                <button
                  type="button"
                  className="quick-tender-btn quick-tender-btn--recent"
                  onClick={() => applyModePreset("card")}
                >
                  Card (Alt+D)
                </button>
                <button
                  type="button"
                  className="quick-tender-btn"
                  onClick={() => applyQuickTender("exact")}
                >
                  Exact
                </button>
                <button
                  type="button"
                  className="quick-tender-btn"
                  onClick={() => applyQuickTender("up5")}
                >
                  +5
                </button>
                <button
                  type="button"
                  className="quick-tender-btn"
                  onClick={() => applyQuickTender("up10")}
                >
                  +10
                </button>
                <button
                  type="button"
                  className="quick-tender-btn"
                  onClick={() => applyQuickTender("up20")}
                >
                  +20
                </button>
                <button
                  type="button"
                  className="quick-tender-btn quick-tender-btn--cash"
                  onClick={() => applyQuickTender("cash")}
                >
                  Cash
                </button>
              </div>

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

              {validationError && (
                <p className="payment-validation-error">{validationError}</p>
              )}
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
            {/* ... Summary Table Content ... */}
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
            Submit & Print (Enter)
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
