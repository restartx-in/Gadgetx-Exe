// --- START OF FILE JobSheetPDF.jsx ---

import React from "react";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { API_UPLOADS_BASE, API_BASE_URL, buildUploadUrl, isInvalidImageUrl } from "@/config/api";

// --- Currency Formatting ---
const formatCurrency = (amount) => {
  const numericAmount = parseFloat(amount) || 0;
  return numericAmount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};


// Helper to get proxy URL for PDF generation (fixes CORS)
const getProxyUrl = (url) => {
  if (!url) return null;
  // If it's already a local/proxy URL, just ensure gadgetx
  if (url.startsWith('/api/') || url.includes(API_BASE_URL)) {
    return url.replace(/\/gadgets\//g, "/gadgetx/");
  }

  // If it's a direct upload URL, try to parse and convert to proxy
  const match = url.match(/\/(\d+)\/print\/(image|qr)\/([^/]+)$/);
  if (match) {
    const [, tenantId, type, filename] = match;
    return `${API_BASE_URL}/print/${type}/${tenantId}/${filename}`;
  }

  // Fallback
  const u = buildUploadUrl(API_UPLOADS_BASE, url);
  return u ? u.replace(/\/gadgets\//g, "/gadgetx/") : null;
};

// --- Styles ---
const styles = StyleSheet.create({
  page: {
    padding: 12,
    marginLeft: 2,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#000",
    width: "100%", // ✔ Auto width
  },
  headerImage: {
    marginBottom: 8,
    textAlign: "center",
  },
  storeLogo: {
    maxWidth: 120,
    maxHeight: 60,
    margin: "0 auto",
  },
  header: {
    textAlign: "center",
    marginBottom: 8,
    borderBottom: "1pt dashed #000",
    paddingBottom: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  subtitle: {
    fontSize: 9,
    marginTop: 2,
  },
  metaSection: {
    marginBottom: 6,
    paddingBottom: 6,
    borderBottom: "1pt dashed #aaa",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  section: {
    marginBottom: 8,
  },
  summary: {
    borderTop: "1pt dashed #aaa",
    marginTop: 8,
    paddingTop: 6,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  totalBox: {
    borderTop: "1pt solid #000",
    borderBottom: "1pt solid #000",
    paddingVertical: 4,
    marginTop: 4,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  bold: {
    fontWeight: "bold",
  },
  barcodeContainer: {
    marginTop: 20,
    textAlign: "center",
  },
  barcodeImage: {
    width: 130,
    height: 60,
    margin: "0 auto",
  },
  footer: {
    textAlign: "center",
    fontSize: 8,
    marginTop: 10,
    borderTop: "1pt dashed #aaa",
    paddingTop: 5,
  },
});

// ✅ MODIFIED: Component now accepts barcodeImage and uses dynamic store data
const JobSheetPDF = ({ jobSheetData, barcodeImage }) => {
  if (!jobSheetData) return null;

  const serviceCharges = parseFloat(jobSheetData.service_charges) || 0;

  return (
    <Document>
      <Page size={[226.77, 595.28]} style={styles.page}>
        {/* Header */}
        {jobSheetData.store?.full_header_image_url && !isInvalidImageUrl(jobSheetData.store.full_header_image_url) && (
          <View style={styles.headerImage}>
            <Image
              style={styles.storeLogo}
              src={getProxyUrl(jobSheetData.store.full_header_image_url)}
            />
          </View>
        )}
        <View style={styles.header}>
          <Text style={styles.title}>JOB SHEET RECEIPT</Text>
          <Text style={styles.subtitle}>
            {jobSheetData.store?.company_name || "Your Company"}
          </Text>
          <Text style={styles.subtitle}>
            {jobSheetData.store?.address || "Your Address"}
          </Text>
        </View>

        {/* Meta Info */}
        <View style={styles.metaSection}>
          <View style={styles.metaRow}>
            <Text>Invoice #:</Text>
            <Text style={styles.bold}>{jobSheetData.invoice_number}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text>Date:</Text>
            <Text>
              {new Date(jobSheetData.created_at).toLocaleDateString("en-GB")}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Text>Customer:</Text>
            <Text>{jobSheetData.party_name}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text>Item:</Text>
            <Text>{jobSheetData.item_name}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text>Status:</Text>
            <Text>{jobSheetData.status}</Text>
          </View>
        </View>

        {/* Issue Reported */}
        <View style={styles.section}>
          <View style={styles.metaRow}>
            <Text style={styles.bold}>Issue Reported:</Text>
            <Text>{jobSheetData.issue_reported || "N/A"}</Text>
          </View>
        </View>

        {/* Diagnosis */}
        <View style={styles.section}>
          <View style={styles.metaRow}>
            <Text style={styles.bold}>Diagnosis:</Text>
            <Text>{jobSheetData.diagnosis || "N/A"}</Text>
          </View>
        </View>

        {/* Summary */}
        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text>Service Charges:</Text>
            <Text>{formatCurrency(serviceCharges)}</Text>
          </View>
          <View style={styles.totalBox}>
            <View style={styles.totalRow}>
              <Text style={styles.bold}>Total</Text>
              <Text style={styles.bold}>{formatCurrency(serviceCharges)}</Text>
            </View>
          </View>
        </View>

        {/* BARCODE IMAGE */}
        {barcodeImage && (
          <View style={styles.barcodeContainer}>
            <Image src={barcodeImage} style={styles.barcodeImage} />
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Thank you!</Text>
          {jobSheetData.store?.phone && (
            <Text>Contact: {jobSheetData.store.phone}</Text>
          )}
        </View>
      </Page>
    </Document>
  );
};

export default JobSheetPDF;
