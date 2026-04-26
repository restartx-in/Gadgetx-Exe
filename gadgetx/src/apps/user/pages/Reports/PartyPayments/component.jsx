import React, { useMemo, useCallback, useReducer } from "react";
import { useSearchParams } from "react-router-dom";
import { format, isValid, parseISO } from "date-fns";
import { useIsMobile } from "@/utils/useIsMobile";
import PageTitleWithBackButton from "@/components/PageTitleWithBackButton";
import ContainerWrapper from "@/components/ContainerWrapper";
import ScrollContainer from "@/components/ScrollContainer";
import PageHeader from "@/components/PageHeader";
import HStack from "@/components/HStack";
import TitleContainer from "@/components/TitleContainer";
import ListItem from "@/apps/user/components/ListItem/component";
import PartyAutoComplete from "@/apps/user/components/PartyAutoComplete";
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
import Loader from "@/components/Loader";
import RefreshButton from "@/components/RefreshButton";
import useSyncURLParams from "@/hooks/useSyncURLParams";
import { useParties } from "@/hooks/api/party/useParties";
import { usePartyPaymentDetails } from "@/hooks/api/partySummary/usePartyPaymentDetails";
import DateFilter from "@/components/DateFilter";

// --- Reducer for Centralized State Management ---
const stateReducer = (state, newState) => ({ ...state, ...newState });

const initializer = (searchParams) => ({
  party_id: searchParams.get("party_id") || null,
  party_name: searchParams.get("party_name") || null,
  start_date: searchParams.get("startDate") || "",
  end_date: searchParams.get("endDate") || "",
  transaction_type: searchParams.get("transaction_type") || "all",
});

// --- Memoized Components for Performance ---
const PaymentRow = React.memo(({ item, index, listLength }) => (
  <Tr>
    <TdSL index={index} page={1} pageSize={listLength} />
    <Td>
      {isValid(parseISO(item.transaction_date))
        ? format(parseISO(item.transaction_date), "dd-MM-yyyy")
        : "-"}
    </Td>
    <Td>{item.description}</Td>
    <Td>{item.account_name}</Td>
    <Td align="right">
      {item.debit > 0 ? parseFloat(item.debit).toFixed(2) : "-"}
    </Td>
    <Td align="right">
      {item.credit > 0 ? parseFloat(item.credit).toFixed(2) : "-"}
    </Td>
  </Tr>
));

const MobilePaymentCard = React.memo(({ item }) => (
  <ListItem
    title={item.description}
    subtitle={
      <>
        <div>
          {isValid(parseISO(item.transaction_date))
            ? format(parseISO(item.transaction_date), "dd-MM-yyyy")
            : "-"}
        </div>
        <div>Account: {item.account_name}</div>
      </>
    }
    balanceText={
      <>
        {item.credit > 0 && (
          <div style={{ color: "var(--color-success)" }}>
            Cash In: {parseFloat(item.credit).toFixed(2)}
          </div>
        )}
        {item.debit > 0 && (
          <div style={{ color: "var(--color-danger)" }}>
            Cash Out: -{parseFloat(item.debit).toFixed(2)}
          </div>
        )}
      </>
    }
  />
));

const ButtonGroup = React.memo(
  ({ options, selectedValue, onChange, isMobile }) => {
    // Styles moved inside for encapsulation
    const groupStyle = {
      display: "flex",
      border: "1px solid var(--border-color)",
      borderRadius: "6px",
      overflow: "hidden",
      ...(isMobile && { flexGrow: 1 }),
    };
    const getButtonStyle = (isSelected) => ({
      padding: "8px 16px",
      border: "none",
      cursor: "pointer",
      backgroundColor: isSelected ? "var(--navy)" : "transparent",
      color: isSelected
        ? "var(--color-neutral-0)"
        : "var(--color-text-primary)",
      outline: "none",
      flex: isMobile ? 1 : "auto",
      textAlign: "center",
      transition: "background-color 0.2s, color 0.2s",
    });
    return (
      <div style={groupStyle}>
        {options.map((option, index) => (
          <button
            key={option.value}
            className="fs14"
            style={{
              ...getButtonStyle(option.value === selectedValue),
              borderRight:
                index < options.length - 1
                  ? "1px solid var(--border-color)"
                  : "none",
            }}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    );
  }
);

const PartyPayments = () => {
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();

  // --- Centralized State ---
  const [state, setState] = useReducer(stateReducer, searchParams, initializer);

  // --- URL Synchronization ---
  useSyncURLParams({
    party_id: state.party_id || "",
    party_name: state.party_name || "",
    startDate: state.start_date || "",
    endDate: state.end_date || "",
    transaction_type: state.transaction_type,
  });

  // --- Data Fetching ---
  const { data: allParties, isLoading: isPartiesLoading } = useParties();
  const { data, isFetching: isDetailsFetching } = usePartyPaymentDetails(
    state.party_id,
    {
      start_date: state.start_date || null,
      end_date: state.end_date || null,
      transaction_type:
        state.transaction_type === "all" ? null : state.transaction_type,
    },
    { enabled: !!state.party_id } // <-- Prevents unwanted API calls
  );

  const paymentList = useMemo(() => data?.payments || [], [data]);

  // --- Memoized Callbacks for Event Handlers ---
  const handleRefresh = useCallback(() => {
    setState({
      party_id: null,
      party_name: null,
      start_date: "",
      end_date: "",
      transaction_type: "all",
    });
  }, []);

  const handleDateChange = useCallback((newDateFilter) => {
    setState({
      start_date: newDateFilter.startDate || "",
      end_date: newDateFilter.endDate || "",
    });
  }, []);

  const handlePartyChange = useCallback(
    (e) => {
      const party = allParties?.find(
        (p) => String(p.id) === String(e.target.value)
      );
      setState({
        party_id: party?.id || null,
        party_name: party?.name || null,
      });
    },
    [allParties]
  );

  const handleTransactionTypeChange = useCallback((value) => {
    setState({ transaction_type: value });
  }, []);

  // --- Memoized Derived Data ---
  const selectedPartyObject = useMemo(() => {
    if (!state.party_id || !allParties) return null;
    return allParties.find((p) => String(p.id) === String(state.party_id));
  }, [state.party_id, allParties]);

  const pageSubtitle = useMemo(() => {
    if (!selectedPartyObject) return "No party selected";
    const { start_date, end_date } = state;
    const isDateValid =
      start_date &&
      end_date &&
      isValid(parseISO(start_date)) &&
      isValid(parseISO(end_date));
    const dateRange = isDateValid
      ? `${format(parseISO(start_date), "d MMM yyyy")} → ${format(
          parseISO(end_date),
          "d MMM yyyy"
        )}`
      : "";
    return dateRange
      ? `${selectedPartyObject.name} | ${dateRange}`
      : selectedPartyObject.name;
  }, [selectedPartyObject, state]);

  const transactionTypeOptions = useMemo(
    () => [
      { label: "All", value: "all" },
      { label: "In", value: "in" },
      { label: "Out", value: "out" },
    ],
    []
  );

  // --- Loading State ---
  if (isPartiesLoading) {
    return (
      <ContainerWrapper>
        <Loader />
      </ContainerWrapper>
    );
  }

  const isFetching = isPartiesLoading || isDetailsFetching;

  // --- Render Logic ---
  return (
    <ContainerWrapper>
      {!isMobile ? (
        <>
          <PageTitleWithBackButton
            title="Party Payment Details"
            subtitle={pageSubtitle}
          />
          <HStack
            justifyContent="start"
            style={{ marginBottom: "10px", gap: "10px" }}
          >
            <ButtonGroup
              options={transactionTypeOptions}
              selectedValue={state.transaction_type}
              onChange={handleTransactionTypeChange}
            />
            <PartyAutoComplete
              value={state.party_id}
              onChange={handlePartyChange}
            />
            <DateFilter
              value={{ startDate: state.start_date, endDate: state.end_date }}
              onChange={handleDateChange}
            />
            <RefreshButton onClick={handleRefresh} />
          </HStack>

          {isFetching && <Loader />}
          {!isFetching && selectedPartyObject && (
            <Table className="payment-details-table">
              <Thead>
                <Tr>
                  <ThSL />
                  <Th>Date</Th>
                  <Th>Description</Th>
                  <Th>Account</Th>
                  <Th align="right">Cash Out</Th>
                  <Th align="right">Cash In</Th>
                </Tr>
              </Thead>
              <Tbody>
                {paymentList.length > 0 ? (
                  paymentList.map((payment, index) => (
                    <PaymentRow
                      key={payment.id}
                      item={payment}
                      index={index}
                      listLength={paymentList.length}
                    />
                  ))
                ) : (
                  <TableCaption item="Payment" noOfCol={6} />
                )}
              </Tbody>
            </Table>
          )}
          {!selectedPartyObject && !isFetching && (
            <div
              className="fs18"
              style={{ textAlign: "center", paddingTop: "20px" }}
            >
              Please select a party to view their payment details.
            </div>
          )}
        </>
      ) : (
        <>
          <TitleContainer>
            <PageTitleWithBackButton title="Party Payments" />
          </TitleContainer>
          <ScrollContainer>
            <PageHeader>
              <HStack>
                <ButtonGroup
                  options={transactionTypeOptions}
                  selectedValue={state.transaction_type}
                  onChange={handleTransactionTypeChange}
                  isMobile={true}
                />
                <DateFilter
                  value={{
                    startDate: state.start_date,
                    endDate: state.end_date,
                  }}
                  onChange={handleDateChange}
                />
                <RefreshButton onClick={handleRefresh} />
              </HStack>
            </PageHeader>
            <div style={{ padding: "0 10px", margin: "12px 0" }}>
              <PartyAutoComplete
                value={state.party_id}
                onChange={handlePartyChange}
              />
            </div>
            {isFetching ? (
              <Loader />
            ) : !selectedPartyObject ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "20px",
                  color: "#9ca3af",
                }}
              >
                Please select a party to see details.
              </div>
            ) : paymentList.length === 0 ? (
              <TableCaption item="Payment" />
            ) : (
              <div>
                {paymentList.map((item) => (
                  <MobilePaymentCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </ScrollContainer>
        </>
      )}
    </ContainerWrapper>
  );
};

export default PartyPayments;
