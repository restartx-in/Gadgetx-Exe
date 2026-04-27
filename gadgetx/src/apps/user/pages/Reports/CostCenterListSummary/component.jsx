import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useReducer,
} from "react";
import { format, isValid } from "date-fns";

import useCostCenterSummary from "@/apps/user/hooks/api/costCenterSummary/useCostCenterSummary";
import { useIsMobile } from "@/utils/useIsMobile";

import PageTitleWithBackButton from "@/components/PageTitleWithBackButton";
import ContainerWrapper from "@/components/ContainerWrapper";
import ScrollContainer from "@/components/ScrollContainer";
import TableTopContainer from "@/apps/user/components/TableTopContainer";
import DateFilter from "@/components/DateFilter";
import RefreshButton from "@/components/RefreshButton";
import Loader from "@/components/Loader";
import ListItem from "@/components/ListItem/component";
import PageHeader from "@/components/PageHeader";
import HStack from "@/components/HStack/component.jsx";
import TitleContainer from "@/components/TitleContainer";
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

const CostCenterListSummary = () => {
  const isMobile = useIsMobile();

  const [dateFilter, setDateFilter] = useState({
    startDate: null,
    endDate: null,
    rangeType: "custom",
  });

  const [state, setState] = useReducer(stateReducer, {
    start_date: "",
    end_date: "",
  });

  const { data, isLoading } = useCostCenterSummary(state);

  const listData = useMemo(() => data || [], [data]);

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
    <ContainerWrapper>
      {!isMobile ? (
        <>
          <PageTitleWithBackButton
            title="Cost-Center Based Summary"
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
            <Table>
              <Thead>
                <Tr>
                  <ThSL />
                  <Th>Cost Center</Th>
                  <Th>Income</Th>
                  <Th>Sales</Th>
                  <Th>Sale Returns</Th>
                  <Th>Expense</Th>
                  <Th>Purchase</Th>
                  <Th>Purchase Returns</Th>
                  <Th>Net Profit</Th>
                </Tr>
              </Thead>
              <Tbody>
                {listData.length > 0 ? (
                  listData.map((item, index) => (
                    <Tr key={item.cost_center_id || index}>
                      <TdSL index={index} />
                      <Td>{item.cost_center_name}</Td>
                      <Td>{item.income}</Td>
                      <Td>{item.sales}</Td>
                      <Td>{item.sale_returns}</Td>
                      <Td>{item.expense}</Td>
                      <Td>{item.purchase}</Td>
                      <Td>{item.purchase_returns}</Td>
                      <Td>{item.net_profit}</Td>
                    </Tr>
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
            <PageTitleWithBackButton title="Cost-Center Based Summary" />
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
                {listData.map((item) => (
                  <ListItem
                    key={item.cost_center_id}
                    title={item.cost_center_name}
                    subtitle={
                      <>
                        <div>
                          <strong>Net Profit: {item.net_profit}</strong>
                        </div>
                        <div>Income: {item.income}</div>
                        <div>Expense: {item.expense}</div>
                        <div>
                          Sales: {item.sales} (Returns: {item.sale_returns})
                        </div>
                        <div>
                          Purchase: {item.purchase} (Returns:{" "}
                          {item.purchase_returns})
                        </div>
                      </>
                    }
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

export default CostCenterListSummary;
