import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useReducer,
} from "react";
import { useSearchParams } from "react-router-dom";
import { format, isValid } from "date-fns";

import usePartySummary from "@/hooks/api/partySummary/usePartySummary";
import { useIsMobile } from "@/utils/useIsMobile";
import useSyncURLParams from "@/hooks/useSyncURLParams";

import PageTitleWithBackButton from "@/components/PageTitleWithBackButton";
import ContainerWrapper from "@/components/ContainerWrapper";
import ScrollContainer from "@/components/ScrollContainer";
import TableTopContainer from "@/components/TableTopContainer";
import DateFilter from "@/components/DateFilter";
import RefreshButton from "@/components/RefreshButton";
import Loader from "@/components/Loader";
import ListItem from "@/apps/user/components/ListItem/component";
import PageHeader from "@/components/PageHeader";
import HStack from "@/components/HStack/component.jsx";
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
import TitleContainer from "@/components/TitleContainer";

import "./style.scss";

const stateReducer = (state, newState) => ({ ...state, ...newState });

const PartySummaryRow = React.memo(({ item, index }) => {

  return (
    <Tr>
      <TdSL index={index} />
      <Td>{item.party_name}</Td>
      <Td>{item.party_type}</Td>
      <Td>{item.opening_balance}</Td>
      <Td>{item.sales}</Td>
      <Td>{item.purchases}</Td>
      <Td>{item.payments}</Td>
      <Td>{item.closing_balance}</Td>
    </Tr>
  );
});

const MobilePartySummaryCard = React.memo(({ item }) => {
  return (
    <ListItem
      title={item.name}
      subtitle={
        <>
          <div>
            <strong>Closing Balance: {item.closing_balance}</strong>
          </div>
          <div>Type: {item.type}</div>
          <div>Opening: {item.opening_balance}</div>
          <div>
            Sales: {item.sales} | Purchases: {item.purchases}
          </div>
        </>
      }
    />
  );
});

const PartyBasedSummary = () => {
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const today = new Date().toISOString().split("T")[0];

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const tomorrowDate = tomorrow.toISOString().split("T")[0];

  const [state, setState] = useReducer(stateReducer, {
    start_date: searchParams.get("startDate") || today,
    end_date: searchParams.get("endDate") || tomorrowDate,
  });

  useSyncURLParams({
    startDate: state.start_date,
    endDate: state.end_date,
  });

  const [dateFilter, setDateFilter] = useState({
    startDate: null,
    endDate: null,
    rangeType: "custom",
  });

  const { data, isLoading } = usePartySummary(state);

  const listData = useMemo(() => data || [], [data]);

  useEffect(() => {
    setDateFilter({
      startDate: state.start_date || null,
      endDate: state.end_date || null,
      rangeType: "custom",
    });
  }, [state.start_date, state.end_date]);

  const handleDateFilterChange = useCallback((newDateValue) => {
    setDateFilter(newDateValue);
    setState({
      start_date: newDateValue.startDate || "",
      end_date: newDateValue.endDate || "",
    });
  }, []);

  const handleRefresh = useCallback(() => {
    setDateFilter({ startDate: null, endDate: null, rangeType: "custom" });
    setState({
      start_date: "",
      end_date: "",
    });
  }, []);

  const dateSubtitle = useMemo(() => {
    const { startDate, endDate } = dateFilter;
    const isDateFilterActive =
      startDate &&
      endDate &&
      isValid(new Date(startDate)) &&
      isValid(new Date(endDate));

    return isDateFilterActive
      ? `${format(new Date(startDate), "MMM d, yyyy")} → ${format(
          new Date(endDate),
          "MMM d, yyyy"
        )}`
      : "No date range selected";
  }, [dateFilter]);

  return (
    <ContainerWrapper>
      {!isMobile ? (
        <>
          <PageTitleWithBackButton
            title="Party Based Summary"
            subtitle={dateSubtitle}
          />
          <TableTopContainer
            isMargin={true}
            mainActions={
              <>
                <DateFilter
                  value={dateFilter}
                  onChange={handleDateFilterChange}
                />
                <RefreshButton onClick={handleRefresh} />
              </>
            }
          />
          {isLoading ? (
            <Loader />
          ) : (
            <Table>
              <Thead>
                <Tr>
                  <ThSL />
                  <Th>Party Name</Th>
                  <Th>Type</Th>
                  <Th>Opening Balance</Th>
                  <Th>Sales</Th>
                  <Th>Purchases</Th>
                  <Th>Payments</Th>
                  <Th>Closing Balance</Th>
                </Tr>
              </Thead>
              <Tbody>
                {listData.length > 0 ? (
                  listData.map((item, index) => (
                    <PartySummaryRow
                      key={item.party_id || index}
                      item={item}
                      index={index}
                    />
                  ))
                ) : (
                  <TableCaption item="Summary Report" noOfCol={9} />
                )}
              </Tbody>
            </Table>
          )}
        </>
      ) : (
        <>
          <TitleContainer>
            <PageTitleWithBackButton title="Party Based Summary" />
          </TitleContainer>
          <ScrollContainer>
            <PageHeader>
              <HStack>
                <DateFilter
                  value={dateFilter}
                  onChange={handleDateFilterChange}
                />
                <RefreshButton onClick={handleRefresh} />
              </HStack>
            </PageHeader>
            {isLoading ? (
              <Loader />
            ) : listData.length === 0 ? (
              <TableCaption item="Summary Report" />
            ) : (
              <div>
                {listData.map((item, index) => (
                  <MobilePartySummaryCard
                    key={item.party_id || index}
                    item={item}
                  />
                ))}
              </div>
            )}
          </ScrollContainer>
        </>
      )}
    </ContainerWrapper>
  );
};

export default PartyBasedSummary;
