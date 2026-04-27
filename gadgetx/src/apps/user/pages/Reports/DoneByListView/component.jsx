import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useReducer,
} from "react";
import { useSearchParams } from "react-router-dom";
import { format, isValid } from "date-fns";
import PageTitleWithBackButton from "@/components/PageTitleWithBackButton";
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
import PageHeader from "@/components/PageHeader";
import ContainerWrapper from "@/components/ContainerWrapper";
import Loader from "@/components/Loader";
import { useDoneBySummary } from "@/apps/user/hooks/api/doneBySummary/useDoneBySummary";
import { useIsMobile } from "@/utils/useIsMobile";
import ScrollContainer from "@/components/ScrollContainer";
import ListItem from "@/components/ListItem/component";
import Spacer from "@/components/Spacer";
import TitleContainer from "@/components/TitleContainer";
import TableTopContainer from "@/apps/user/components/TableTopContainer";
import DateFilter from "@/components/DateFilter";
import RefreshButton from "@/components/RefreshButton";
import HStack from "@/components/HStack/component";
import useSyncURLParams from "@/hooks/useSyncURLParams";

import "./style.scss";

const stateReducer = (state, newState) => ({ ...state, ...newState });

const DoneByRow = React.memo(({ item, index }) => {
  return (
    <Tr key={item.done_by_id}>
      <TdSL index={index} />
      <Td>{item.name}</Td>
      <Td>{item.count}</Td>
      <Td>{item.total_amount}</Td>
    </Tr>
  );
});

const MobileDoneByCard = React.memo(({ item }) => {
  return (
    <ListItem
      key={item.done_by_id}
      title={item.name}
      subtitle={`Count: ${item.count} | Total: ${item.total_amount}`}
    />
  );
});

const DoneByListView = () => {
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();

  const [state, setState] = useReducer(stateReducer, {
    start_date: searchParams.get("startDate") || "",
    end_date: searchParams.get("endDate") || "",
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

  const { data, isLoading } = useDoneBySummary(state);

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
      ? `${format(new Date(startDate), "MMM d, yyyy")} to ${format(
          new Date(endDate),
          "MMM d, yyyy"
        )}`
      : "No date range selected";
  }, [dateFilter]);

  return (
    <>
      <ContainerWrapper>
        {!isMobile ? (
          <>
            <PageTitleWithBackButton
              title="Done-By Based Summary"
              subtitle={dateSubtitle}
            />
            <TableTopContainer
              //isMargin={true}
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
              <Table className="done-by-table">
                <Thead>
                  <Tr>
                    <ThSL />
                    <Th>Name</Th>
                    <Th>Count</Th>
                    <Th>Amount</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {listData && listData.length > 0 ? (
                    listData.map((item, index) => (
                      <DoneByRow
                        key={item.done_by_id}
                        item={item}
                        index={index}
                      />
                    ))
                  ) : (
                    <TableCaption item="Summary Report" noOfCol={4} />
                  )}
                </Tbody>
              </Table>
            )}
          </>
        ) : (
          <>
            <TitleContainer>
              <PageTitleWithBackButton title="Done-By Summary" />
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
              ) : listData && listData.length === 0 ? (
                <TableCaption item="Summary Report" />
              ) : (
                <div>
                  {listData &&
                    listData.map((item) => (
                      <MobileDoneByCard key={item.done_by_id} item={item} />
                    ))}
                </div>
              )}
              <Spacer />
            </ScrollContainer>
          </>
        )}
      </ContainerWrapper>
    </>
  );
};

export default DoneByListView;
