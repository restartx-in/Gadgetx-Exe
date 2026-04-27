import React, { useEffect, useRef, useState } from "react";
import { FaTrash, FaPlus, FaMinus } from "react-icons/fa";
import InputField from "@/components/InputField";
import AmountSymbol from "@/apps/user/components/AmountSymbol";

const QuantitySelector = ({ value, onChange }) => (
  <div className="quantity-selector">
    <button type="button" onClick={() => onChange(Math.max(1, value - 1))}>
      <FaMinus />
    </button>
    <span>{value}</span>
    <button type="button" onClick={() => onChange(value + 1)}>
      <FaPlus />
    </button>
  </div>
);

const CartTable = ({
  cart,
  onQuantityChange,
  onRemoveItem,
  onPriceChange,
  priceEditTarget,
}) => {
  const priceInputRefs = useRef({});
  const [editingPriceMap, setEditingPriceMap] = useState({});

  useEffect(() => {
    if (!priceEditTarget?.itemId) return;

    const inputEl = priceInputRefs.current[priceEditTarget.itemId];
    if (!inputEl) return;

    requestAnimationFrame(() => {
      inputEl.focus();
      if (typeof inputEl.select === "function") {
        inputEl.select();
      }
    });
  }, [priceEditTarget]);

  useEffect(() => {
    setEditingPriceMap((prev) => {
      const cartIds = new Set(cart.map((i) => String(i.id)));
      const next = {};
      Object.keys(prev).forEach((key) => {
        if (cartIds.has(key)) next[key] = prev[key];
      });
      return next;
    });
  }, [cart]);

  const commitPriceUpdate = (item, rawValue) => {
    const itemKey = String(item.id);
    const parsed = rawValue === "" ? 0 : parseFloat(rawValue);

    if (!Number.isNaN(parsed) && parsed >= 0) {
      const basePrice =
        item.tax > 0
          ? parseFloat((parsed / (1 + item.tax / 100)).toFixed(2))
          : parsed;
      onPriceChange(item.id, basePrice);
    }

    setEditingPriceMap((prev) => {
      const next = { ...prev };
      delete next[itemKey];
      return next;
    });
  };

  return (
  <div className="cart-table-container">
    <table>
      <thead>
        <tr>
          <th>PRODUCT</th>
          <th>PRICE (inc. Tax)</th>
          <th>QTY</th>
          <th>SUB TOTAL</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {cart.length > 0 ? (
          cart.map((item) => {
            const itemKey = String(item.id);
            const priceWithTax = parseFloat(
              (item.price * (1 + item.tax / 100)).toFixed(2)
            );

            const displayValue =
              editingPriceMap[itemKey] ?? priceWithTax.toFixed(2);

            return (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>
                  <div className="price-field-wrapper">
                    <InputField
                      ref={(el) => {
                        if (el) {
                          priceInputRefs.current[item.id] = el;
                        } else {
                          delete priceInputRefs.current[item.id];
                        }
                      }}
                      type="number"
                      className="price-input"
                      value={displayValue}
                      onChange={(e) =>
                        setEditingPriceMap((prev) => ({
                          ...prev,
                          [itemKey]: e.target.value,
                        }))
                      }
                      onKeyDownCapture={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          e.stopPropagation();
                          e.nativeEvent?.stopImmediatePropagation?.();
                        }
                      }}
                      onBlur={(e) => commitPriceUpdate(item, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          e.stopPropagation();
                          e.nativeEvent?.stopImmediatePropagation?.();
                          commitPriceUpdate(item, e.currentTarget.value);
                          e.currentTarget.focus();
                          if (typeof e.currentTarget.select === "function") {
                            e.currentTarget.select();
                          }
                        }
                      }}
                      onKeyUpCapture={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          e.stopPropagation();
                          e.nativeEvent?.stopImmediatePropagation?.();
                        }
                      }}
                      onKeyUp={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          e.stopPropagation();
                          e.nativeEvent?.stopImmediatePropagation?.();
                        }
                      }}
                      onFocus={(e) => e.target.select()}
                      min="0"
                    />
                  </div>
                </td>
                <td>
                  <QuantitySelector
                    value={item.quantity}
                    onChange={(newQty) => onQuantityChange(item.id, newQty)}
                  />
                </td>
                <td>
                  <AmountSymbol>{priceWithTax * item.quantity}</AmountSymbol>
                </td>
                <td>
                  <button
                    className="delete-btn"
                    onClick={() => onRemoveItem(item.id)}
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            );
          })
        ) : (
          <tr>
            <td colSpan="5" className="no-data">
              No Data Available
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
  );
};

export default CartTable;
