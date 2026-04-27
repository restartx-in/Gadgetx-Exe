import React from "react";
import { BADGE_TYPES } from "@/constants/object/badgeTypes";
import "./style.scss";

const getVariantClassName = (variant, type) => {
  if (!variant || !type) return "";

  const lowerCaseType = type.toLowerCase();
  const variantMap = BADGE_TYPES[variant];

  if (variantMap) {
    return variantMap[lowerCaseType] || "";
  }

  return "";
};

const TextBadge = ({ variant, type, children, className = "" }) => {
  const variantClassName = getVariantClassName(variant, type);
  const combinedClassName =
    `text-badge ${variantClassName} ${className}`.trim();

  return <span className={combinedClassName}>{children}</span>;
};

export default TextBadge;
