import React from "react";
import ActionsMenu from "@/components/ActionsMenu";

import "./style.scss";

const ListItem = ({
  title,
  subtitle,
  statusText,
  statusVariant = "default",
  amount,
  balanceText,
  onView,
  onEdit,
  onDelete,
  amountColor,
  // extraButton, // 1. Accept the new extraButton prop
}) => {
  const hasActions = onView || onEdit || onDelete;

  return (
    <div className="list-item">
      {/* A new header row for the title and actions menu */}
      <div className="list-item__header">
        <div className="list-item__title fs18 fw600">{title}</div>
        {/* {extraButton && (
        <div className="list-item__extra-actions">
          {extraButton}
        </div>
      )} */}
        {hasActions && (
          <ActionsMenu onView={onView} onEdit={onEdit} onDelete={onDelete} />
        )}
      </div>

      {/* A new body container for all the secondary details */}
      <div className="list-item__body">
        <div className="list-item__left-details">
          <div className="list-item__subtitle fs18">{subtitle}</div>
          {statusText && (
            <div
              className={`list-item__status list-item__status fs13 fw600${statusVariant}`}
            >
              {statusText}
            </div>
          )}
        </div>

        <div className="list-item__right-details">
          {amount !== undefined && (
            <div
              className="list-item__amount fs13 fw600"
              style={{ color: amountColor }}
            >
              {amount}
            </div>
          )}
          {balanceText && (
            <div className="list-item__balance fs14 ">{balanceText}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListItem;
