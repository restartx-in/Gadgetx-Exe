import React from "react";
import { Modal, ModalHeader, ModalBody } from "@/components/Modal";
import AmountSymbol from "@/apps/user/components/AmountSymbol";
import { buildUploadUrl, API_FILES } from "@/config/api";
import "./style.scss";

const ProductDetailModal = ({ isOpen, onClose, item, onAddToCart }) => {
  if (!item) return null;

  const purchasePrice = parseFloat(item.purchase_price) || 0;
  const sellingPrice = parseFloat(item.selling_price) || 0;
  const tax = parseFloat(item.tax) || 0;
  const sellingPriceWithTax = sellingPrice * (1 + tax / 100);
  const profit = sellingPrice - purchasePrice;
  const profitMargin =
    purchasePrice > 0 ? ((profit / purchasePrice) * 100).toFixed(1) : "—";

  const imageUrl = item.image
    ? buildUploadUrl(API_FILES, item.image)
    : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalHeader>Product Details</ModalHeader>
      <ModalBody maxHeight="500px">
      <div className="product-detail-modal">
        {imageUrl && (
          <div className="product-detail-modal__image">
            <img src={imageUrl} alt={item.name} />
          </div>
        )}

        <h3 className="product-detail-modal__name">{item.name}</h3>

        {item.description && (
          <p className="product-detail-modal__desc">{item.description}</p>
        )}

        <div className="product-detail-modal__grid">
          {item.bar_code && (
            <div className="product-detail-modal__field">
              <span className="label">Barcode</span>
              <span className="value">{item.bar_code}</span>
            </div>
          )}
          {item.sku && (
            <div className="product-detail-modal__field">
              <span className="label">SKU</span>
              <span className="value">{item.sku}</span>
            </div>
          )}
          <div className="product-detail-modal__field">
            <span className="label">Purchase Price</span>
            <span className="value">
              <AmountSymbol>{purchasePrice.toFixed(2)}</AmountSymbol>
            </span>
          </div>
          <div className="product-detail-modal__field">
            <span className="label">Selling Price</span>
            <span className="value">
              <AmountSymbol>{sellingPrice.toFixed(2)}</AmountSymbol>
            </span>
          </div>
          <div className="product-detail-modal__field">
            <span className="label">Tax</span>
            <span className="value">{tax}%</span>
          </div>
          <div className="product-detail-modal__field highlight">
            <span className="label">Selling Price (inc. Tax)</span>
            <span className="value">
              <AmountSymbol>{sellingPriceWithTax.toFixed(2)}</AmountSymbol>
            </span>
          </div>
          <div className="product-detail-modal__field">
            <span className="label">Profit</span>
            <span className="value profit">
              <AmountSymbol>{profit.toFixed(2)}</AmountSymbol>
              {profitMargin !== "—" && (
                <span className="margin"> ({profitMargin}%)</span>
              )}
            </span>
          </div>
          <div className="product-detail-modal__field">
            <span className="label">Stock</span>
            <span
              className={`value ${item.stock_quantity <= (item.min_stock_level || 0) ? "low-stock" : "in-stock"}`}
            >
              {item.stock_quantity} {item.unit_symbol || "pcs"}
            </span>
          </div>
          {item.category_name && (
            <div className="product-detail-modal__field">
              <span className="label">Category</span>
              <span className="value">{item.category_name}</span>
            </div>
          )}
          {item.brand_name && (
            <div className="product-detail-modal__field">
              <span className="label">Brand</span>
              <span className="value">{item.brand_name}</span>
            </div>
          )}
          {item.unit_name && (
            <div className="product-detail-modal__field">
              <span className="label">Unit</span>
              <span className="value">{item.unit_name}</span>
            </div>
          )}
        </div>

        <div className="product-detail-modal__actions">
          <button
            className="btn-add-to-cart"
            onClick={() => {
              onAddToCart(item);
              onClose();
            }}
          >
            Add to Cart
          </button>
          <button className="btn-close" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
      </ModalBody>
    </Modal>
  );
};

export default ProductDetailModal;
