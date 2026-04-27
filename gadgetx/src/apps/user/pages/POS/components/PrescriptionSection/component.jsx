import React from "react";
import "./style.scss";
import VStack from "@/components/VStack";
import HStack from "@/components/HStack";
import DateField from "@/components/DateField/component";
import SelectField from "@/components/SelectField";

const orderStatusOptions = [
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const PrescriptionSection = ({
  data,
  onEdit,
  onAddNew,
  orderStatus,
  setOrderStatus,
  expectedDelivery,
  setExpectedDelivery,
}) => {
  if (!data) return <div className="prescription-section">No prescription details available.</div>;

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const d = String(date.getDate()).padStart(2, "0");
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const y = String(date.getFullYear());
    return `${d}/${m}/${y}`;
  };

  return (
    <div className="prescription-section">
      <div className="header">
        <h3>Prescription Details</h3>
        <div className="header-actions">
          <button className="add-new-btn" onClick={onAddNew} title="Add New Prescription">+</button>
          <button className="edit-btn" onClick={onEdit}>Edit</button>
        </div>
      </div>

      <div className="info-grid">
        <VStack>
          <HStack>
            <p><strong>Prescription Date:</strong> {formatDate(data.prescription_date)}</p>
            <p><strong>Customer:</strong> {data.customer_name}</p>
          </HStack>

          <p><strong>Examined By:</strong> {data.doctor_name || "N/A"}</p>
          <p><strong>Note:</strong> {data.note || "N/A"}</p>
        </VStack>
      </div>

      <div className="eye-table-wrapper">
        <table className="eye-table">
          <thead>
            <tr>
              <th>Eye</th><th>SPH</th><th>CYL</th><th>AXIS</th><th>ADD</th><th>IPD</th>
            </tr>
          </thead>
          <tbody>
            {["Right", "Left"].map((side) => (
              <tr key={side}>
                <td>{side} (O{side === "Right" ? "D" : "S"})</td>
                <td>{data[`${side.toLowerCase()}_sph`] ?? 0}</td>
                <td>{data[`${side.toLowerCase()}_cyl`] ?? 0}</td>
                <td>{data[`${side.toLowerCase()}_axis`] ?? 0}</td>
                <td>{data[`${side.toLowerCase()}_add`] ?? 0}</td>
                <td>{data[`${side.toLowerCase()}_ipd`] ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="fulfillment-section">
        <div className="fulfillment-header">
          <h4>Order Fulfillment (Lens)</h4>
        </div>
        <div className="fulfillment-grid">
          <DateField
            label="Expected Delivery"
            value={expectedDelivery}
            onChange={(date) => setExpectedDelivery(date)}
          />
          <SelectField
            label="Order Status"
            value={orderStatus}
            options={orderStatusOptions}
            onChange={(e) => setOrderStatus(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default PrescriptionSection;