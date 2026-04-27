import { useState, useEffect, useMemo, useCallback, useReducer } from "react";
import { useSearchParams } from "react-router-dom";
import { format, isValid } from "date-fns";

import useBalanceSheetReport from "@/apps/user/hooks/api/balanceSheetReport/useBalanceSheetReport";
import { useIsMobile } from "@/utils/useIsMobile";
import useSyncURLParams from "@/hooks/useSyncURLParams";

import PageTitleWithBackButton from "@/components/PageTitleWithBackButton";
import ContainerWrapper from "@/components/ContainerWrapper";
import ScrollContainer from "@/components/ScrollContainer";
import TableTopContainer from "@/apps/user/components/TableTopContainer";
import RefreshButton from "@/components/RefreshButton";
import Loader from "@/components/Loader";
import ListItem from "@/components/ListItem/component";
import PageHeader from "@/components/PageHeader";
import HStack from "@/components/HStack/component.jsx";
import DateField from "@/components/DateField";
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

const BalanceSheetReport = () => {
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();

  const [state, setState] = useReducer(stateReducer, {
    as_of_date: searchParams.get("asOfDate") || "",
  });

  const [asOfDate, setAsOfDate] = useState(null);

  useSyncURLParams({
    asOfDate: state.as_of_date,
  });

  const { data, isLoading, isFetching } = useBalanceSheetReport(state);

  useEffect(() => {
    const dateFromState = state.as_of_date;
    if (dateFromState && isValid(new Date(dateFromState))) {
      const [year, month, day] = dateFromState.split("-").map(Number);
      setAsOfDate(new Date(year, month - 1, day));
    } else {
      setAsOfDate(null);
    }
  }, [state.as_of_date]);

  const reportData = useMemo(() => data, [data]);

  const handleDateChange = useCallback((date) => {
    setAsOfDate(date);
    setState({ as_of_date: date ? format(date, "yyyy-MM-dd") : "" });
  }, []);

  const handleRefresh = useCallback(() => {
    setAsOfDate(null);
    setState({ as_of_date: "" });
  }, []);

  const {
    as_of_date: responseDate,
    assets,
    liabilities,
    equity,
  } = reportData || {};

  const hasData = useMemo(() => assets && liabilities, [assets, liabilities]);

  const dateSubtitle = useMemo(() => {
    if (!responseDate) return "Showing latest data...";

    const parsed = new Date(responseDate);
    if (!isValid(parsed)) return "Showing latest data...";

    return `As of: ${format(parsed, "MMM d, yyyy")}`;
  }, [responseDate]);

  const formatNumber = useCallback((value) => {
    if (value === null || value === undefined) return "0.00";
    return Number(value).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, []);

  return (
    <ContainerWrapper>
      {!isMobile ? (
        <>
          <PageTitleWithBackButton
            title="Balance Sheet Report"
            subtitle={dateSubtitle}
          />
          <TableTopContainer
            //isMargin={true}
            mainActions={
              <>
                <DateField
                  label="As of Date"
                  value={asOfDate}
                  onChange={handleDateChange}
                  isClearable={true}
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
                  <Th>Account</Th>
                  <Th>Amount</Th>
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
                        Assets
                      </Th>
                      <Th></Th>
                    </Tr>
                    <Tr>
                      <Td>Cash in Hand</Td>
                      <Td>{formatNumber(assets.cash_in_hand)}</Td>
                    </Tr>
                    <Tr>
                      <Td>Bank Balance</Td>
                      <Td>{formatNumber(assets.bank_balance)}</Td>
                    </Tr>
                    <Tr>
                      <Td>Stock Value</Td>
                      <Td>{formatNumber(assets.stock_value)}</Td>
                    </Tr>
                    <Tr>
                      <Td>Accounts Receivable</Td>
                      <Td>{formatNumber(assets.accounts_receivable)}</Td>
                    </Tr>
                    <Tr>
                      <Th>Total Assets</Th>
                      <Th>{formatNumber(assets.total_assets)}</Th>
                    </Tr>

                    <Tr>
                      <Th
                        colSpan="2"
                        style={{
                          textAlign: "center",
                          background: "var(--color-background-tertiary)",
                        }}
                      >
                        Liabilities
                      </Th>
                      <Th></Th>
                    </Tr>
                    <Tr>
                      <Td>Accounts Payable</Td>
                      <Td>{formatNumber(liabilities.accounts_payable)}</Td>
                    </Tr>
                    <Tr>
                      <Th>Total Liabilities</Th>
                      <Th>{formatNumber(liabilities.total_liabilities)}</Th>
                    </Tr>

                    <Tr>
                      <Th
                        colSpan="2"
                        style={{
                          textAlign: "center",
                          background: "var(--color-background-tertiary)",
                        }}
                      >
                        Equity
                      </Th>
                      <Th></Th>
                    </Tr>
                    <Tr>
                      <Th>Owner's Equity</Th>
                      <Th>{formatNumber(equity)}</Th>
                    </Tr>
                  </>
                ) : (
                  <TableCaption item="Balance Sheet Report" noOfCol={2} />
                )}
              </Tbody>
            </Table>
          )}
        </>
      ) : (
        <>
          <PageTitleWithBackButton
            title="Balance Sheet Report"
            subtitle={dateSubtitle}
          />
          <ScrollContainer>
            <PageHeader>
              <HStack>
                <DateField
                  label="As of Date"
                  value={asOfDate}
                  onChange={handleDateChange}
                  isClearable={true}
                />
                <RefreshButton onClick={handleRefresh} isLoading={isFetching} />
              </HStack>
            </PageHeader>
            {isLoading ? (
              <Loader />
            ) : !hasData ? (
              <TableCaption item="Balance Sheet Report" />
            ) : (
              <div>
                <ListItem
                  title="Assets"
                  subtitle={
                    <>
                      <div>
                        <strong>
                          Total: {formatNumber(assets.total_assets)}
                        </strong>
                      </div>
                      <div>Cash: {formatNumber(assets.cash_in_hand)}</div>
                      <div>Bank: {formatNumber(assets.bank_balance)}</div>
                      <div>Stock: {formatNumber(assets.stock_value)}</div>
                      <div>
                        Receivables: {formatNumber(assets.accounts_receivable)}
                      </div>
                    </>
                  }
                />
                <ListItem
                  title="Liabilities"
                  subtitle={
                    <>
                      <div>
                        <strong>
                          Total: {formatNumber(liabilities.total_liabilities)}
                        </strong>
                      </div>
                      <div>
                        Payables: {formatNumber(liabilities.accounts_payable)}
                      </div>
                    </>
                  }
                />
                <ListItem
                  title="Equity"
                  subtitle={
                    <>
                      <div>
                        <strong>Owner's Equity: {formatNumber(equity)}</strong>
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

export default BalanceSheetReport;
