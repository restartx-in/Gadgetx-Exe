import React from "react";
import "./style.scss";
import { FaEye, FaPlus, FaEdit } from "react-icons/fa";

const fmt = (val) => {
  if (val === null || val === undefined || val === "") return "—";
  const num = parseFloat(val);
  if (isNaN(num)) return val;
  return num >= 0 ? `+${num.toFixed(2)}` : num.toFixed(2);
};

const fmtAxis = (val) => {
  if (val === null || val === undefined || val === "") return "—";
  const num = parseFloat(val);
  if (isNaN(num)) return String(val);
  return String(Math.round(num));
};

const PrescriptionSaleSection = ({ data, onEdit, onAddNew }) => {
  if (!data) {
    return (
      <div className="pss-wrapper pss-empty">
        <div className="pss-empty__icon">
          <FaEye />
        </div>
        <p className="pss-empty__text">No prescription found.</p>
        <button className="pss-btn pss-btn--primary" onClick={onAddNew}>
          <FaPlus /> Add Prescription
        </button>
      </div>
    );
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return `${String(date.getDate()).padStart(2, "0")}/${String(
      date.getMonth() + 1
    ).padStart(2, "0")}/${date.getFullYear()}`;
  };

  return (
    <div className="pss-wrapper">
      {/* ── Header ── */}
      <div className="pss-header">
        <div className="pss-header__title">
          <FaEye className="pss-header__icon" />
          <span>Prescription Details</span>
        </div>
        <div className="pss-header__actions">
          <button
            className="pss-btn pss-btn--ghost"
            onClick={onAddNew}
            title="Add new prescription"
          >
            <FaPlus />
          </button>
          <button
            className="pss-btn pss-btn--outline"
            onClick={onEdit}
            title="Edit prescription"
          >
            <FaEdit /> Edit
          </button>
        </div>
      </div>

      {/* ── Meta ── */}
      {(data.prescription_date || data.doctor_name || data.name) && (
        <div className="pss-meta">
          {/* {data.name && (
            <span className="pss-meta__name">{data.name}</span>
          )} */}
          {data.prescription_date && (
            <span className="pss-meta__item">
              {formatDate(data.prescription_date)}
            </span>
          )}
          {data.doctor_name && (
            <span className="pss-meta__item">{data.doctor_name}</span>
          )}
        </div>
      )}

      {/* ── Eye Table ── */}
      <div className="pss-table-wrapper">
        <table className="pss-table">
          <thead>
            <tr>
              <th className="pss-table__eye-col">Eye</th>
              <th>SPH</th>
              <th>CYL</th>
              <th>AXIS</th>
              <th>ADD</th>
            </tr>
          </thead>
          <tbody>
            <tr className="pss-table__row pss-table__row--right">
              <td className="pss-table__eye-label">
                <span className="pss-eye-dot pss-eye-dot--right" />R (OD)
              </td>
              <td>{fmt(data.right_sph)}</td>
              <td>{fmt(data.right_cyl)}</td>
              <td>{fmtAxis(data.right_axis)}</td>
              <td>{fmt(data.right_add)}</td>
            </tr>
            <tr className="pss-table__row pss-table__row--left">
              <td className="pss-table__eye-label">
                <span className="pss-eye-dot pss-eye-dot--left" />L (OS)
              </td>
              <td>{fmt(data.left_sph)}</td>
              <td>{fmt(data.left_cyl)}</td>
              <td>{fmtAxis(data.left_axis)}</td>
              <td>{fmt(data.left_add)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── IPD row ── */}
      {(data.right_ipd || data.left_ipd) && (
        <div className="pss-ipd-row">
          <div className="pss-ipd-field">
            <span className="pss-ipd-field__label">IPD (R)</span>
            <span className="pss-ipd-field__value">{fmt(data.right_ipd)}</span>
          </div>
          <div className="pss-ipd-field">
            <span className="pss-ipd-field__label">IPD (L)</span>
            <span className="pss-ipd-field__value">{fmt(data.left_ipd)}</span>
          </div>
        </div>
      )}

      {/* ── Note ── */}
      {data.note && (
        <div className="pss-note">
          <span className="pss-note__label">Note: </span>
          {data.note}
        </div>
      )}
    </div>
  );
};

export default PrescriptionSaleSection;