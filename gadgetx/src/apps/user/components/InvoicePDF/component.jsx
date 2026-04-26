
import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 12,
    fontFamily: 'Helvetica'
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Helvetica-Bold'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  storeDetails: {
    flexDirection: 'column',
  },
  metaDetails: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  section: {
    marginBottom: 10,
  },
  table: {
    display: "table",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0
  },
  tableRow: {
    flexDirection: "row"
  },
  tableColHeader: {
    width: "25%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: '#f0f0f0',
    padding: 5,
    fontFamily: 'Helvetica-Bold'
  },
  tableCol: {
    width: "25%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 5,
  },
  summary: {
    marginTop: 20,
    textAlign: 'right',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 5,
  },
  label: {
    fontFamily: 'Helvetica-Bold'
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    color: 'grey',
    fontSize: 12,
  }
});

const formatCurrency = (amount) => {
  const numericAmount = parseFloat(amount) || 0;
  const parts = numericAmount.toFixed(2).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `Rs. ${parts.join('.')}`;
};

const InvoicePDF = ({ title, transactionData }) => {
  if (!transactionData) {
    return null;
  }

  const transactionDate = new Date(transactionData.date);
  const formattedDate = `${transactionDate.getDate().toString().padStart(2, '0')}-${(transactionDate.getMonth() + 1).toString().padStart(2, '0')}-${transactionDate.getFullYear()}`;

  return (
    <Document>
       <Page size={[226.77, 595.28]} style={styles.page}>
        <Text style={styles.title}>{title}</Text>

        <View style={styles.header}>
          <View style={styles.storeDetails}>
            <Text>{transactionData.store.name}</Text>
            <Text>{transactionData.store.address}</Text>
            <Text>{transactionData.store.email}</Text>
            <Text>{transactionData.store.phone}</Text>
          </View>
          <View style={styles.metaDetails}>
            <Text>Date: {formattedDate}</Text>
            <Text>{transactionData.partner.label}: {transactionData.partner.name}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <View style={styles.tableColHeader}><Text>Item</Text></View>
              <View style={styles.tableColHeader}><Text>Quantity</Text></View>
              <View style={styles.tableColHeader}><Text>Price</Text></View>
              <View style={styles.tableColHeader}><Text>Total</Text></View>
            </View>
            {transactionData.items.map((item, index) => (
              <View style={styles.tableRow} key={index}>
                <View style={styles.tableCol}><Text>{item.name}</Text></View>
                <View style={styles.tableCol}><Text>{item.quantity}</Text></View>
                <View style={styles.tableCol}><Text>{formatCurrency(item.price)}</Text></View>
                <View style={styles.tableCol}><Text>{formatCurrency(item.quantity * item.price)}</Text></View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.label}>Subtotal: </Text>
            <Text>{formatCurrency(transactionData.summary.subTotal)}</Text>
          </View>
          {transactionData.summary.orderTax > 0 && (
            <View style={styles.summaryRow}>
                <Text style={styles.label}>Tax: </Text>
                <Text>{formatCurrency(transactionData.summary.orderTax)}</Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text style={styles.label}>Discount: </Text>
            <Text>{formatCurrency(transactionData.summary.discount)}</Text>
          </View>
          {transactionData.summary.shipping > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.label}>Shipping: </Text>
              <Text>{formatCurrency(transactionData.summary.shipping)}</Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text style={styles.label}>Grand Total: </Text>
            <Text>{formatCurrency(transactionData.summary.grandTotal)}</Text>
          </View>
           <View style={styles.summaryRow}>
            <Text style={styles.label}>Paid Amount: </Text>
            <Text>{formatCurrency(transactionData.payment.amountPaid)}</Text>
          </View>
        </View>

        {/* <Text style={styles.footer}>Thanks for your business!</Text> */}
      </Page>
    </Document>
  );
};

export default InvoicePDF;