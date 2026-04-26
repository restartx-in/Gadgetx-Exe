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

Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/helvetica/v1/Helvetica.ttf' },
    { src: 'https://fonts.gstatic.com/s/helvetica/v1/Helvetica-Bold.ttf', fontWeight: 'bold' }
  ]
});
Font.register({
  family: 'Amiri',
  src: '/fonts/Amiri-Regular.ttf' 
});

// --- Automatic Translations for Static Labels ---
const translations = {
  jobSheet: 'ورقة عمل',
  jobDetails: 'تفاصيل العمل',
  jobNo: 'رقم الطلب',
  date: 'التاريخ',
  status: 'الحالة',
  partyName: 'اسم العميل',
  deviceItem: 'الجهاز / العنصر',
  assignedServicer: 'الفني المسؤول',
  workDoneBy: 'تم بواسطة',
  remarksDiagnosis: 'ملاحظات / تشخيص',
  noRemarks: 'لم يتم إدخال ملاحظات.',
  serviceCost: 'تكلفة الخدمة',
  serviceCharges: 'رسوم الخدمة',
  totalAmount: 'المبلغ الإجمالي',
  authSign: 'التوقيع المعتمد',
};

const formatAmount = (amount) => {
  const num = parseFloat(amount) || 0;
  return num.toFixed(2);
};

// --- Styles ---
const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 10, lineHeight: 1.5, color: "#333" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20, borderBottomWidth: 1, borderBottomColor: "#eee", paddingBottom: 20 },
  logoSection: { width: "60%", flexDirection: "column", justifyContent: "flex-start", alignItems: "flex-start" },
  logo: { height: 55, objectFit: "contain", marginBottom: 5, marginTop: 0, alignSelf: "flex-start" },
  companyName: { fontSize: 14, fontWeight: "bold", textTransform: "uppercase", marginTop: 5 },
  companyInfo: { fontSize: 9, color: "#555" },
  titleSection: { width: "40%", textAlign: "right" },
  docTitle: { fontSize: 22, fontWeight: "bold", marginBottom: 5, color: "#000" },
  metaRow: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 4 },
  metaLabel: { fontWeight: "bold", marginRight: 8, color: "#555" },
  metaValue: { color: "#000" },
  sectionTitle: { fontSize: 12, fontWeight: "bold", backgroundColor: "#f3f3f3", padding: 5, marginTop: 20, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: "#333" },
  gridContainer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  gridItem: { width: "48%", marginBottom: 10, flexDirection: "row" },
  gridLabel: { width: "35%", fontWeight: "bold", color: "#555" },
  gridValue: { width: "65%", color: "#000" },
  remarksBox: { marginTop: 10, padding: 10, borderWidth: 1, borderColor: "#eee", minHeight: 40, backgroundColor: "#fafafa" },
  totalsSection: { marginTop: 20, alignItems: "flex-end" },
  totalRow: { flexDirection: "row", width: "40%", justifyContent: "space-between", paddingVertical: 4 },
  grandTotal: { borderTopWidth: 1, borderTopColor: "#000", marginTop: 5, paddingTop: 5 },
  grandTotalText: { fontSize: 14, fontWeight: "bold" },
  footer: { position: "absolute", bottom: 40, left: 40, right: 40, textAlign: "center", borderTopWidth: 1, borderTopColor: "#eee", paddingTop: 10 },
  barcode: { marginTop: 20, alignItems: "center" },
  barcodeImg: { width: 150, height: 40 },
  // Styles for Arabic text
  arabicText: { fontFamily: 'Amiri' },
});

const ReceiptInvoice = ({ data, barcodeImage }) => {
  // Safety check to prevent errors
  if (!data || !data.store) {
    return null;
  }

  const { store } = data;
  const serviceCost = parseFloat(data.service_cost) || 0;
  const serviceCharge = parseFloat(data.service_charges) || 0;
  const totalAmount = serviceCost + serviceCharge;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* HEADER */}
        <View style={styles.header}>
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

          <View style={styles.titleSection}>
            <Text style={styles.docTitle}>JOB SHEET</Text>
            {store?.show_arabic_translations && <Text style={[styles.docTitle, styles.arabicText, { marginBottom: 50 }]}>{translations.jobSheet}</Text>}
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Job No: {store?.show_arabic_translations && <Text style={styles.arabicText}>{translations.jobNo}</Text>}</Text>
              <Text style={styles.metaValue}>{data.invoice_number}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Date: {store?.show_arabic_translations && <Text style={styles.arabicText}>{translations.date}</Text>}</Text>
              <Text style={styles.metaValue}>{new Date().toLocaleDateString("en-GB")}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Status: {store?.show_arabic_translations && <Text style={styles.arabicText}>{translations.status}</Text>}</Text>
              <Text style={styles.metaValue}>{data.status}</Text>
            </View>
          </View>
        </View>

        {/* CUSTOMER & ITEM INFO */}
        <Text style={styles.sectionTitle}>Job Details {store?.show_arabic_translations && <Text style={styles.arabicText}>- {translations.jobDetails}</Text>}</Text>
        <View style={styles.gridContainer}>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Party Name: {store?.show_arabic_translations && <Text style={styles.arabicText}>{translations.partyName}</Text>}</Text>
            <Text style={styles.gridValue}>{data.party_name}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Device / Item: {store?.show_arabic_translations && <Text style={styles.arabicText}>{translations.deviceItem}</Text>}</Text>
            <Text style={styles.gridValue}>{data.item_name}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Assigned Servicer: {store?.show_arabic_translations && <Text style={styles.arabicText}>{translations.assignedServicer}</Text>}</Text>
            <Text style={styles.gridValue}>{data.servicer_name || "-"}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Work Done By: {store?.show_arabic_translations && <Text style={styles.arabicText}>{translations.workDoneBy}</Text>}</Text>
            <Text style={styles.gridValue}>{data.done_by_name || "-"}</Text>
          </View>
        </View>

        {/* REMARKS */}
        <Text style={styles.sectionTitle}>Remarks / Diagnosis {store?.show_arabic_translations && <Text style={styles.arabicText}>- {translations.remarksDiagnosis}</Text>}</Text>
        <View style={styles.remarksBox}>
            <Text>{data.remarks || "No remarks entered."}</Text>
            {store?.show_arabic_translations && !data.remarks && <Text style={styles.arabicText}>{translations.noRemarks}</Text>}
        </View>

        {/* FINANCIALS */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text>Service Cost: {store?.show_arabic_translations && <Text style={styles.arabicText}>{translations.serviceCost}</Text>}</Text>
            <Text>{formatAmount(serviceCost)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Service Charges: {store?.show_arabic_translations && <Text style={styles.arabicText}>{translations.serviceCharges}</Text>}</Text>
            <Text>{formatAmount(serviceCharge)}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text style={styles.grandTotalText}>Total Amount: {store?.show_arabic_translations && <Text style={styles.arabicText}>{translations.totalAmount}</Text>}</Text>
            <Text style={styles.grandTotalText}>{formatAmount(totalAmount)}</Text>
          </View>
        </View>

        {/* FOOTER & BARCODE */}
        <View style={styles.footer}>
          {barcodeImage && (
             <View style={styles.barcode}>
                <Image src={barcodeImage} style={styles.barcodeImg} />
             </View>
          )}
          <Text style={{ marginTop: 10 }}>
            {store?.footer_message || "Thank you for your business!"}
          </Text>
          <Text style={{ marginTop: 5, fontSize: 8, color: "#999" }}>
             Authorized Signature ______________________
             {store?.show_arabic_translations && <Text style={styles.arabicText}>   {translations.authSign}</Text>}
          </Text>
        </View>

      </Page>
    </Document>
  );
};

export default ReceiptInvoice;