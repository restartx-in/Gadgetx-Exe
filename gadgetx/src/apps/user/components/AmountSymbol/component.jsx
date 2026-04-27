import React from "react";
import useFetchSettings from "@/apps/user/hooks/api/settings/useFetchSettings";
import countries from "@/constants/countries";

const AmountSymbol = ({ children, ...props }) => {
  const { data: settingsData } = useFetchSettings();

  const countryName = settingsData?.country || "India";

  const matchedCountry = countries.find(
    (c) => c.name.toLowerCase() === countryName.toLowerCase()
  );

  const symbol = matchedCountry?.currencySymbol || "₹";
  const locale = matchedCountry?.locale || "en-IN";

  const amount =
    children !== undefined && children !== null && !isNaN(children)
      ? Number(children)
      : children;

  const displayValue =
    typeof amount === "number"
      ? amount.toLocaleString(locale, { minimumFractionDigits: 2 })
      : amount;

  return (
    <span {...props}>
      {symbol} {displayValue}
    </span>
  );
};

export default AmountSymbol;
