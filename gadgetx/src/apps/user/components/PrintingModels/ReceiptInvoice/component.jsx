import React from "react";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Image,
  Font,
} from "@react-pdf/renderer";

// --- Font Registration ---
// This assumes you have the FRESHLY DOWNLOADED font file at /public/fonts/Amiri-Regular.ttf
Font.register({
  family: "Helvetica",
  fonts: [
    { src: "https://fonts.gstatic.com/s/helvetica/v1/Helvetica.ttf" },
    {
      src: "https://fonts.gstatic.com/s/helvetica/v1/Helvetica-Bold.ttf",
      fontWeight: "bold",
    },
  ],
});
Font.register({
  family: "Amiri",
  src: "/fonts/Amiri-Regular.ttf",
});

// --- Automatic Translations for Static Labels ---
const translations = {
  invoice: "فاتورة",
  invoiceNo: "رقم الفاتورة",
  date: "التاريخ",
  status: "الحالة",
  paid: "مدفوع",
  pending: "قيد الانتظار",
  billTo: "الفاتورة إلى",
  itemNo: "#",
  itemDescription: "وصف السلعة",
  qty: "الكمية",
  price: "السعر",
  total: "المجموع",
  subTotal: "المجموع الفرعي",
  tax: "ضريبة",
  discount: "خصم",
  shipping: "شحن",
  grandTotal: "المجموع الإجمالي",
  paidAmount: "المبلغ المدفوع",
  balanceDue: "الرصيد المستحق",
  terms: "الأحكام والشروط",
  generated: "فاتورة صادرة من الحاسوب",
};

// Helper: Currency Formatter
const formatCurrency = (amount) => {
  const numericAmount = parseFloat(amount) || 0;
  return numericAmount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// --- A4 Styles ---
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    lineHeight: 1.5,
    color: "#333",
    backgroundColor: "#fff",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eaeaea",
    paddingBottom: 15,
  },
  logoColumn: { width: "55%" },
  logoImage: {
    height: 50,
    objectFit: "contain",
    marginBottom: 10,
    alignSelf: "flex-start",
  },
  companyName: {
    fontSize: 14,
    fontWeight: "bold",
    textTransform: "uppercase",
    color: "#111",
  },
  companyDetails: { fontSize: 9, color: "#555" },
  invoiceMetaColumn: { width: "40%", alignItems: "flex-end" },
  invoiceTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111",
    textTransform: "uppercase",
    marginBottom: 5,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 4,
  },
  metaLabel: {
    fontWeight: "bold",
    marginRight: 8,
    color: "#555",
    fontSize: 10,
  },
  metaValue: { color: "#111" },
  billToContainer: {
    marginTop: 10,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  billToBlock: { width: "50%" },
  sectionTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#888",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  customerName: { fontSize: 11, fontWeight: "bold", color: "#000" },
  tableContainer: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#eaeaea",
    borderRadius: 2,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f6f6f6",
    borderBottomWidth: 1,
    borderBottomColor: "#eaeaea",
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eaeaea",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  colSl: { width: "8%", textAlign: "center" },
  colDesc: { width: "52%" },
  colQty: { width: "10%", textAlign: "center" },
  colPrice: { width: "15%", textAlign: "right" },
  colTotal: { width: "15%", textAlign: "right" },
  tableHeaderText: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  tableCellText: { fontSize: 9, color: "#333" },
  summaryContainer: {
    flexDirection: "row",
    marginTop: 20,
    justifyContent: "space-between",
  },
  leftFooter: { width: "60%", paddingRight: 20 },
  notesTitle: { fontSize: 9, fontWeight: "bold", marginBottom: 5 },
  notesText: {
    fontSize: 8,
    color: "#666",
    fontStyle: "italic",
    lineHeight: 1.4,
  },
  rightFooter: { width: "35%" },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    alignItems: "center",
  },
  summaryLabel: { fontSize: 10, color: "#555" },
  summaryValue: { fontSize: 10, fontWeight: "bold", color: "#111" },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    borderTopWidth: 2,
    borderTopColor: "#333",
    paddingTop: 8,
    alignItems: "center",
  },
  grandTotalLabel: { fontSize: 12, fontWeight: "bold", color: "#000" },
  grandTotalValue: { fontSize: 14, fontWeight: "bold", color: "#000" },
  qrContainer: { marginTop: 15 },
  qrImage: { width: 70, height: 70 },
  footerMessage: {
    marginTop: 30,
    textAlign: "center",
    fontSize: 8,
    color: "#999",
    borderTopWidth: 1,
    borderTopColor: "#eaeaea",
    paddingTop: 10,
  },
  arabicText: { fontFamily: "Amiri" },
});

const ReceiptInvoice = ({ transactionData }) => {
  if (!transactionData || !transactionData.store) {
    return null;
  }

  const { store, partner, items, summary, payment } = transactionData;

  const subTotal = parseFloat(summary?.subTotal) || 0;
  const tax = parseFloat(summary?.orderTax) || 0;
  const discount = parseFloat(summary?.discount) || 0;
  const shipping = parseFloat(summary?.shipping) || 0;
  const grandTotal = parseFloat(summary?.grandTotal) || 0;
  const paid = parseFloat(payment?.amountPaid) || 0;
  const balance = grandTotal - paid;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* --- HEADER --- */}
        <View style={styles.headerContainer}>
          <View style={styles.logoColumn}>
            {store?.full_header_image_url && (
              <Image
                src={store.full_header_image_url}
                style={styles.logoImage}
              />
            )}
            <Text style={styles.companyName}>{store?.company_name}</Text>
            <Text style={styles.companyDetails}>{store?.address}</Text>
            <Text style={styles.companyDetails}>{store?.email}</Text>
            <Text style={styles.companyDetails}>{store?.phone}</Text>
            {store?.tr_number && (
              <Text style={styles.companyDetails}>TRN: {store.tr_number}</Text>
            )}
          </View>
          <View style={styles.invoiceMetaColumn}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            {store?.show_arabic_translations && (
              <Text
                style={[
                  styles.invoiceTitle,
                  styles.arabicText,
                  { marginBottom: 10 },
                ]}
              >
                {translations.invoice}
              </Text>
            )}
            <View style={styles.metaRow}>
              <View>
                <Text style={styles.metaLabel}>Invoice #:</Text>
                {store?.show_arabic_translations && (
                  <Text style={styles.arabicText}>
                    {translations.invoiceNo}
                  </Text>
                )}
              </View>
              <Text style={styles.metaValue}>{transactionData.id}</Text>
            </View>
            <View style={styles.metaRow}>
              <View>
                <Text style={styles.metaLabel}>Date:</Text>
                {store?.show_arabic_translations && (
                  <Text style={styles.arabicText}>{translations.date}</Text>
                )}
              </View>
              <Text style={styles.metaValue}>
                {new Date(transactionData.date).toLocaleDateString("en-GB")}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <View>
                <Text style={styles.metaLabel}>Status:</Text>
                {store?.show_arabic_translations && (
                  <Text style={styles.arabicText}>{translations.status}</Text>
                )}
              </View>
              <Text
                style={{
                  ...styles.metaValue,
                  color: paid >= grandTotal ? "green" : "red",
                }}
              >
                {paid >= grandTotal ? "PAID" : "PENDING"}
                {store?.show_arabic_translations && (
                  <Text style={styles.arabicText}>
                    {paid >= grandTotal
                      ? ` (${translations.paid})`
                      : ` (${translations.pending})`}
                  </Text>
                )}
              </Text>
            </View>
          </View>
        </View>

        {/* --- BILL TO --- */}
        {partner && (
          <View style={styles.billToContainer}>
            <View style={styles.billToBlock}>
              <Text style={styles.sectionTitle}>
                Bill To:{" "}
                {store?.show_arabic_translations && (
                  <Text style={styles.arabicText}>{translations.billTo}</Text>
                )}
              </Text>
              <Text style={styles.customerName}>{partner.name}</Text>
              {partner.phone && (
                <Text style={styles.companyDetails}>Ph: {partner.phone}</Text>
              )}
              {partner.address && (
                <Text style={styles.companyDetails}>{partner.address}</Text>
              )}
            </View>
          </View>
        )}

        {/* --- TABLE --- */}
        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <View style={styles.colSl}>
              <Text style={styles.tableHeaderText}>#</Text>
              {store?.show_arabic_translations && (
                <Text style={styles.arabicText}>{translations.itemNo}</Text>
              )}
            </View>
            <View style={styles.colDesc}>
              <Text style={styles.tableHeaderText}>Item Description</Text>
              {store?.show_arabic_translations && (
                <Text style={styles.arabicText}>
                  {translations.itemDescription}
                </Text>
              )}
            </View>
            <View style={styles.colQty}>
              <Text style={styles.tableHeaderText}>Qty</Text>
              {store?.show_arabic_translations && (
                <Text style={styles.arabicText}>{translations.qty}</Text>
              )}
            </View>
            <View style={styles.colPrice}>
              <Text style={styles.tableHeaderText}>Price</Text>
              {store?.show_arabic_translations && (
                <Text style={styles.arabicText}>{translations.price}</Text>
              )}
            </View>
            <View style={styles.colTotal}>
              <Text style={styles.tableHeaderText}>Total</Text>
              {store?.show_arabic_translations && (
                <Text style={styles.arabicText}>{translations.total}</Text>
              )}
            </View>
          </View>
          {items?.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.colSl, styles.tableCellText]}>
                {index + 1}
              </Text>
              <Text style={[styles.colDesc, styles.tableCellText]}>
                {item.name}
              </Text>
              <Text style={[styles.colQty, styles.tableCellText]}>
                {item.quantity}
              </Text>
              <Text style={[styles.colPrice, styles.tableCellText]}>
                {formatCurrency(item.price)}
              </Text>
              <Text style={[styles.colTotal, styles.tableCellText]}>
                {formatCurrency(item.quantity * item.price)}
              </Text>
            </View>
          ))}
        </View>

        {/* --- FOOTER / TOTALS --- */}
        <View style={styles.summaryContainer}>
          <View style={styles.leftFooter}>
            <Text style={styles.notesTitle}>
              Terms & Conditions:{" "}
              {store?.show_arabic_translations && (
                <Text style={styles.arabicText}>{translations.terms}</Text>
              )}
            </Text>
            <Text style={styles.notesText}>
              {store?.footer_message ||
                "Thank you for your business. Goods once sold will not be taken back."}
            </Text>
            {store?.full_qr_image_url && (
              <View style={styles.qrContainer}>
                <Image src={store.full_qr_image_url} style={styles.qrImage} />
              </View>
            )}
          </View>
          <View style={styles.rightFooter}>
            <View style={styles.summaryRow}>
              <View>
                <Text style={styles.summaryLabel}>Sub Total:</Text>
                {store?.show_arabic_translations && (
                  <Text style={styles.arabicText}>{translations.subTotal}</Text>
                )}
              </View>
              <Text style={styles.summaryValue}>
                {formatCurrency(subTotal)}
              </Text>
            </View>
            {tax > 0 && (
              <View style={styles.summaryRow}>
                <View>
                  <Text style={styles.summaryLabel}>Tax:</Text>
                  {store?.show_arabic_translations && (
                    <Text style={styles.arabicText}>{translations.tax}</Text>
                  )}
                </View>
                <Text style={styles.summaryValue}>{formatCurrency(tax)}</Text>
              </View>
            )}
            {discount > 0 && (
              <View style={styles.summaryRow}>
                <View>
                  <Text style={styles.summaryLabel}>Discount:</Text>
                  {store?.show_arabic_translations && (
                    <Text style={styles.arabicText}>
                      {translations.discount}
                    </Text>
                  )}
                </View>
                <Text style={styles.summaryValue}>
                  - {formatCurrency(discount)}
                </Text>
              </View>
            )}
            {shipping > 0 && (
              <View style={styles.summaryRow}>
                <View>
                  <Text style={styles.summaryLabel}>Shipping:</Text>
                  {store?.show_arabic_translations && (
                    <Text style={styles.arabicText}>
                      {translations.shipping}
                    </Text>
                  )}
                </View>
                <Text style={styles.summaryValue}>
                  {formatCurrency(shipping)}
                </Text>
              </View>
            )}
            <View style={styles.grandTotalRow}>
              <View>
                <Text style={styles.grandTotalLabel}>Total:</Text>
                {store?.show_arabic_translations && (
                  <Text style={[styles.arabicText, { fontSize: 10 }]}>
                    {translations.grandTotal}
                  </Text>
                )}
              </View>
              <Text style={styles.grandTotalValue}>
                {formatCurrency(grandTotal)}
              </Text>
            </View>
            <View
              style={{
                marginTop: 8,
                paddingTop: 8,
                borderTopWidth: 1,
                borderTopColor: "#eaeaea",
              }}
            >
              <View style={styles.summaryRow}>
                <View>
                  <Text style={styles.summaryLabel}>Paid:</Text>
                  {store?.show_arabic_translations && (
                    <Text style={styles.arabicText}>
                      {translations.paidAmount}
                    </Text>
                  )}
                </View>
                <Text style={styles.summaryValue}>{formatCurrency(paid)}</Text>
              </View>
              {balance > 0.01 && (
                <View style={styles.summaryRow}>
                  <View>
                    <Text
                      style={{
                        ...styles.summaryLabel,
                        color: "red",
                        fontWeight: "bold",
                      }}
                    >
                      Balance Due:
                    </Text>
                    {store?.show_arabic_translations && (
                      <Text style={[styles.arabicText, { color: "red" }]}>
                        {translations.balanceDue}
                      </Text>
                    )}
                  </View>
                  <Text style={{ ...styles.summaryValue, color: "red" }}>
                    {formatCurrency(balance)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <Text style={styles.footerMessage}>
          Computer Generated Invoice{" "}
          {store?.show_arabic_translations && (
            <Text style={styles.arabicText}>- {translations.generated}</Text>
          )}
        </Text>
      </Page>
    </Document>
  );
};

export default ReceiptInvoice;
