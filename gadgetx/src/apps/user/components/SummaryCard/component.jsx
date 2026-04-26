import React from "react";
import PropTypes from "prop-types";
import "./style.scss";

const SummaryCard = ({
  icon: Icon,
  label,
  value,
  color, // New prop to accept hex code directly
  subStats,
  onClick,
  customValueStyle,
  className,
  style,
}) => {
  return (
    <div
      className={`summary-card ${onClick ? "summary-card--clickable" : ""} ${className || ""}`}
      onClick={onClick}
      style={{ 
        backgroundColor: color, // Apply the specific color here
        ...style 
      }}
    >
      <div className="summary-card__header">
        <div className="summary-card__icon-wrapper">
          {Icon && <Icon className="summary-card__icon" />}
        </div>
        <span className="summary-card__label">{label}</span>
        <span
          className="summary-card__value"
          style={customValueStyle}
        >
          {value}
        </span>
      </div>

      {subStats && subStats.length > 0 && (
        <div className="summary-card__sub-stats">
          {subStats.map((stat, index) => (
            <div
              key={index}
              className={`
                summary-card__stat-item 
                ${stat.onClick ? "summary-card__stat-item--clickable" : ""}
                ${stat.align === "end" ? "summary-card__stat-item--align-end" : ""}
                ${stat.align === "center" ? "summary-card__stat-item--align-center" : ""}
              `}
              onClick={(e) => {
                if (stat.onClick) {
                  e.stopPropagation();
                  stat.onClick();
                }
              }}
            >
              <span className="summary-card__stat-item-label">
                {stat.label}
              </span>
              <span className="summary-card__stat-item-value">
                {stat.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

SummaryCard.propTypes = {
  icon: PropTypes.elementType,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.node,
  ]).isRequired,
  color: PropTypes.string, // New prop type
  onClick: PropTypes.func,
  customValueStyle: PropTypes.object,
  className: PropTypes.string,
  style: PropTypes.object,
  subStats: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      onClick: PropTypes.func,
      align: PropTypes.oneOf(["start", "center", "end"]),
    })
  ),
};

SummaryCard.defaultProps = {
  subStats: [],
  icon: null,
  color: "#868e96", // Default fallback color
  onClick: null,
  customValueStyle: {},
  className: "",
  style: {},
};

export default SummaryCard;