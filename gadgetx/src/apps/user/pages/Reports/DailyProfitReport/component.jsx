import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useReducer,
} from "react";
import { format, isValid } from "date-fns";

import useDailyProfitReport from "@/apps/user/hooks/api/dailyProfitReport/useDailyProfitReport";
import { useIsMobile } from "@/utils/useIsMobile";

import PageTitleWithBackButton from "@/components/PageTitleWithBackButton";
import ContainerWrapper from "@/components/ContainerWrapper";
import ScrollContainer from "@/components/ScrollContainer";
import TitleContainer from "@/components/TitleContainer";
import TableTopContainer from "@/apps/user/components/TableTopContainer";
import DateFilter from "@/components/DateFilter";
import RefreshButton from "@/components/RefreshButton";
import Loader from "@/components/Loader";
import ListItem from "@/components/ListItem/component";
import PageHeader from "@/components/PageHeader";
import HStack from "@/components/HStack/component.jsx";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Td,
  Th,
  TableCaption,
} from "@/components/Table";

const stateReducer = (state, newState) => ({ ...state, ...newState });

const DailyProfitReport = () => {
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

  const { data, isLoading, isFetching } = useDailyProfitReport(state);

  const reportData = useMemo(() => data, [data]);

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
      : "Showing all-time data";
  }, [dateFilter]);

  const { breakdown, financials } = reportData || {};
  const hasData = useMemo(
    () => financials && breakdown,
    [financials, breakdown]
  );

  return (
    <ContainerWrapper>
      {!isMobile ? (
        <>
          <PageTitleWithBackButton
            title="Daily Profit Report"
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
                <RefreshButton onClick={handleRefresh} isLoading={isFetching} />
              </>
            }
          />

          {isLoading ? (
            <Loader />
          ) : (
            <Table>
              <Thead>
                <Tr>
                  <Th>Metric</Th>
                  <Th>Value</Th>
                </Tr>
              </Thead>
              <Tbody>
                {hasData ? (
                  <>
                    <Tr>
                      <Th
                        colSpan="2"
                        style={{
                          textAlign: "center",
                          background: "var(--color-background-tertiary)",
                        }}
                      >
                        Financials
                      </Th>
                      <Th></Th>
                    </Tr>
                    <Tr>
                      <Td>Total Revenue</Td>
                      <Td>{financials.total_revenue?.toLocaleString()}</Td>
                    </Tr>
                    <Tr>
                      <Td>Total Cost</Td>
                      <Td>{financials.total_cost?.toLocaleString()}</Td>
                    </Tr>
                    <Tr>
                      <Td>Net Profit</Td>
                      <Td>{financials.net_profit?.toLocaleString()}</Td>
                    </Tr>

                    <Tr>
                      <Th
                        colSpan="2"
                        style={{
                          textAlign: "center",
                          background: "var(--color-background-tertiary)",
                        }}
                      >
                        Breakdown
                      </Th>
                      <Th></Th>
                    </Tr>
                    <Tr>
                      <Td>Product Sales</Td>
                      <Td>{breakdown.product_sales?.toLocaleString()}</Td>
                    </Tr>
                    <Tr>
                      <Td>Service Revenue</Td>
                      <Td>{breakdown.service_revenue?.toLocaleString()}</Td>
                    </Tr>
                    <Tr>
                      <Td>Product Cost</Td>
                      <Td>{breakdown.product_cost?.toLocaleString()}</Td>
                    </Tr>
                    <Tr>
                      <Td>Service Cost</Td>
                      <Td>{breakdown.service_cost?.toLocaleString()}</Td>
                    </Tr>
                    <Tr>
                      <Td>Expenses</Td>
                      <Td>{breakdown.expenses?.toLocaleString()}</Td>
                    </Tr>
                  </>
                ) : (
                  <TableCaption item="Daily Profit Report" noOfCol={2} />
                )}
              </Tbody>
            </Table>
          )}
        </>
      ) : (
        <>
          <TitleContainer>
            <PageTitleWithBackButton title="Daily Profit Report" />
          </TitleContainer>
          <ScrollContainer>
            <PageHeader>
              <HStack>
                <DateFilter
                  value={dateFilter}
                  onChange={handleDateFilterChange}
                />
                <RefreshButton onClick={handleRefresh} isLoading={isFetching} />
              </HStack>
            </PageHeader>
            {isLoading ? (
              <Loader />
            ) : !hasData ? (
              <TableCaption item="Daily Profit Report" />
            ) : (
              <div>
                <ListItem
                  title="Financials"
                  subtitle={
                    <>
                      <div>
                        <strong>
                          Net Profit: {financials.net_profit?.toLocaleString()}
                        </strong>
                      </div>
                      <div>
                        Total Revenue:{" "}
                        {financials.total_revenue?.toLocaleString()}
                      </div>
                      <div>
                        Total Cost: {financials.total_cost?.toLocaleString()}
                      </div>
                    </>
                  }
                />
                <ListItem
                  title="Breakdown"
                  subtitle={
                    <>
                      <div>
                        Product Sales:{" "}
                        {breakdown.product_sales?.toLocaleString()}
                      </div>
                      <div>
                        Service Revenue:{" "}
                        {breakdown.service_revenue?.toLocaleString()}
                      </div>
                      <div>
                        Product Cost: {breakdown.product_cost?.toLocaleString()}
                      </div>
                      <div>
                        Service Cost: {breakdown.service_cost?.toLocaleString()}
                      </div>
                      <div>
                        Expenses: {breakdown.expenses?.toLocaleString()}
                      </div>
                    </>
                  }
                />
              </div>
            )}
          </ScrollContainer>
        </>
      )}
    </ContainerWrapper>
  );
};

export default DailyProfitReport;
