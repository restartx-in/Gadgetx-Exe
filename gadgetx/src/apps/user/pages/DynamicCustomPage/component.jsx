import React, { useState, useEffect, useMemo, useRef } from "react";
import { useLocation } from "react-router-dom";
import api from "@/utils/axios/api";
import PageTitleWithBackButton from "@/components/PageTitleWithBackButton";
import ContainerWrapper from "@/components/ContainerWrapper";
import TableTopContainer from "@/apps/user/components/TableTopContainer";
import AddButton from "@/components/AddButton";
import RefreshButton from "@/components/RefreshButton";
import Loader from "@/components/Loader";
import TableFooter from "@/components/TableFooter";
import SelectField from "@/components/SelectField";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Td,
  Th,
  ThSL,
  TdSL,
  TdMenu,
  ThMenu,
  ThContainer,
  ThSort,
  ThFilterContainer,
  ThSearchOrFilterPopover,
} from "@/components/Table";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/components/Modal/component";
import InputField from "@/components/InputField";
import TextArea from "@/components/TextArea";
import Button from "@/components/Button";
import { useIsMobile } from "@/utils/useIsMobile";
import demoLogo from "@/assets/user/demo-logo.svg";
import PopupSearchField from "@/components/PopupSearchField";
import PopUpFilter from "@/components/PopUpFilter";
import VStack from "@/components/VStack";
import "./style.scss";

const EXISTING_SYSTEM_TABLES = [
  { label: "Customer",         type: "customer",        endpoint: "/party",           query: "?type=customer", labelField: "name" },
  { label: "Supplier", type: "supplier",        endpoint: "/party",           query: "?type=supplier", labelField: "name" },
  { label: "Cost Center",      type: "cost_center",     endpoint: "/cost-centers",    query: "",               labelField: "name" },
  { label: "Employee",         type: "employee",        endpoint: "/employees",       query: "",               labelField: "name" },
  { label: "Brand",            type: "brand",           endpoint: "/brand",           query: "",               labelField: "name" },
  { label: "Category",         type: "category",        endpoint: "/category",        query: "",               labelField: "name" },
  { label: "Service",          type: "service",         endpoint: "/services",        query: "",               labelField: "name" },
  { label: "Mode of Payment",  type: "mode_of_payment", endpoint: "/mode-of-payment", query: "",               labelField: "name" },
  { label: "Expense Type",     type: "expense_type",    endpoint: "/expense-type",    query: "",               labelField: "name" },
  { label: "Done By",          type: "done_by",         endpoint: "/done-by",         query: "",               labelField: "name" },
  { label: "Account",          type: "account",         endpoint: "/accounts",         query: "",               labelField: "name" },
  { label: "Ledger",          type: "ledger",         endpoint: "/ledgers",         query: "",               labelField: "name" },


];

const resolveFKDisplay = (col, rawValue, fkOptions) => {
  if (col.isForeignKey && typeof rawValue === "object" && rawValue !== null) {
    const opts = fkOptions[col.referenceTable] || [];
    const found = opts.find((o) => o.value === rawValue.value);
    return found ? found.label : rawValue.value || "-";
  }
  return rawValue != null ? String(rawValue) : "-";
};

const DynamicCustomPage = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const fileInputRef = useRef(null);

  const [pageConfig, setPageConfig] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [fkOptions, setFkOptions] = useState({});

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [currentRowId, setCurrentRowId] = useState(null);
  const [formData, setFormData] = useState({});

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [filters, setFilters] = useState({});

  const [showFilter, setShowFilter] = useState(false);
  const [uiFilters, setUiFilters] = useState({});
  const [searchType, setSearchType] = useState("");
  const [searchKey, setSearchKey] = useState("");
  const searchRef = useRef(null);

  const fetchPageConfig = async () => {
    try {
      setLoading(true);
      const path = location.pathname;
      const { data } = await api.get(
        `/custom-pages/by-path?path=${encodeURIComponent(path)}`,
      );
      const config = data.data;
      setPageConfig(config);

      if (config) {
        await fetchRows(config.id);

        const optionsMap = {};

        const customFkCols =
          config.table_config?.filter(
            (col) =>
              col.isForeignKey &&
              (col.referenceType === "custom" || !col.referenceType) &&
              col.referencePageId,
          ) || [];

        for (const col of customFkCols) {
          try {
            const res = await api.get(`/custom-page-data/${col.referencePageId}`);
            optionsMap[col.referencePageId] = (res.data.data || []).map(
              (row) => {
                const firstKey = Object.keys(row.row_data)[0];
                return {
                  label: row.row_data[firstKey] || "Unnamed Entry",
                  value: row.row_data[firstKey],
                };
              },
            );
          } catch (e) {
            console.error("Failed to fetch custom FK data", e);
          }
        }

        const existingFkCols =
          config.table_config?.filter(
            (col) =>
              col.isForeignKey &&
              col.referenceType === "existing" &&
              col.referenceTable,
          ) || [];

        for (const col of existingFkCols) {
          if (optionsMap[col.referenceTable]) continue;

          const tableInfo = EXISTING_SYSTEM_TABLES.find(
            (t) => t.type === col.referenceTable,
          );
          if (!tableInfo) continue;

          try {
            const url = tableInfo.endpoint + (tableInfo.query || "");
            const res = await api.get(url);
            // Handle both paginated { data: { data: [] } } and flat { data: [] } shapes
            const raw = res.data?.data ?? res.data ?? [];
            const records = Array.isArray(raw) ? raw : (raw.data ?? []);
            optionsMap[col.referenceTable] = records.map((r) => ({
              label:
                r[tableInfo.labelField] ||
                r.name ||
                r.title ||
                String(r.id),
              value: String(r.id),
            }));
          } catch (e) {
            console.error(
              `Failed to fetch existing table FK data (${col.referenceTable})`,
              e,
            );
          }
        }

        setFkOptions(optionsMap);
      }
    } catch (error) {
      console.error("Failed to fetch custom page config", error);
      setPageConfig(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchRows = async (pageId) => {
    try {
      const { data } = await api.get(`/custom-page-data/${pageId}`);
      setRows(data.data || []);
    } catch (error) {
      console.error("Failed to fetch custom page data", error);
    }
  };

  useEffect(() => {
    fetchPageConfig();
    setPage(1);
    setFilters({});
    setSortField("");
  }, [location.pathname]);

  const handleRefresh = () => {
    setFilters({});
    setUiFilters({});
    setSearchKey("");
    setSearchType("");
    setSortField("");
    setPage(1);
    if (pageConfig) {
      setLoading(true);
      fetchRows(pageConfig.id).finally(() => setLoading(false));
    }
  };

  const handleFileChange = (e, colName) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, [colName]: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const generateBarcode = (colName) => {
    const code = Math.floor(
      100000000000 + Math.random() * 900000000000,
    ).toString();
    setFormData({ ...formData, [colName]: code });
  };

  const processedRows = useMemo(() => {
    let result = [...rows];
    Object.keys(filters).forEach((key) => {
      const searchTerm = filters[key]?.toLowerCase();
      if (searchTerm) {
        result = result.filter((r) => {
          const val = r.row_data[key];
          // Handle FK objects
          const displayVal =
            typeof val === "object" && val !== null
              ? val.value || ""
              : val;
          return (
            displayVal != null &&
            String(displayVal).toLowerCase().includes(searchTerm)
          );
        });
      }
    });
    if (sortField) {
      result.sort((a, b) => {
        const getVal = (row) => {
          const v = row.row_data[sortField];
          return typeof v === "object" && v !== null
            ? String(v.value || "").toLowerCase()
            : String(v || "").toLowerCase();
        };
        const valA = getVal(a);
        const valB = getVal(b);
        if (valA < valB) return sortOrder === "asc" ? -1 : 1;
        if (valA > valB) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [rows, filters, sortField, sortOrder]);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return processedRows.slice(start, start + pageSize);
  }, [processedRows, page, pageSize]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
    setPage(1);
  };

  const handleSearch = () => {
    if (searchType) {
      setFilters((prev) => ({ ...prev, [searchType]: searchKey }));
    }
  };

  const handleInputChange = (value, colName) => {
    setFormData({ ...formData, [colName]: value });
  };

  const handleExistingFKChange = (selectedValue, col) => {
    setFormData({
      ...formData,
      [col.name]: selectedValue
        ? { type: col.referenceTable, value: selectedValue }
        : "",
    });
  };

  const getExistingFKValue = (colName) => {
    const stored = formData[colName];
    if (typeof stored === "object" && stored !== null) return stored.value || "";
    return stored || "";
  };

  const openAddModal = () => {
    setModalMode("add");
    setFormData({});
    setCurrentRowId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (row) => {
    setModalMode("edit");
    setFormData(row.row_data || {});
    setCurrentRowId(row.id);
    setIsModalOpen(true);
  };

  const openViewModal = (row) => {
    setModalMode("view");
    setFormData(row.row_data || {});
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === "add") {
        await api.post(`/custom-page-data/${pageConfig.id}`, formData);
      } else if (modalMode === "edit") {
        await api.put(
          `/custom-page-data/${pageConfig.id}/${currentRowId}`,
          formData,
        );
      }
      setIsModalOpen(false);
      fetchRows(pageConfig.id);
    } catch (error) {
      console.error("Error saving row", error);
      alert("Failed to save data");
    }
  };

  const handleDelete = async (rowId) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await api.delete(`/custom-page-data/${pageConfig.id}/${rowId}`);
      fetchRows(pageConfig.id);
    } catch (error) {
      console.error("Error deleting", error);
    }
  };

  if (loading) return <Loader />;
  if (!pageConfig)
    return <div style={{ padding: "20px" }}>Page not found.</div>;

  const columns = pageConfig.table_config || [];
  const searchOptions = columns.map((col) => ({
    value: col.name,
    name: col.name.replace(/_/g, " "),
  }));

  return (
    <ContainerWrapper>
      <PageTitleWithBackButton title={pageConfig.title} />
      <TableTopContainer
        mainActions={
          <>
            <PopUpFilter
              isOpen={showFilter}
              setIsOpen={setShowFilter}
              onApply={() => setFilters({ ...filters, ...uiFilters })}
            >
              <VStack>
                {columns.map((col) => (
                  <InputField
                    key={col.name}
                    label={col.name.replace(/_/g, " ")}
                    value={uiFilters[col.name] || ""}
                    onChange={(e) =>
                      setUiFilters({ ...uiFilters, [col.name]: e.target.value })
                    }
                  />
                ))}
              </VStack>
            </PopUpFilter>
            <RefreshButton onClick={handleRefresh} />
            <PopupSearchField
              searchRef={searchRef}
              searchKey={searchKey}
              setSearchKey={setSearchKey}
              searchType={searchType}
              setSearchType={setSearchType}
              handleSearch={handleSearch}
              searchOptions={searchOptions}
            />
            <AddButton onClick={openAddModal}>Add Entry</AddButton>
          </>
        }
      />

      <Table>
        <Thead>
          <Tr>
            <ThSL />
            {columns.map((col, idx) => (
              <Th key={idx}>
                <ThContainer>
                  {col.name}
                  <ThFilterContainer>
                    <ThSort
                      sort={
                        sortField === col.name
                          ? sortOrder === "desc"
                            ? `-${col.name}`
                            : col.name
                          : ""
                      }
                      handleSort={() => handleSort(col.name)}
                    />
                    <ThSearchOrFilterPopover isSearch popoverWidth={200}>
                      <InputField
                        value={filters[col.name] || ""}
                        onChange={(e) =>
                          setFilters({ ...filters, [col.name]: e.target.value })
                        }
                        isLabel={false}
                        placeholder={`Search ${col.name}...`}
                      />
                    </ThSearchOrFilterPopover>
                  </ThFilterContainer>
                </ThContainer>
              </Th>
            ))}
            <ThMenu />
          </Tr>
        </Thead>
        <Tbody>
          {paginatedRows.map((row, index) => (
            <Tr key={row.id}>
              <TdSL index={index} page={page} pageSize={pageSize} />
              {columns.map((col, idx) => (
                <Td key={idx}>
                  {col.type === "image" ? (
                    <img
                      src={row.row_data[col.name] || demoLogo}
                      style={{
                        width: "40px",
                        height: "40px",
                        objectFit: "contain",
                      }}
                      alt=""
                    />
                  ) : col.type === "boolean" ? (
                    row.row_data[col.name] ? (
                      <span className="status-tick">✔</span>
                    ) : (
                      <span className="status-cross">✖</span>
                    )
                  ) : (
                    resolveFKDisplay(col, row.row_data[col.name], fkOptions)
                  )}
                </Td>
              ))}
              <TdMenu
                onEdit={() => openEditModal(row)}
                onView={() => openViewModal(row)}
                onDelete={() => handleDelete(row.id)}
              />
            </Tr>
          ))}
        </Tbody>
      </Table>

      <TableFooter
        totalItems={processedRows.length}
        currentPage={page}
        itemsPerPage={pageSize}
        handlePageChange={(v) => setPage(v)}
        handlePageLimitSelect={(v) => {
          setPageSize(v);
          setPage(1);
        }}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size="lg"
      >
        <ModalHeader onClose={() => setIsModalOpen(false)}>
          <h3 style={{ fontSize: "1.25rem", fontWeight: "600" }}>
            {modalMode === "add"
              ? "Add"
              : modalMode === "edit"
                ? "Edit"
                : "View"}{" "}
            Entry
          </h3>
        </ModalHeader>

        <form onSubmit={handleSubmit}>
          <ModalBody>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "20px" }}
            >
              {(() => {
                const rowGroups = [];
                let tempRow = [];

                columns.forEach((col) => {
                  const isFullWidth =
                    col.type === "description" || col.type === "image";

                  if (isFullWidth) {
                    if (tempRow.length > 0) {
                      rowGroups.push(tempRow);
                      tempRow = [];
                    }
                    rowGroups.push([col]);
                  } else {
                    tempRow.push(col);
                    if (tempRow.length === 2) {
                      rowGroups.push(tempRow);
                      tempRow = [];
                    }
                  }
                });
                if (tempRow.length > 0) rowGroups.push(tempRow);

                return rowGroups.map((rowFields, rowIndex) => (
                  <div
                    key={rowIndex}
                    style={{
                      display: "flex",
                      flexDirection: isMobile ? "column" : "row",
                      gap: "20px",
                      width: "100%",
                    }}
                  >
                    {rowFields.map((col, colIndex) => (
                      <div
                        key={colIndex}
                        style={{
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px",
                        }}
                      >
                        <label
                          style={{
                            fontSize: "13px",
                            fontWeight: "600",
                            color: "#4b5563",
                            textTransform: "capitalize",
                          }}
                        >
                          {col.name.replace(/_/g, " ")}
                        </label>

                        {col.isForeignKey ? (
                          col.referenceType === "existing" ? (
                            <SelectField
                              value={getExistingFKValue(col.name)}
                              onChange={(e) =>
                                handleExistingFKChange(e.target.value, col)
                              }
                              disabled={modalMode === "view"}
                              options={[
                                { label: "Select Option", value: "" },
                                ...(fkOptions[col.referenceTable] || []),
                              ]}
                            />
                          ) : (
                            <SelectField
                              value={formData[col.name] || ""}
                              onChange={(e) =>
                                handleInputChange(e.target.value, col.name)
                              }
                              disabled={modalMode === "view"}
                              options={[
                                { label: "Select Option", value: "" },
                                ...(fkOptions[col.referencePageId] || []),
                              ]}
                            />
                          )
                        ) : col.type === "boolean" ? (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              height: "40px",
                              gap: "10px",
                            }}
                          >
                            <label className="switch">
                              <input
                                type="checkbox"
                                checked={!!formData[col.name]}
                                onChange={(e) =>
                                  handleInputChange(e.target.checked, col.name)
                                }
                                disabled={modalMode === "view"}
                              />
                              <span className="slider"></span>
                            </label>
                            <span
                              style={{ fontSize: "14px", color: "#6b7280" }}
                            >
                              {formData[col.name] ? "Active" : "Inactive"}
                            </span>
                          </div>
                        ) : col.type === "image" ? (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "15px",
                              padding: "12px",
                              border: "1px solid #e5e7eb",
                              borderRadius: "8px",
                              background: "#f9fafb",
                            }}
                          >
                            <img
                              src={formData[col.name] || demoLogo}
                              style={{
                                width: "64px",
                                height: "64px",
                                objectFit: "contain",
                                borderRadius: "4px",
                                background: "#fff",
                                border: "1px solid #eee",
                              }}
                              alt=""
                            />
                            {modalMode !== "view" && (
                              <input
                                type="file"
                                accept="image/*"
                                style={{ fontSize: "12px" }}
                                onChange={(e) => handleFileChange(e, col.name)}
                              />
                            )}
                          </div>
                        ) : col.type === "barcode" ? (
                          <div style={{ display: "flex", gap: "8px" }}>
                            <div style={{ flex: 1 }}>
                              <InputField
                                value={formData[col.name] || ""}
                                onChange={(e) =>
                                  handleInputChange(e.target.value, col.name)
                                }
                                disabled={modalMode === "view"}
                                placeholder="Code value"
                              />
                            </div>
                            {modalMode !== "view" && (
                              <Button
                                type="button"
                                style={{ height: "42px", padding: "0 15px" }}
                                onClick={() => generateBarcode(col.name)}
                              >
                                Auto-Gen
                              </Button>
                            )}
                          </div>
                        ) : col.type === "description" ? (
                          <TextArea
                            value={formData[col.name] || ""}
                            onChange={(e) =>
                              handleInputChange(e.target.value, col.name)
                            }
                            disabled={modalMode === "view"}
                            placeholder="Enter detailed description..."
                            rows={3}
                          />
                        ) : (
                          <InputField
                            type={
                              col.type === "number" || col.type === "integer"
                                ? "number"
                                : col.type === "date"
                                  ? "date"
                                  : "text"
                            }
                            value={formData[col.name] || ""}
                            onChange={(e) =>
                              handleInputChange(e.target.value, col.name)
                            }
                            disabled={modalMode === "view"}
                            placeholder={`Enter ${col.name.toLowerCase()}`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                ));
              })()}
            </div>
          </ModalBody>

          <ModalFooter>
            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
                width: "100%",
              }}
            >
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              {modalMode !== "view" && (
                <Button
                  type="submit"
                  variant="primary"
                  style={{ padding: "0 30px" }}
                >
                  {modalMode === "add" ? "Create Entry" : "Save Changes"}
                </Button>
              )}
            </div>
          </ModalFooter>
        </form>
      </Modal>
    </ContainerWrapper>
  );
};

export default DynamicCustomPage;
