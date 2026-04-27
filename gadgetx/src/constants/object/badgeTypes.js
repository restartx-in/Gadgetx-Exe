
export const BADGE_TYPES = {
  /* ---------------- Payment Status ---------------- */
  paymentStatus: {
    paid: "text-badge--positive",
    partial: "text-badge--neutral",
    unpaid: "text-badge--negative",
    pending: "text-badge--negative",
    refunded: "text-badge--positive",
  },

  /* ---------------- Transaction Type ---------------- */
  transactionType: {
    sale: "text-badge--positive",
    service: "text-badge--positive",
    deposit: "text-badge--positive",
    finance: "text-badge--positive",
    received: "text-badge--positive",
    receive: "text-badge--positive",    
    subscription: "text-badge--positive",
    pt_booking: "text-badge--positive",
    flight_ticket: "text-badge--positive",
    visa: "text-badge--positive",
    advance: "text-badge--positive",
    partnership: "text-badge--positive",

    // Neutral
    purchase: "text-badge--neutral",
    sale_return: "text-badge--neutral",
    purchase_return: "text-badge--positive",
    partnership_profit: "text-badge--neutral",

    // Negative
    expense: "text-badge--negative",
    withdrawal: "text-badge--negative",
    payroll: "text-badge--negative",
    brokerage: "text-badge--negative",
    flight_ticket_return: "text-badge--negative",
    visa_return: "text-badge--negative",
    service_return:"text-badge--negative",

    // Info
    transfer: "text-badge--info",
  },

  /* ---------------- Account Type ---------------- */
  accountType: {
    cash: "text-badge--info",
    bank: "text-badge--positive",
  },

  /* ---------------- Job Sheet Status ---------------- */
  jobSheetStatus: {
    completed: "text-badge--positive",
    "in progress": "text-badge--neutral",
    pending: "text-badge--neutral",
    cancelled: "text-badge--negative",
  },

  /* ---------------- General Status ---------------- */
  status: {
    active: "text-badge--positive",
    inactive: "text-badge--negative",
  },

  /* ---------------- Order Status ---------------- */
  orderStatus: {
    completed: "text-badge--positive",
    pending: "text-badge--neutral",
  },
};
