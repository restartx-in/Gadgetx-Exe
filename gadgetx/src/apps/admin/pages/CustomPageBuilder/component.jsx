import React, { useState, useEffect } from "react";
import api from "@/utils/axios/api";
import { Table, Thead, Tbody, Tr, Td, Th } from "@/components/Table";
import InputField from "@/components/InputField";
import SelectField from "@/components/SelectField";
import Button from "@/components/Button";
import { LuArrowDownUp } from "react-icons/lu";

import "./style.scss";

const EXISTING_SYSTEM_TABLES = [
  {
    label: "Customer",
    type: "customer",
    endpoint: "/party",
    query: "?type=customer",
    labelField: "name",
  },
  {
    label: "Supplier",
    type: "supplier",
    endpoint: "/party",
    query: "?type=supplier",
    labelField: "name",
  },
  {
    label: "Cost Center",
    type: "cost_center",
    endpoint: "/cost-centers",
    query: "",
    labelField: "name",
  },
  {
    label: "Employee",
    type: "employee",
    endpoint: "/employees",
    query: "",
    labelField: "name",
  },
  {
    label: "Brand",
    type: "brand",
    endpoint: "/brand",
    query: "",
    labelField: "name",
  },
  {
    label: "Category",
    type: "category",
    endpoint: "/category",
    query: "",
    labelField: "name",
  },
  {
    label: "Service",
    type: "service",
    endpoint: "/services",
    query: "",
    labelField: "name",
  },
  {
    label: "Mode of Payment",
    type: "mode_of_payment",
    endpoint: "/mode-of-payment",
    query: "",
    labelField: "name",
  },
  {
    label: "Expense Type",
    type: "expense_type",
    endpoint: "/expense-type",
    query: "",
    labelField: "name",
  },
  {
    label: "Done By",
    type: "done_by",
    endpoint: "/done-by",
    query: "",
    labelField: "name",
  },
  {
    label: "Account",
    type: "account",
    endpoint: "/accounts",
    query: "",
    labelField: "name",
  },
  {
    label: "Ledger",
    type: "ledger",
    endpoint: "/ledgers",
    query: "",
    labelField: "name",
  },
];

const BLANK_COLUMN = {
  name: "",
  type: "text",
  isForeignKey: false,
  referenceType: "custom", // "custom" | "existing"
  referencePageId: "", // used when referenceType === "custom"
  referenceTable: "", // used when referenceType === "existing"
};

const CustomPageBuilder = () => {
  const [pages, setPages] = useState([]);
  const [users, setUsers] = useState([]);
  const [title, setTitle] = useState("");
  const [path, setPath] = useState("");
  const [columns, setColumns] = useState([{ ...BLANK_COLUMN }]);
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const fetchPages = async () => {
    try {
      const { data } = await api.get("/custom-pages");
      setPages(data.data || []);
    } catch (error) {
      console.error("Failed to fetch custom pages", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await api.get("/users/all");
      setUsers(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error("Failed to fetch users", error);
    }
  };

  useEffect(() => {
    fetchPages();
    fetchUsers();
  }, []);

  const handleAddColumn = () => {
    setColumns([...columns, { ...BLANK_COLUMN }]);
  };

  const handleRemoveColumn = (index) => {
    setColumns(columns.filter((_, i) => i !== index));
  };

  const handleColumnChange = (index, field, value) => {
    const newCols = [...columns];
    newCols[index][field] = value;

    if (field === "isForeignKey" && value === false) {
      newCols[index].referenceType = "custom";
      newCols[index].referencePageId = "";
      newCols[index].referenceTable = "";
    }

    if (field === "referenceType") {
      newCols[index].referencePageId = "";
      newCols[index].referenceTable = "";
    }

    setColumns(newCols);
  };

  const handleEdit = (page) => {
    setEditingId(page.id);
    setTitle(page.title);
    setPath(page.path);
    const loadedColumns = (page.table_config || []).map((col) => ({
      ...BLANK_COLUMN,
      ...col,
      isForeignKey: col.isForeignKey || false,
      referenceType: col.referenceType || "custom",
      referencePageId: col.referencePageId || "",
      referenceTable: col.referenceTable || "",
    }));
    setColumns(
      loadedColumns.length > 0 ? loadedColumns : [{ ...BLANK_COLUMN }],
    );
    setAssignedUsers(page.assigned_users || []);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await api.delete(`/custom-pages/${id}`);
      alert("Page deleted successfully");
      fetchPages();
    } catch (error) {
      console.error("Failed to delete page", error);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setPath("");
    setColumns([{ ...BLANK_COLUMN }]);
    setAssignedUsers([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !path) {
      alert("Title and Path are required");
      return;
    }

    // Validate FK columns have a reference selected
    const invalidFK = columns.find((col) => {
      if (!col.isForeignKey) return false;
      if (col.referenceType === "existing") return !col.referenceTable;
      return !col.referencePageId; // custom
    });
    if (invalidFK) {
      alert(
        `Please select a reference for the column: ${invalidFK.name || "Unnamed"}`,
      );
      return;
    }

    const payload = {
      title,
      path: path.startsWith("/") ? path : `/${path}`,
      table_config: columns,
      assigned_users: assignedUsers.map((id) => Number(id)),
      is_active: true,
    };

    try {
      if (editingId) {
        await api.put(`/custom-pages/${editingId}`, payload);
        alert("Custom page updated successfully!");
      } else {
        await api.post("/custom-pages", payload);
        alert("Custom page created successfully!");
      }
      resetForm();
      fetchPages();
    } catch (error) {
      console.error("Failed to save page", error);
      alert("Error saving custom page.");
    }
  };

  return (
    <div className="custom-page-builder">
      <div className="custom-page-builder__header">
        <div>
          <h2>
            {editingId ? "Edit Custom Page Report" : "Custome Page Report"}
          </h2>
          {/* <p style={{ color: "var(--text-muted)", margin: 0 }}>
            Configure dynamic tables, data types, and user permissions.
          </p> */}
        </div>
        {editingId && <Button onClick={resetForm}>Create New Table</Button>}
      </div>

      <div className="custom-page-builder__card">
        <form className="custom-page-builder__form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Page Title</label>
              <InputField
                type="text"
                placeholder="e.g. Asset Management"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>URL Path</label>
              <InputField
                type="text"
                placeholder="e.g. /assets"
                value={path}
                onChange={(e) =>
                  setPath(e.target.value.toLowerCase().replace(/\s+/g, "-"))
                }
                required
              />
            </div>
          </div>

          <div className="user-assignment">
            <label className="section-label">Assign Permissions</label>
            <div className="users-grid">
              {users.map((u) => (
                <label key={u.id} className="user-checkbox">
                  <input
                    type="checkbox"
                    checked={assignedUsers.includes(u.id)}
                    onChange={(e) => {
                      if (e.target.checked)
                        setAssignedUsers([...assignedUsers, u.id]);
                      else
                        setAssignedUsers(
                          assignedUsers.filter((id) => id !== u.id),
                        );
                    }}
                  />
                  {u.name || u.username}
                </label>
              ))}
            </div>
          </div>

          <div className="custom-page-builder__columns">
            <h3>Table Structure</h3>
            {columns.map((col, index) => (
              <div
                key={index}
                className={`column-row ${col.isForeignKey ? "is-fk" : ""}`}
              >
                <div className="form-group">
                  <label>Column Name</label>
                  <InputField
                    type="text"
                    value={col.name}
                    onChange={(e) =>
                      handleColumnChange(index, "name", e.target.value)
                    }
                    placeholder="Field Name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Data Type</label>
                  {!col.isForeignKey ? (
                    <SelectField
                      value={col.type}
                      onChange={(e) =>
                        handleColumnChange(index, "type", e.target.value)
                      }
                      options={[
                        { label: "Text", value: "text" },
                        { label: "Number", value: "number" },
                        { label: "Date", value: "date" },
                        { label: "Boolean", value: "boolean" },
                        { label: "Description", value: "description" },
                      ]}
                    />
                  ) : (
                    <div
                      style={{
                        padding: "10px",
                        background: "#e2e8f0",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "bold",
                        textAlign: "center",
                      }}
                    >
                      FOREIGN KEY
                    </div>
                  )}
                </div>

                <div className="fk-toggle-group">
                  <label>FK</label>
                  <input
                    type="checkbox"
                    checked={col.isForeignKey}
                    onChange={(e) =>
                      handleColumnChange(
                        index,
                        "isForeignKey",
                        e.target.checked,
                      )
                    }
                  />
                </div>

                <div className="form-group">
                  {col.isForeignKey && (
                    <>
                      <label>
                        {col.referenceType === "existing"
                          ? "System Table"
                          : "Custom Page"}
                      </label>
                      <div style={{ display: "flex", gap: "4px" }}>
                        <SelectField
                          value={
                            col.referenceType === "existing"
                              ? col.referenceTable
                              : col.referencePageId
                          }
                          onChange={(e) =>
                            handleColumnChange(
                              index,
                              col.referenceType === "existing"
                                ? "referenceTable"
                                : "referencePageId",
                              e.target.value,
                            )
                          }
                          options={
                            col.referenceType === "existing"
                              ? [
                                  { label: "Select Table", value: "" },
                                  ...EXISTING_SYSTEM_TABLES.map((t) => ({
                                    label: t.label,
                                    value: t.type,
                                  })),
                                ]
                              : [
                                  { label: "Select Page", value: "" },
                                  ...pages
                                    .filter((p) => p.id !== editingId)
                                    .map((p) => ({
                                      label: p.title,
                                      value: p.id,
                                    })),
                                ]
                          }
                        />
                        <button
                          type="button"
                          onClick={() =>
                            handleColumnChange(
                              index,
                              "referenceType",
                              col.referenceType === "existing"
                                ? "custom"
                                : "existing",
                            )
                          }
                          style={{
                            padding: "0 8px",
                            border: "1px solid #ddd",
                            borderRadius: "12px",
                            cursor: "pointer",
                            background: "#ffffff",
                          }}
                          title="Switch Source"
                        >
                          <label style={{fontSize:"10px"}}>
                            {col.referenceType === "existing"
                              ? "Custom"
                              : "System"}
                          </label>{" "}
                          <LuArrowDownUp />
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {columns.length > 1 && (
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => handleRemoveColumn(index)}
                  >
                    Delete
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="custom-page-builder__actions">
            <button
              type="button"
              className="add-col-btn"
              onClick={handleAddColumn}
            >
              + Add New Column
            </button>
            <div className="form-submit-group">
              {editingId && (
                <Button type="button" variant="secondary" onClick={resetForm}>
                  Cancel
                </Button>
              )}
              <button type="submit" className="submit-btns">
                {editingId ? "Update Page " : "Create Page"}
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="custom-page-builder__list">
        <h3>Existing Custom Pages</h3>
        <div className="table-container">
          <Table>
            <Thead>
              <Tr>
                <Th>Page Title</Th>
                <Th>Route Path</Th>
                <Th>Fields</Th>
                <Th>Permissions</Th>
                <Th style={{ textAlign: "right" }}>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {pages.map((page) => (
                <Tr key={page.id}>
                  <Td>
                    <strong>{page.title}</strong>
                  </Td>
                  <Td>
                    <code>{page.path}</code>
                  </Td>
                  <Td>{page.table_config?.length || 0} columns</Td>
                  <Td>
                    <small>
                      {page.assigned_users?.length > 0
                        ? `${page.assigned_users.length} Users`
                        : "Admin Only"}
                    </small>
                  </Td>
                  <Td>
                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        justifyContent: "flex-end",
                        marginBottom:"5px"
                      }}
                    >
                      <Button
                        variant="primary"
                        onClick={() => handleEdit(page)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => handleDelete(page.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default CustomPageBuilder;
