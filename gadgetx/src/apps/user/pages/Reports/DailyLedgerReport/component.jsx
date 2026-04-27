import React, { useCallback, useMemo, useReducer, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { useLedgerReport } from "@/apps/user/hooks/api/ledger/useLedgerReport";
import { useLedger } from "@/apps/user/hooks/api/ledger/useLedger";
import { useModeOfPayments } from "@/apps/user/hooks/api/modeOfPayment/useModeOfPayments";
import { useIsMobile } from "@/utils/useIsMobile";
import useSyncURLParams from "@/hooks/useSyncURLParams";
import { useToast } from "@/context/ToastContext";

import ContainerWrapper from "@/components/ContainerWrapper";
import PageTitleWithBackButton from "@/components/PageTitleWithBackButton";
import TableTopContainer from "@/apps/user/components/TableTopContainer";
import DateFilter from "@/components/DateFilter";
import SelectField from "@/components/SelectField";
import RefreshButton from "@/components/RefreshButton";
import Loader from "@/components/Loader";
import ScrollContainer from "@/components/ScrollContainer";
import ListItem from "@/components/ListItem/component";
import HStack from "@/components/HStack/component.jsx";
import DownloadButton from "@/apps/user/components/DownloadButton";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TdNumeric,
  TableCaption,
} from "@/components/Table";

const stateReducer = (state, newState) => ({ ...state, ...newState });

const SORT_OPTIONS = [
  { value: "-date", label: "Date (Newest)" },
  { value: "date", label: "Date (Oldest)" },
  { value: "method_name", label: "Method (A-Z)" },
  { value: "-method_name", label: "Method (Z-A)" },
  { value: "-total_debit", label: "Debit (High-Low)" },
  { value: "total_debit", label: "Debit (Low-High)" },
  { value: "-total_credit", label: "Credit (High-Low)" },
  { value: "total_credit", label: "Credit (Low-High)" },
  { value: "-net_amount", label: "Net (High-Low)" },
  { value: "net_amount", label: "Net (Low-High)" },
];

const DailyLedgerReport = () => {
  const isMobile = useIsMobile();
  const showToast = useToast();
  const [searchParams] = useSearchParams();
  const [isDownloading, setIsDownloading] = useState(false);

  const [state, setState] = useReducer(stateReducer, {
    ledger_id: searchParams.get("ledgerId") || "",
    mode_of_payment_id: searchParams.get("modeOfPaymentId") || "",
    start_date: searchParams.get("startDate") || "",
    end_date: searchParams.get("endDate") || "",
    sort: searchParams.get("sort") || "-date",
  });

  useSyncURLParams({
    ledgerId: state.ledger_id,
    modeOfPaymentId: state.mode_of_payment_id,
    startDate: state.start_date,
    endDate: state.end_date,
    sort: state.sort,
  });

  const { data: reportData = [], isLoading, isFetching } = useLedgerReport({
    ...state,
    view: "daily",
  });

  const { data: ledgers = [] } = useLedger();
  const { data: modes = [] } = useModeOfPayments();

  const ledgerOptions = useMemo(
    () => [
      { value: "", label: "All Ledgers" },
      ...(Array.isArray(ledgers)
        ? ledgers.map((ledger) => ({ value: String(ledger.id), label: ledger.name }))
        : []),
    ],
    [ledgers]
  );

  const modeOptions = useMemo(
    () => [
      { value: "", label: "All Methods" },
      ...(Array.isArray(modes)
        ? modes.map((mode) => ({ value: String(mode.id), label: mode.name }))
        : []),
    ],
    [modes]
  );

  const totals = useMemo(() => {
    return (reportData || []).reduce(
      (acc, row) => {
        acc.total_debit += parseFloat(row.total_debit || 0);
        acc.total_credit += parseFloat(row.total_credit || 0);
        acc.net_amount += parseFloat(row.net_amount || 0);
        return acc;
      },
      { total_debit: 0, total_credit: 0, net_amount: 0 }
    );
  }, [reportData]);

  const formatNumber = useCallback((value) => {
    const num = Number(value || 0);
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, []);

  const handleDateFilterChange = useCallback((newFilterValue) => {
    setState({
      start_date: newFilterValue.startDate || "",
      end_date: newFilterValue.endDate || "",
    });
  }, []);

  const handleRefresh = useCallback(() => {
    setState({
      ledger_id: "",
      mode_of_payment_id: "",
      start_date: "",
      end_date: "",
      sort: "-date",
    });
  }, []);

  const handleDownload = useCallback(async () => {
    try {
      setIsDownloading(true);

      if (!reportData?.length) {
        showToast({
          type: "error",
          message: "No data available to download.",
        });
        return;
      }

      const doc = new jsPDF("p", "pt", "a4");
      const stamp = format(new Date(), "yyyy-MM-dd-HH-mm");
      const startY = 40;

      doc.setFontSize(16);
      doc.text("Daily Ledger Report", 40, startY);

      doc.setFontSize(10);
      doc.text(`Generated: ${format(new Date(), "yyyy-MM-dd HH:mm")}`, 40, startY + 16);

      const selectedLedger = ledgerOptions.find((l) => String(l.value) === String(state.ledger_id));
      const selectedMode = modeOptions.find((m) => String(m.value) === String(state.mode_of_payment_id));

      const appliedFilters = [];
      if (state.start_date) appliedFilters.push(`From: ${state.start_date}`);
      if (state.end_date) appliedFilters.push(`To: ${state.end_date}`);
      if (state.ledger_id) appliedFilters.push(`Ledger: ${selectedLedger?.label || state.ledger_id}`);
      if (state.mode_of_payment_id) appliedFilters.push(`Method: ${selectedMode?.label || state.mode_of_payment_id}`);
      if (state.sort) appliedFilters.push(`Sort: ${state.sort}`);

      doc.text(
        `Filters: ${appliedFilters.length ? appliedFilters.join(" | ") : "None"}`,
        40,
        startY + 32,
        { maxWidth: 520 }
      );

      autoTable(doc, {
        startY: startY + 50,
        head: [["Date", "Method", "Debit", "Credit", "Net"]],
        body: reportData.map((row) => [
          row.date || "-",
          row.method_name || "-",
          formatNumber(row.total_debit),
          formatNumber(row.total_credit),
          formatNumber(row.net_amount),
        ]),
        styles: { fontSize: 9, cellPadding: 5 },
        headStyles: { fillColor: [41, 98, 255] },
        columnStyles: {
          2: { halign: "right" },
          3: { halign: "right" },
          4: { halign: "right" },
        },
      });

      const afterY = doc.lastAutoTable.finalY + 14;
      doc.setFontSize(10);
      doc.text(
        `Totals  |  Debit: ${formatNumber(totals.total_debit)}  |  Credit: ${formatNumber(totals.total_credit)}  |  Net: ${formatNumber(totals.net_amount)}`,
        40,
        afterY
      );

      doc.save(`daily-ledger-report-${stamp}.pdf`);
      showToast({ type: "success", message: "PDF downloaded successfully." });
    } catch (error) {
      showToast({
        type: "error",
        message: error?.response?.data?.error || "Failed to download report.",
      });
    } finally {
      setIsDownloading(false);
    }
  }, [formatNumber, ledgerOptions, modeOptions, reportData, showToast, state, totals]);

  return (
    <ContainerWrapper>
      <PageTitleWithBackButton
        title="Daily Ledger Report"
        subtitle="Daily totals by payment method / account"
      />

      <TableTopContainer
        mainActions={
          <>
            <DateFilter
              value={{
                startDate: state.start_date,
                endDate: state.end_date,
              }}
              onChange={handleDateFilterChange}
            />
            <SelectField
              options={ledgerOptions}
              value={state.ledger_id}
              onChange={(e) => setState({ ledger_id: e.target.value })}
              isLabel={false}
              placeholder="Ledger"
            />
            <SelectField
              options={modeOptions}
              value={state.mode_of_payment_id}
              onChange={(e) => setState({ mode_of_payment_id: e.target.value })}
              isLabel={false}
              placeholder="Payment Method"
            />
            <SelectField
              options={SORT_OPTIONS}
              value={state.sort}
              onChange={(e) => setState({ sort: e.target.value })}
              isLabel={false}
              placeholder="Sort"
            />
            <DownloadButton
              onClick={handleDownload}
              isLoading={isDownloading}
              modalTitle="Download Daily Ledger Report"
              modalBody="Download PDF with current filters and sorting?"
            />
            <RefreshButton onClick={handleRefresh} isLoading={isFetching} />
          </>
        }
      />

      {isLoading ? (
        <Loader />
      ) : !reportData?.length ? (
        <TableCaption item="Daily Ledger Report" />
      ) : !isMobile ? (
        <Table>
          <Thead>
            <Tr>
              <Th>Date</Th>
              <Th>Payment Method / Account</Th>
              <Th style={{ textAlign: "right" }}>Total Debit</Th>
              <Th style={{ textAlign: "right" }}>Total Credit</Th>
              <Th style={{ textAlign: "right" }}>Net</Th>
            </Tr>
          </Thead>
          <Tbody>
            {reportData.map((row, index) => (
              <Tr key={`${row.date}-${row.method_name}-${index}`}>
                <Td>{row.date}</Td>
                <Td>{row.method_name}</Td>
                <TdNumeric>{formatNumber(row.total_debit)}</TdNumeric>
                <TdNumeric>{formatNumber(row.total_credit)}</TdNumeric>
                <TdNumeric style={{ fontWeight: 600 }}>
                  {formatNumber(row.net_amount)}
                </TdNumeric>
              </Tr>
            ))}
            <Tr>
              <Td colSpan={2} style={{ fontWeight: 700 }}>
                Grand Total
              </Td>
              <TdNumeric style={{ fontWeight: 700 }}>
                {formatNumber(totals.total_debit)}
              </TdNumeric>
              <TdNumeric style={{ fontWeight: 700 }}>
                {formatNumber(totals.total_credit)}
              </TdNumeric>
              <TdNumeric style={{ fontWeight: 700 }}>
                {formatNumber(totals.net_amount)}
              </TdNumeric>
            </Tr>
          </Tbody>
        </Table>
      ) : (
        <ScrollContainer>
          <HStack>
            <div style={{ marginBottom: 8, fontWeight: 600 }}>
              Debit: {formatNumber(totals.total_debit)} | Credit: {formatNumber(totals.total_credit)} | Net: {formatNumber(totals.net_amount)}
            </div>
          </HStack>
          {reportData.map((row, index) => (
            <ListItem
              key={`${row.date}-${row.method_name}-${index}`}
              title={`${row.date} • ${row.method_name}`}
              subtitle={
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span>Debit: {formatNumber(row.total_debit)}</span>
                  <span>Credit: {formatNumber(row.total_credit)}</span>
                </div>
              }
              amount={<strong>{formatNumber(row.net_amount)}</strong>}
            />
          ))}
        </ScrollContainer>
      )}
    </ContainerWrapper>
  );
};

export default DailyLedgerReport;
