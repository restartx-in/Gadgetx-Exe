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

// Register a standard font if needed, otherwise Helvetica is default
Font.register({
  family: "Helvetica",
  fonts: [
    { src: "https://fonts.gstatic.com/s/helvetica/v1/Helvetica.ttf" }, // Regular
    {
      src: "https://fonts.gstatic.com/s/helvetica/v1/Helvetica-Bold.ttf",
      fontWeight: "bold",
    },
  ],
});

// Helper for currency
const formatCurrency = (amount) => {
  const numericAmount = parseFloat(amount) || 0;
  return numericAmount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    lineHeight: 1.5,
    color: "#333",
  },
  
  // --- Header Section ---
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 20,
  },
  logoSection: {
    width: "50%",
  },
  logo: {
    width: 100, // Adjust based on your logo aspect ratio
    height: 50,
    objectFit: "contain",
    marginBottom: 10,
  },
  companyName: {
    fontSize: 14,
    fontWeight: "bold",
    textTransform: "uppercase",
    color: "#000",
  },
  companyInfo: {
    fontSize: 9,
    color: "#555",
  },

  invoiceMeta: {
    width: "40%",
    textAlign: "right",
  },
  invoiceTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 4,
  },
  metaLabel: {
    fontWeight: "bold",
    marginRight: 8,
    color: "#555",
  },
  metaValue: {
    color: "#000",
  },

  // --- Bill To Section ---
  billTo: {
    marginTop: 10,
    marginBottom: 20,
  },
  billToLabel: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#777",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  billToName: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#000",
  },

  // --- Table Section ---
  table: {
    width: "100%",
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f9f9f9",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  // Column Widths
  colSl: { width: "8%", textAlign: "center" },
  colDesc: { width: "52%", textAlign: "left" },
  colQty: { width: "10%", textAlign: "center" },
  colPrice: { width: "15%", textAlign: "right" },
  colTotal: { width: "15%", textAlign: "right" },
  
  // Table Text Styles
  headerText: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#333",
  },
  bodyText: {
    fontSize: 9,
  },

  // --- Footer Summary ---
  footerSection: {
    flexDirection: "row",
    marginTop: 20,
    justifyContent: "space-between",
  },
  
  // Bottom Left (QR, Payment Info, Notes)
  footerLeft: {
    width: "55%",
    paddingRight: 20,
  },
  notesTitle: {
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 4,
  },
  notesText: {
    fontSize: 8,
    color: "#555",
    fontStyle: "italic",
  },
  qrContainer: {
    marginTop: 15,
  },
  qrImage: {
    width: 80,
    height: 80,
  },

  // Bottom Right (Totals)
  footerRight: {
    width: "40%",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
    paddingVertical: 2,
  },
  summaryLabel: {
    fontSize: 10,
  },
  summaryValue: {
    fontSize: 10,
    fontWeight: "bold",
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    borderTopWidth: 2,
    borderTopColor: "#333",
    paddingTop: 8,
  },
  grandTotalLabel: {
    fontSize: 12,
    fontWeight: "bold",
  },
  grandTotalValue: {
    fontSize: 14,
    fontWeight: "bold",
  },
  
  // Barcode
  barcodeContainer: {
    marginTop: 30,
    alignItems: "center",
  },
  barcodeImage: {
    width: 150,
    height: 40,
    objectFit: "fill"
  },
  thankYou: {
    marginTop: 10,
    textAlign: "center",
    fontSize: 9,
    color: "#777",
  }
});

const ReceiptPDF = ({ transactionData, barcodeImage }) => {
  if (!transactionData) return null;

  const { store, partner, summary, payment, items } = transactionData;

  // Calculations
  const numericSubTotal = parseFloat(summary?.subTotal) || 0;
  const numericTax = parseFloat(summary?.orderTax) || 0;
  const numericDiscount = parseFloat(summary?.discount) || 0;
  const numericShipping = parseFloat(summary?.shipping) || 0;
  const grandTotal = parseFloat(summary?.grandTotal) || 0;
  const numericPaid = parseFloat(payment?.amountPaid) || 0;
  const balance = grandTotal - numericPaid;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* HEADER */}
        <View style={styles.header}>
          {/* Company Info */}
          <View style={styles.logoSection}>
            {store?.full_header_image_url && (
              <Image src={store.full_header_image_url} style={styles.logo} />
            )}
            <Text style={styles.companyName}>{store?.company_name}</Text>
            <Text style={styles.companyInfo}>{store?.address}</Text>
            <Text style={styles.companyInfo}>{store?.email}</Text>
            <Text style={styles.companyInfo}>{store?.phone}</Text>
            {store?.tr_number && <Text style={styles.companyInfo}>TRN: {store.tr_number}</Text>}
          </View>

          {/* Invoice Meta */}
          <View style={styles.invoiceMeta}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Invoice No:</Text>
              <Text style={styles.metaValue}>{transactionData.id}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Date:</Text>
              <Text style={styles.metaValue}>
                {new Date(transactionData.date).toLocaleDateString("en-GB")}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Status:</Text>
              <Text style={styles.metaValue}>
                {numericPaid >= grandTotal ? "Paid" : "Pending"}
              </Text>
            </View>
          </View>
        </View>

        {/* BILL TO */}
        {partner && (
          <View style={styles.billTo}>
            <Text style={styles.billToLabel}>Bill To:</Text>
            <Text style={styles.billToName}>{partner.name}</Text>
            {/* Add partner address/phone if available in data */}
            {partner.phone && <Text style={styles.companyInfo}>Ph: {partner.phone}</Text>}
            {partner.address && <Text style={styles.companyInfo}>{partner.address}</Text>}
          </View>
        )}

        {/* ITEMS TABLE */}
        <View style={styles.table}>
          {/* Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.colSl, styles.headerText]}>#</Text>
            <Text style={[styles.colDesc, styles.headerText]}>Description</Text>
            <Text style={[styles.colQty, styles.headerText]}>Qty</Text>
            <Text style={[styles.colPrice, styles.headerText]}>Price</Text>
            <Text style={[styles.colTotal, styles.headerText]}>Total</Text>
          </View>

          {/* Rows */}
          {items?.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.colSl, styles.bodyText]}>{index + 1}</Text>
              <Text style={[styles.colDesc, styles.bodyText]}>{item.name}</Text>
              <Text style={[styles.colQty, styles.bodyText]}>{item.quantity}</Text>
              <Text style={[styles.colPrice, styles.bodyText]}>{formatCurrency(item.price)}</Text>
              <Text style={[styles.colTotal, styles.bodyText]}>
                {formatCurrency(item.quantity * item.price)}
              </Text>
            </View>
          ))}
        </View>

        {/* FOOTER SECTION (Notes + Totals) */}
        <View style={styles.footerSection}>
          
          {/* Left Side: QR & Notes */}
          <View style={styles.footerLeft}>
            <View>
              <Text style={styles.notesTitle}>Terms & Conditions:</Text>
              <Text style={styles.notesText}>
                {store?.footer_message || "Thank you for your business. Please contact us for any queries regarding this invoice."}
              </Text>
            </View>

            {/* QR Code if exists */}
            {store?.full_qr_image_url && (
               <View style={styles.qrContainer}>
                 <Image src={store.full_qr_image_url} style={styles.qrImage} />
               </View>
            )}
          </View>

          {/* Right Side: Totals */}
          <View style={styles.footerRight}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Sub Total:</Text>
              <Text style={styles.summaryValue}>{formatCurrency(numericSubTotal)}</Text>
            </View>
            
            {numericTax > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tax:</Text>
                <Text style={styles.summaryValue}>{formatCurrency(numericTax)}</Text>
              </View>
            )}
            
            {numericDiscount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Discount:</Text>
                <Text style={styles.summaryValue}>- {formatCurrency(numericDiscount)}</Text>
              </View>
            )}

            {numericShipping > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Shipping:</Text>
                <Text style={styles.summaryValue}>{formatCurrency(numericShipping)}</Text>
              </View>
            )}

            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Total:</Text>
              <Text style={styles.grandTotalValue}>{formatCurrency(grandTotal)}</Text>
            </View>
            
            <View style={{marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#eee'}}>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Paid Amount:</Text>
                    <Text style={styles.summaryValue}>{formatCurrency(numericPaid)}</Text>
                </View>
                {balance > 0.01 && (
                     <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, {color: '#d00', fontWeight:'bold'}]}>Balance Due:</Text>
                        <Text style={[styles.summaryValue, {color: '#d00'}]}>{formatCurrency(balance)}</Text>
                    </View>
                )}
            </View>
          </View>
        </View>

        {/* Bottom Barcode */}
        {barcodeImage && (
          <View style={styles.barcodeContainer}>
            <Image src={barcodeImage} style={styles.barcodeImage} />
            <Text style={styles.thankYou}>Generated by System</Text>
          </View>
        )}

      </Page>
    </Document>
  );
};

export default ReceiptPDF;