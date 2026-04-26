import React from 'react';
import AmountSymbol from '@/components/AmountSymbol';

const ProductCard = ({ item, onAddItem, isHeld }) => {
  const imageUrl = item.image
    ? `${import.meta.env.VITE_API_BASE_URL}/${item.image}`
    : null;

  const basePrice = parseFloat(item.selling_price) || 0;
  const taxPercentage = parseFloat(item.tax) || 0;

  const sellingPriceWithTax = basePrice * (1 + taxPercentage / 100);

  return (
    <div
      className={`product-card ${isHeld ? 'is-held' : ''}`}
      onClick={() => !isHeld && onAddItem(item)}
    >
      <div className="product-image">
        {imageUrl ? (
          <img src={imageUrl} alt={item.name} />
        ) : (
          <span className="no-product-image">NO IMAGE</span>
        )}
      </div>
      <div className="product-details">
        <span className="price">
          <AmountSymbol>{sellingPriceWithTax.toFixed(2)}</AmountSymbol>
        </span>
        {isHeld ? (
          <span className="stock on-hold-badge">On Hold</span>
        ) : (
          <span className="stock">{item.stock_quantity} piece</span>
        )}
      </div>
      <p className="product-name">{item.name}</p>
      <p className="product-sku">{item.sku}</p>
    </div>
  );
};

export default ProductCard;