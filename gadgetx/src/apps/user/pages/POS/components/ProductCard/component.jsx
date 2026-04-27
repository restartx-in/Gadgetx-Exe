import React from "react";
import AmountSymbol from "@/apps/user/components/AmountSymbol";
import { buildUploadUrl, API_FILES } from "@/config/api";
import TextOverflow from "@/apps/user/pages/POS/components/TextOverflow";
import defaultImage from "@/assets/user/demo-logo.svg";
import "./style.scss"; // Importing styles

const ProductCard = ({ item, onAddItem, onView, isHeld }) => {
  const imageUrl = item.image ? buildUploadUrl(API_FILES, item.image) : null;
  const basePrice = parseFloat(item.selling_price) || 0;
  const taxPercentage = parseFloat(item.tax) || 0;
  const sellingPriceWithTax = basePrice * (1 + taxPercentage / 100);

  return (
    <div
      className={`product-card ${isHeld ? "product-card--held" : ""}`}
      onClick={() => !isHeld && onAddItem(item)}
    >
      {/* Image Area */}
      <div
        className="product-card__image-wrapper"
        onClick={(e) => {
          if (!isHeld && onView) {
            e.stopPropagation();
            onView(item);
          }
        }}
      >
        <img
          src={imageUrl || defaultImage}
          alt={item.name}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = defaultImage;
          }}
        />
      </div>

      {/* Content Area */}
      <div className="product-card__content">
        <div className="product-card__title">
          <TextOverflow>{`${item.category_name || "Item"}-${item.name}`}</TextOverflow>
        </div>

        <div className="product-card__footer">
          <span className="product-card__stock">
            {isHeld ? "On Hold" : `${item.stock_quantity} piece`}
          </span>
          <span className="product-card__price">
            <AmountSymbol>{sellingPriceWithTax.toFixed(2)}</AmountSymbol>
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
