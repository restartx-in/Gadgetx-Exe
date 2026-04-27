import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  useReducer,
} from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDoneBys } from "@/apps/user/hooks/api/doneBy/useDoneBys";
import { useCostCenters } from "@/apps/user/hooks/api/costCenter/useCostCenters";
import { useIsMobile } from "@/utils/useIsMobile";
import useRegisterSessionsPaginated from "@/apps/user/hooks/api/registerSession/useRegisterSessionsPaginated";
import useCurrentRegisterSession from "@/apps/user/hooks/api/registerSession/useCurrentRegisterSession";
import useSyncURLParams from "@/hooks/useSyncURLParams";

import CloseRegisterModal from "@/apps/user/pages/POS/components/CloseRegisterModal";

import {
  Table,
  Thead,
  Tbody,
  Tr,
  Td,
  Th,
  ThSort,
  TdSL,
  ThSL,
  TableCaption,
  ThContainer,
  ThFilterContainer,
  ThSearchOrFilterPopover,
  ThDotMenu,
} from "@/components/Table";
import AddButton from "@/components/AddButton";
import DateField from "@/components/DateField";
import HStack from "@/components/HStack/component.jsx";
import VStack from "@/components/VStack";
import TableTopContainer from "@/apps/user/components/TableTopContainer";
import PageTitleWithBackButton from "@/components/PageTitleWithBackButton";
import RefreshButton from "@/components/RefreshButton";
import TableFooter from "@/components/TableFooter";
import PopUpFilter from "@/components/PopUpFilter";
import Loader from "@/components/Loader";
import ContainerWrapper from "@/components/ContainerWrapper";
import ScrollContainer from "@/components/ScrollContainer";
import SelectField from "@/components/SelectField";
import DotMenu from "@/apps/user/components/DotMenu/component";
import DoneByAutoComplete from "@/apps/user/components/DoneByAutoComplete";
import CostCenterAutoComplete from "@/apps/user/components/CostCenterAutoComplete";
import TextBadge from "@/components/TextBadge";
import ListItem from "@/components/ListItem/component";
import PageHeader from "@/components/PageHeader";
import Spacer from "@/components/Spacer";

import "./style.scss";

// REDUCER FUNCTION: Handles merging of state updates
const stateReducer = (state, newState) => ({ ...state, ...newState });

// Utility for date formatting
const formatDateTime = (dateString) => {
  if (!dateString) return "Running...";
  return new Date(dateString).toLocaleString();
};

// Extracted Row Component
const RegisterSessionRow = React.memo(
  ({
    session,
    index,
    page,
    pageSize,
    doneByNameMap,
    costCenterNameMap,
    handlers,
  }) => {
    const menuItems = useMemo(() => {
      const items = [
        { label: "View Details", onClick: () => handlers.onView(session.id) },
      ];
      if (session.status === "open") {
        items.push({
          label: "Close Session",
          onClick: () => handlers.onClose(session.id),
          color: "red",
        });
      }
      return items;
    }, [session.id, session.status, handlers]);

    return (
      <Tr key={session.id}>
        <TdSL index={index} page={page} pageSize={pageSize} />
        <Td>{formatDateTime(session.opened_at)}</Td>
        <Td>{doneByNameMap[session.done_by_id] || "N/A"}</Td>
        <Td>{costCenterNameMap[session.cost_center_id] || "N/A"}</Td>
        <Td>
          <TextBadge
            variant="paymentStatus"
            type={session.status === "open" ? "Partial" : "Paid"}
          >
            {session.status.toUpperCase()}
          </TextBadge>
        </Td>
        <Td>{formatDateTime(session.closed_at)}</Td>
        <Td>
          <DotMenu items={menuItems} />
        </Td>
      </Tr>
    );
  }
);

// Extracted Mobile Card Component
const MobileRegisterSessionCard = React.memo(
  ({ session, doneByNameMap, costCenterNameMap, handlers }) => {
    const menuItems = useMemo(() => {
      const items = [
        { label: "View Details", onClick: () => handlers.onView(session.id) },
      ];
      if (session.status === "open") {
        items.push({
          label: "Close Session",
          onClick: () => handlers.onClose(session.id),
          color: "red",
        });
      }
      return items;
    }, [session.id, session.status, handlers]);

    return (
      <ListItem
        title={`Opened: ${formatDateTime(session.opened_at)}`}
        subtitle={
          <>
            <div className="list-item-status-wrapper">
              <TextBadge
                variant="paymentStatus"
                type={session.status === "open" ? "Partial" : "Paid"}
              >
                {session.status.toUpperCase()}
              </TextBadge>
            </div>
            <div>Done By: {doneByNameMap[session.done_by_id] || "N/A"}</div>
            {session.cost_center_id && (
              <div>
                Cost Center: {costCenterNameMap[session.cost_center_id]}
              </div>
            )}
            <div>Closed: {formatDateTime(session.closed_at)}</div>
          </>
        }
        actions={<DotMenu items={menuItems} />}
      />
    );
  }
);

const RegisterSessionReport = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // UI States for filter inputs (Local State - Remain useState)
  const [doneById, setDoneById] = useState("");
  const [costCenterId, setCostCenterId] = useState("");
  const [status, setStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Other Component States
  const [showFilter, setShowFilter] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [selectedSessionIdToClose, setSelectedSessionIdToClose] =
    useState(null);

  // --- 1. Centralized state object initialized from URL using useReducer (UPDATED) ---
  const [state, setState] = useReducer(stateReducer, {
    page: parseInt(searchParams.get("page")) || 1,
    page_size: parseInt(searchParams.get("pageSize")) || 10,
    sort: searchParams.get("sort") || "-opened_at",
    done_by_id: searchParams.get("doneById") || "",
    cost_center_id: searchParams.get("costCenterId") || "",
    status: searchParams.get("status") || "",
    start_date: searchParams.get("startDate") || "",
    end_date: searchParams.get("endDate") || "",
  });

  // --- 2. Sync state object to URL ---
  useSyncURLParams({
    page: state.page,
    pageSize: state.page_size,
    sort: state.sort,
    doneById: state.done_by_id,
    costCenterId: state.cost_center_id,
    status: state.status,
    startDate: state.start_date,
    endDate: state.end_date,
  });

  const { data, isLoading, refetch, isRefetching } =
    useRegisterSessionsPaginated(state);
  const {
    data: currentSession,
    refetch: refetchCurrent,
    isLoading: isCurrentSessionLoading,
  } = useCurrentRegisterSession();
  const { data: doneByList = [] } = useDoneBys();
  const { data: costCenterList = [] } = useCostCenters();

  // Derived Data
  const listData = useMemo(() => data?.data || data?.sessions || [], [data]);
  const totalPages = data?.page_count || 1;
  const totalItems = data?.count || 0;
  const loading = isLoading || isRefetching;

  // --- 3. Sync UI Controls from main state ---
  useEffect(() => {
    setDoneById(state.done_by_id || "");
    setCostCenterId(state.cost_center_id || "");
    setStatus(state.status || "");
    setStartDate(state.start_date || "");
    setEndDate(state.end_date || "");
  }, [state]);

  const doneByNameMap = useMemo(
    () =>
      doneByList.reduce((map, item) => {
        map[item.id] = item.name;
        return map;
      }, {}),
    [doneByList]
  );

  const costCenterNameMap = useMemo(
    () =>
      costCenterList.reduce((map, item) => {
        map[item.id] = item.name;
        return map;
      }, {}),
    [costCenterList]
  );

  const statusOptions = useMemo(
    () => [
      { value: "open", label: "Open" },
      { value: "closed", label: "Closed" },
    ],
    []
  );

  // --- Handlers (Memoized) - UPDATED setState CALLS ---

  const handleSort = useCallback((value) => {
    setState({ page: 1, sort: value }); // Simplified setState
  }, []);

  const handleFilter = useCallback(() => {
    setState({
      // Simplified setState
      done_by_id: doneById,
      cost_center_id: costCenterId,
      status: status,
      start_date: startDate,
      end_date: endDate,
      page: 1,
    });
    setShowFilter(false);
  }, [doneById, costCenterId, status, startDate, endDate]);

  const handleRefresh = useCallback(() => {
    // Reset local UI state
    setDoneById("");
    setCostCenterId("");
    setStatus("");
    setStartDate("");
    setEndDate("");

    // Reset main state
    setState({
      // Simplified setState
      done_by_id: "",
      cost_center_id: "",
      status: "",
      start_date: "",
      end_date: "",
      page: 1,
      page_size: 10,
      sort: "-opened_at",
    });
  }, []);

  const handlePageLimitSelect = useCallback(
    (value) => setState({ page_size: value, page: 1 }),
    []
  ); // Simplified setState

  const handlePageChange = useCallback(
    (value) => setState({ page: value }),
    []
  ); // Simplified setState

  useEffect(() => {
    // Check for the specific action from your sidebar's addPath
    if (searchParams.get("action") === "open-register") {
      // Don't do anything until we know if a session is open or not
      if (isCurrentSessionLoading) {
        return;
      }

      // IMPORTANT: Immediately remove the parameter from the URL to prevent this from running again.
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete("action");
      setSearchParams(newSearchParams, { replace: true });

      // Now, run the exact same logic as your button's click handler
      if (currentSession && currentSession.session) {
        setSelectedSessionIdToClose(currentSession.session.id);
        setIsCloseModalOpen(true);
      } else {
        navigate(`/pos`);
      }
    }
  }, [
    searchParams,
    setSearchParams,
    currentSession,
    isCurrentSessionLoading,
    navigate,
  ]);

  // 4. UPDATE the button's click handler to ONLY change the URL
  const handleOpenRegister = useCallback(() => {
    // This function will now simply set the URL parameter.
    // The useEffect we just added will see this change and execute the logic.
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set("action", "open-register");
    setSearchParams(newSearchParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleCloseSession = useCallback((id) => {
    setSelectedSessionIdToClose(id);
    setIsCloseModalOpen(true);
  }, []);

  const handleRegisterClosedSuccess = useCallback(() => {
    setIsCloseModalOpen(false);
    setSelectedSessionIdToClose(null);
    refetch();
    refetchCurrent();
  }, [refetch, refetchCurrent]);

  const handleViewSession = useCallback(
    (id) => navigate(`/register-session/view/${id}`),
    [navigate]
  );

  // Handlers object for rows/cards
  const rowHandlers = useMemo(
    () => ({
      onView: handleViewSession,
      onClose: handleCloseSession,
    }),
    [handleViewSession, handleCloseSession]
  );

  const filterProps = {
    showFilter,
    setShowFilter,
    handleFilter,
    doneById,
    setDoneById,
    costCenterId,
    setCostCenterId,
    status,
    setStatus,
    statusOptions,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
  };

  return (
    <ContainerWrapper>
      {!isMobile ? (
        <>
          <PageTitleWithBackButton title="Register Sessions" />
          <TableTopContainer
            //isMargin={true}
            mainActions={
              <>
                <ListFilter {...filterProps} />
                <RefreshButton onClick={handleRefresh} />
                <AddButton onClick={handleOpenRegister}>
                  {currentSession?.session
                    ? "Close Current Session"
                    : "Open Register"}
                </AddButton>
              </>
            }
          />

          {loading ? (
            <Loader />
          ) : (
            <>
              <Table>
                <Thead>
                  <Tr>
                    <ThSL />
                    <Th>
                      <ThContainer>
                        Opened At
                        <ThSort
                          sort={state.sort}
                          setSort={handleSort}
                          value="opened_at"
                          handleSort={handleSort}
                        />
                      </ThContainer>
                    </Th>
                    <Th>
                      <ThContainer>
                        Done By
                        <ThFilterContainer>
                          <ThSort
                            handleSort={handleSort}
                            sort={state.sort}
                            setSort={handleSort}
                            value="done_by_id"
                          />
                          <ThSearchOrFilterPopover
                            isSearch={false}
                            popoverWidth={220}
                          >
                            <DoneByAutoComplete
                              placeholder="Select User"
                              value={state.done_by_id}
                              onChange={
                                (e) =>
                                  setState({
                                    done_by_id: e.target.value,
                                    page: 1,
                                  }) // Simplified setState
                              }
                              is_edit={false}
                            />
                          </ThSearchOrFilterPopover>
                        </ThFilterContainer>
                      </ThContainer>
                    </Th>
                    <Th>
                      <ThContainer>
                        Cost Center
                        <ThFilterContainer>
                          <ThSearchOrFilterPopover
                            isSearch={false}
                            popoverWidth={220}
                          >
                            <CostCenterAutoComplete
                              placeholder="Select Cost Center"
                              value={state.cost_center_id}
                              onChange={
                                (e) =>
                                  setState({
                                    cost_center_id: e.target.value,
                                    page: 1,
                                  }) // Simplified setState
                              }
                              is_edit={false}
                            />
                          </ThSearchOrFilterPopover>
                        </ThFilterContainer>
                      </ThContainer>
                    </Th>
                    <Th>Status</Th>
                    <Th>Closed At</Th>
                    <ThDotMenu />
                  </Tr>
                </Thead>
                <Tbody>
                  {listData.length > 0 ? (
                    listData.map((session, index) => (
                      <RegisterSessionRow
                        key={session.id}
                        session={session}
                        index={index}
                        page={state.page}
                        pageSize={state.page_size}
                        doneByNameMap={doneByNameMap}
                        costCenterNameMap={costCenterNameMap}
                        handlers={rowHandlers}
                      />
                    ))
                  ) : (
                    <TableCaption item="Register Sessions" noOfCol={7} />
                  )}
                </Tbody>
              </Table>
              <TableFooter
                totalItems={totalItems}
                currentPage={state.page}
                itemsPerPage={state.page_size}
                totalPages={totalPages}
                handlePageLimitSelect={handlePageLimitSelect}
                handlePageChange={handlePageChange}
              />
            </>
          )}
        </>
      ) : (
        <>
          <PageTitleWithBackButton title="Register Sessions" />
          <ScrollContainer>
            <PageHeader>
              <HStack>
                <ListFilter {...filterProps} />
                <RefreshButton onClick={handleRefresh} />
              </HStack>
              <div className="sale_report__add_button">
                <AddButton fullWidth onClick={handleOpenRegister}>
                  {currentSession?.session
                    ? "Close Current Session"
                    : "Open Register"}
                </AddButton>
              </div>
            </PageHeader>

            <div className="sale_report" style={{ marginTop: "0" }}>
              {loading ? (
                <Loader />
              ) : listData.length === 0 ? (
                <TableCaption item="Register Sessions" />
              ) : (
                <div>
                  {listData.map((session) => (
                    <MobileRegisterSessionCard
                      key={session.id}
                      session={session}
                      doneByNameMap={doneByNameMap}
                      costCenterNameMap={costCenterNameMap}
                      handlers={rowHandlers}
                    />
                  ))}
                </div>
              )}
            </div>
            <Spacer />
            {!loading && listData.length > 0 && (
              <TableFooter
                totalItems={totalItems}
                currentPage={state.page}
                itemsPerPage={state.page_size}
                totalPages={totalPages}
                handlePageLimitSelect={handlePageLimitSelect}
                handlePageChange={handlePageChange}
              />
            )}
          </ScrollContainer>
        </>
      )}

      <CloseRegisterModal
        isOpen={isCloseModalOpen}
        sessionId={selectedSessionIdToClose}
        onClose={() => setIsCloseModalOpen(false)}
        onKeepOpen={() => setIsCloseModalOpen(false)}
        onRegisterClosed={handleRegisterClosedSuccess}
      />
    </ContainerWrapper>
  );
};

// Memoized List Filter
const ListFilter = React.memo(({ ...props }) => {
  const {
    showFilter,
    setShowFilter,
    handleFilter,
    doneById,
    setDoneById,
    costCenterId,
    setCostCenterId,
    status,
    setStatus,
    statusOptions,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
  } = props;

  const isMobile = useIsMobile();
  return (
    <PopUpFilter
      isOpen={showFilter}
      setIsOpen={setShowFilter}
      onApply={handleFilter}
    >
      <VStack spacing={4}>
        <DoneByAutoComplete
          placeholder="Done By"
          value={doneById}
          onChange={(e) => setDoneById(e.target.value)}
          is_edit={false}
        />
        <CostCenterAutoComplete
          placeholder="Cost Center"
          value={costCenterId}
          onChange={(e) => setCostCenterId(e.target.value)}
          is_edit={false}
        />
        <SelectField
          placeholder="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          options={[{ value: "", label: "All" }, ...statusOptions]}
        />
        {isMobile ? (
          <>
            <DateField
              label="Start Date"
              value={startDate ? new Date(startDate) : null}
              onChange={(date) =>
                setStartDate(date?.toISOString().split("T")[0] || "")
              }
            />
            <DateField
              label="End Date"
              value={endDate ? new Date(endDate) : null}
              onChange={(date) =>
                setEndDate(date?.toISOString().split("T")[0] || "")
              }
            />
          </>
        ) : (
          <HStack>
            <DateField
              label="Start Date"
              value={startDate ? new Date(startDate) : null}
              onChange={(date) =>
                setStartDate(date?.toISOString().split("T")[0] || "")
              }
            />
            <DateField
              label="End Date"
              value={endDate ? new Date(endDate) : null}
              onChange={(date) =>
                setEndDate(date?.toISOString().split("T")[0] || "")
              }
            />
          </HStack>
        )}
      </VStack>
    </PopUpFilter>
  );
});

export default RegisterSessionReport;
