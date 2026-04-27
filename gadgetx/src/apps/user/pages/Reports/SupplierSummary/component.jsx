import React, { useCallback, useMemo, useReducer } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format, isValid, parseISO } from "date-fns";

import PageTitleWithBackButton from "@/components/PageTitleWithBackButton";
import ContainerWrapper from "@/components/ContainerWrapper";
import ScrollContainer from "@/components/ScrollContainer";
import PageHeader from "@/components/PageHeader";
import HStack from "@/components/HStack";
import TitleContainer from "@/components/TitleContainer";
import ListItem from "@/components/ListItem/component";
import Loader from "@/components/Loader";
import RefreshButton from "@/components/RefreshButton";
import DateFilter from "@/components/DateFilter";
import TableTopContainer from "@/apps/user/components/TableTopContainer";
import VoucherAddButton from "@/apps/user/components/VoucherAddButton";
import SupplierAutocomplete from "@/apps/user/components/SupplierAutocomplete";
import { useIsMobile } from "@/utils/useIsMobile";
import useSyncURLParams from "@/hooks/useSyncURLParams";
import usePartyFinancialDetails from "@/apps/user/hooks/api/partySummary/usePartyFinancialDetails";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Td,
  Th,
  ThSL,
  TdSL,
  TableCaption,
} from "@/components/Table";

import "./style.scss";

const stateReducer = (state, newState) => ({ ...state, ...newState });

const initializer = (searchParams) => ({
  party_id: searchParams.get("party_id") || "",
  start_date: searchParams.get("startDate") || "",
  end_date: searchParams.get("endDate") || "",
});

const formatNumber = (value) => Number(value || 0).toFixed(2);

const SupplierSummary = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [state, setState] = useReducer(stateReducer, searchParams, initializer);

  useSyncURLParams({
    party_id: state.party_id || "",
    startDate: state.start_date || "",
    endDate: state.end_date || "",
  });

  const { data, isFetching } = usePartyFinancialDetails(
    state.party_id,
    {
      start_date: state.start_date || null,
      end_date: state.end_date || null,
    },
    { enabled: !!state.party_id }
  );

  const handleRefresh = useCallback(() => {
    setState({
      party_id: "",
      start_date: "",
      end_date: "",
    });
  }, []);

  const handleDateChange = useCallback((newDateFilter) => {
    setState({
      start_date: newDateFilter.startDate || "",
      end_date: newDateFilter.endDate || "",
    });
  }, []);

  const handleSupplierChange = useCallback((value) => {
    setState({
      party_id: value?.supplier_id ? String(value.supplier_id) : "",
    });
  }, []);

  const subtitle = useMemo(() => {
    if (!data?.party?.name) return "Select supplier to view summary";
    if (
      state.start_date &&
      state.end_date &&
      isValid(parseISO(state.start_date)) &&
      isValid(parseISO(state.end_date))
    ) {
      return `${data.party.name} | ${format(parseISO(state.start_date), "d MMM yyyy")} to ${format(parseISO(state.end_date), "d MMM yyyy")}`;
    }
    return data.party.name;
  }, [data?.party?.name, state.start_date, state.end_date]);

  const cards = useMemo(
    () => [
      { label: "Opening Due", value: formatNumber(data?.balances?.opening_balance) },
      { label: "Purchases", value: formatNumber(data?.balances?.purchases) },
      { label: "Payments", value: formatNumber(data?.balances?.payments) },
      { label: "Closing Due", value: formatNumber(data?.balances?.closing_balance) },
    ],
    [data]
  );

  const accounts = data?.associated_accounts || [];
  const transactions = data?.transactions || [];

  const desktopContent = (
    <>
      <PageTitleWithBackButton title="Supplier Report" subtitle={subtitle} />
      <TableTopContainer
        mainActions={
          <div className="supplier-summary-report__toolbar">
            <SupplierAutocomplete
              value={state.party_id ? Number(state.party_id) : null}
              onChange={handleSupplierChange}
              style={{ minWidth: 260 }}
            />
            <DateFilter
              value={{ startDate: state.start_date, endDate: state.end_date }}
              onChange={handleDateChange}
            />
            <RefreshButton onClick={handleRefresh} />
            <VoucherAddButton
              title="Payment Out"
              items={[
                {
                  label: "Payment Out Screen",
                  onClick: () => navigate("/payment-against-purchase"),
                },
                {
                  label: "Another Payment Out (Purchase)",
                  onClick: () => navigate("/payment-report?invoiceTypes=PURCHASE"),
                },
                {
                  label: "Other Payment Out",
                  onClick: () => navigate("/payment-against-sale-return"),
                },
              ]}
            />
          </div>
        }
      />

      {isFetching ? (
        <Loader />
      ) : !state.party_id ? (
        <div className="supplier-summary-report__section">
          Please select a supplier to view summary, balances, and transactions.
        </div>
      ) : (
        <div className="supplier-summary-report">
          <div className="supplier-summary-report__cards">
            {cards.map((card) => (
              <div key={card.label} className="supplier-summary-report__card">
                <div className="supplier-summary-report__card-label">{card.label}</div>
                <div className="supplier-summary-report__card-value">{card.value}</div>
              </div>
            ))}
          </div>

          <div className="supplier-summary-report__section">
            <h3 className="supplier-summary-report__section-title">Supplier Details</h3>
            <div className="supplier-summary-report__info-grid">
              <div className="supplier-summary-report__info-item"><strong>Name:</strong> {data?.party?.name || "-"}</div>
              <div className="supplier-summary-report__info-item"><strong>Phone:</strong> {data?.party?.phone || "-"}</div>
              <div className="supplier-summary-report__info-item"><strong>Email:</strong> {data?.party?.email || "-"}</div>
              <div className="supplier-summary-report__info-item"><strong>Payment Terms:</strong> {data?.party?.payment_terms || "-"}</div>
              <div className="supplier-summary-report__info-item"><strong>Opening Due Added:</strong> {formatNumber(data?.balances?.manual_opening_balance)}</div>
              <div className="supplier-summary-report__info-item"><strong>Address:</strong> {data?.party?.address || "-"}</div>
            </div>
          </div>

          <div className="supplier-summary-report__section">
            <h3 className="supplier-summary-report__section-title">Associated Accounts</h3>
            <Table>
              <Thead>
                <Tr>
                  <ThSL />
                  <Th>Account Name</Th>
                  <Th>Type</Th>
                  <Th>Balance</Th>
                </Tr>
              </Thead>
              <Tbody>
                {accounts.length > 0 ? (
                  accounts.map((account, index) => (
                    <Tr key={account.id}>
                      <TdSL index={index} />
                      <Td>{account.name}</Td>
                      <Td>{account.type}</Td>
                      <Td>{formatNumber(account.balance)}</Td>
                    </Tr>
                  ))
                ) : (
                  <TableCaption item="Associated Account" noOfCol={4} />
                )}
              </Tbody>
            </Table>
          </div>

          <div className="supplier-summary-report__section">
            <h3 className="supplier-summary-report__section-title">All Supplier Transactions</h3>
            <Table>
              <Thead>
                <Tr>
                  <ThSL />
                  <Th>Date</Th>
                  <Th>Type</Th>
                  <Th>Reference</Th>
                  <Th>Description</Th>
                  <Th>Debit</Th>
                  <Th>Credit</Th>
                </Tr>
              </Thead>
              <Tbody>
                {transactions.length > 0 ? (
                  transactions.map((transaction, index) => (
                    <Tr key={`${transaction.transaction_source}-${transaction.id}-${index}`}>
                      <TdSL index={index} />
                      <Td>
                        {transaction.date && isValid(parseISO(transaction.date))
                          ? format(parseISO(transaction.date), "dd-MM-yyyy")
                          : "-"}
                      </Td>
                      <Td>{transaction.transaction_source}</Td>
                      <Td>{transaction.reference || "-"}</Td>
                      <Td>{transaction.description || "-"}</Td>
                      <Td>{Number(transaction.debit || 0) > 0 ? formatNumber(transaction.debit) : "-"}</Td>
                      <Td>{Number(transaction.credit || 0) > 0 ? formatNumber(transaction.credit) : "-"}</Td>
                    </Tr>
                  ))
                ) : (
                  <TableCaption item="Transaction" noOfCol={7} />
                )}
              </Tbody>
            </Table>
          </div>
        </div>
      )}
    </>
  );

  const mobileContent = (
    <>
      <TitleContainer>
        <PageTitleWithBackButton title="Supplier Report" />
      </TitleContainer>
      <ScrollContainer>
        <PageHeader>
          <HStack>
            <SupplierAutocomplete
              value={state.party_id ? Number(state.party_id) : null}
              onChange={handleSupplierChange}
              style={{ minWidth: 220 }}
            />
            <DateFilter
              value={{ startDate: state.start_date, endDate: state.end_date }}
              onChange={handleDateChange}
            />
            <RefreshButton onClick={handleRefresh} />
            <VoucherAddButton
              title="Payment Out"
              items={[
                {
                  label: "Payment Out Screen",
                  onClick: () => navigate("/payment-against-purchase"),
                },
                {
                  label: "Another Payment Out (Purchase)",
                  onClick: () => navigate("/payment-report?invoiceTypes=PURCHASE"),
                },
                {
                  label: "Other Payment Out",
                  onClick: () => navigate("/payment-against-sale-return"),
                },
              ]}
            />
          </HStack>
        </PageHeader>

        {isFetching ? (
          <Loader />
        ) : !state.party_id ? (
          <div className="supplier-summary-report__section">
            Please select a supplier.
          </div>
        ) : (
          <div className="supplier-summary-report supplier-summary-report__mobile-list">
            {cards.map((card) => (
              <ListItem key={card.label} title={card.label} amount={card.value} />
            ))}

            <ListItem
              title={data?.party?.name || "Supplier"}
              subtitle={
                <>
                  <div>Phone: {data?.party?.phone || "-"}</div>
                  <div>Email: {data?.party?.email || "-"}</div>
                  <div>Opening Due: {formatNumber(data?.balances?.manual_opening_balance)}</div>
                </>
              }
            />

            {transactions.length > 0 ? (
              transactions.map((transaction, index) => (
                <ListItem
                  key={`${transaction.transaction_source}-${transaction.id}-${index}`}
                  title={`${transaction.transaction_source} • ${transaction.reference || "-"}`}
                  subtitle={
                    <>
                      <div>
                        {transaction.date && isValid(parseISO(transaction.date))
                          ? format(parseISO(transaction.date), "dd-MM-yyyy")
                          : "-"}
                      </div>
                      <div>{transaction.description || "-"}</div>
                    </>
                  }
                  amount={
                    <div style={{ textAlign: "right" }}>
                      <div>Dr: {Number(transaction.debit || 0) > 0 ? formatNumber(transaction.debit) : "-"}</div>
                      <div>Cr: {Number(transaction.credit || 0) > 0 ? formatNumber(transaction.credit) : "-"}</div>
                    </div>
                  }
                />
              ))
            ) : (
              <TableCaption item="Transaction" />
            )}
          </div>
        )}
      </ScrollContainer>
    </>
  );

  return <ContainerWrapper>{isMobile ? mobileContent : desktopContent}</ContainerWrapper>;
};

export default SupplierSummary;
