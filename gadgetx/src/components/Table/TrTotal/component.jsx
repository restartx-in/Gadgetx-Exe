import React from "react";
import { Tr, TdNumeric, Td } from "@/components/Table";
import "./style.scss";

const TrTotal = ({ columns, totals }) => {
  if (!columns || columns.length === 0) return null;

  const totalStyle = { fontWeight: "700", color: "#000" };

  return (
    <Tr className="table-total-row">
      <Td />
      {columns.map((field) => {
        // If field exists in totals object, render value
        if (totals.hasOwnProperty(field.value)) {
          return (
            <TdNumeric key={field.value}>
              <span style={totalStyle}>{totals[field.value]}</span>
            </TdNumeric>
          );
        }
        // If it's the date column, show "Total" label
        if (
          field.value === "date" ||
          field.value === "order_date" ||
          field.value === "return_date"
        ) {
          return (
            <Td key={field.value}>
              <span style={{ ...totalStyle, textTransform: "uppercase" }}>
                Total
              </span>
            </Td>
          );
        }
        return <Td key={field.value} />;
      })}
      <Td />
    </Tr>
  );
};

export default TrTotal;
