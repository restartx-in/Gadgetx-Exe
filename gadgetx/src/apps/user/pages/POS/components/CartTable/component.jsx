import React from 'react'
import { FaTrash, FaPlus, FaMinus } from 'react-icons/fa'
import InputField from '@/components/InputField'
import AmountSymbol from '@/components/AmountSymbol'

const QuantitySelector = ({ value, onChange, max }) => (
  <div className="quantity-selector">
    <button type="button" onClick={() => onChange(Math.max(1, value - 1))}>
      <FaMinus />
    </button>
    <span>{value}</span>
    <button
      type="button"
      onClick={() => onChange(Math.min(max, value + 1))}
      disabled={value >= max}>
      <FaPlus />
    </button>
  </div>
)

const CartTable = ({ cart, onQuantityChange, onRemoveItem, onPriceChange }) => (
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
            const priceWithTax = parseFloat(
              (item.price * (1 + item.tax / 100)).toFixed(2)
            )

            const handlePriceUpdate = (newValue) => {
              const newPriceWithTax = parseFloat(newValue) || 0

              const basePrice =
                item.tax > 0
                  ? parseFloat(
                      (newPriceWithTax / (1 + item.tax / 100)).toFixed(2)
                    )
                  : newPriceWithTax

              onPriceChange(item.id, basePrice)
            }

            return (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>
                  <div className="price-field-wrapper">
                    <InputField
                      type="number"
                      className="price-input"
                      value={priceWithTax.toFixed(2)}
                      onChange={(e) => handlePriceUpdate(e.target.value)}
                      min="0"
                    />
                  </div>
                </td>
                <td>
                  <QuantitySelector
                    value={item.quantity}
                    onChange={(newQty) => onQuantityChange(item.id, newQty)}
                    max={item.stock}
                  />
                </td>
                <td>
                  <AmountSymbol>{priceWithTax * item.quantity}</AmountSymbol>
                </td>
                <td>
                  <button
                    className="delete-btn"
                    onClick={() => onRemoveItem(item.id)}>
                    <FaTrash />
                  </button>
                </td>
              </tr>
            )
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
)

export default CartTable
