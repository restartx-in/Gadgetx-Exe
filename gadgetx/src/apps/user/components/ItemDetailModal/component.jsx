import { Modal, ModalHeader, ModalBody } from "@/components/Modal";
import AmountSymbol from "@/apps/user/components/AmountSymbol";
import QuantitySelector from "@/apps/user/components/QuantitySelector";
import "./style.scss";

const ItemDetailModal = ({ isOpen, onClose, item, onQuantityChange }) => {
  if (!item) return null;

  // Calculate base total (price * qty) before tax for clarity
  const baseTotal = item.price * item.quantity;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalHeader>
        <span className="fw600 fs28">Item Details</span>
      </ModalHeader>
      <ModalBody className="p-0">
        <div className="item-detail-modal">
          {/* Section 1: Hero (Product Name & Stock) */}
          <div className="item-detail-modal__hero">
            <h3 className="product-name fs24">{item.name}</h3>
            <span
              className={`stock-badge ${
                item.stock > 0 ? "in-stock" : "out-stock"
              }`}
            >
              Available Stock: {item.stock}
            </span>
          </div>

          {/* Section 2: Data Grid */}
          <div className="item-detail-modal__grid">
            <div className="grid-item">
              <span className="label">Unit Price</span>
              <span className="value">
                <AmountSymbol>{item.price}</AmountSymbol>
              </span>
            </div>

            {/* Quantity Selector Section */}
            <div className="grid-item">
              <span className="label">Quantity</span>
              <div className="qty-wrapper">
                <QuantitySelector
                  key={item.id}
                  initialValue={item.quantity}
                  onChange={(newQty) => onQuantityChange(item.id, newQty)}
                  min={1}
                  max={item.stock}
                />
              </div>
            </div>

            <div className="grid-item">
              <span className="label">Tax Rate</span>
              <span className="value">{item.taxPercentage}%</span>
            </div>
            <div className="grid-item">
              <span className="label">Base Amount</span>
              <span className="value">
                <AmountSymbol>{baseTotal}</AmountSymbol>
              </span>
            </div>
          </div>

          {/* Section 3: Financial Summary */}
          <div className="item-detail-modal__summary">
            <div className="summary-row">
              <span className="summary-label">Tax Amount</span>
              <span className="summary-value text-tax">
                + <AmountSymbol>{item.taxAmount}</AmountSymbol>
              </span>
            </div>
            <div className="divider"></div>
            <div className="summary-row total-row">
              <span className="summary-label">Line Subtotal</span>
              <span className="summary-value">
                <AmountSymbol>{item.subtotal}</AmountSymbol>
              </span>
            </div>
          </div>
        </div>
      </ModalBody>
    </Modal>
  );
};

export default ItemDetailModal;
