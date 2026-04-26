import React from 'react'
import ActionsMenu from '@/apps/user/components/ActionsMenu'

import './style.scss'

const ListItem = ({
  title,
  subtitle,
  statusText,
  statusVariant = 'default',
  amount,
  balanceText,
  onView,
  onEdit,
  onDelete,
  amountColor,
  onClick, // <--- Destructure onClick
  ...props // <--- Capture any other props (like style, id, etc.)
}) => {
  const hasActions = onView || onEdit || onDelete

  return (
    <div 
      className="list-item" 
      onClick={onClick} // <--- Apply the click handler here
      style={{ cursor: onClick ? 'pointer' : 'default' }} // <--- Add pointer cursor if clickable
      {...props} 
    >
      {/* A new header row for the title and actions menu */}
      <div className="list-item__header">
        <div className="list-item__title fs14 fw600">{title}</div>
        {hasActions && (
          // Stop propagation here so clicking the menu doesn't trigger the row click
          <div onClick={(e) => e.stopPropagation()}> 
            <ActionsMenu onView={onView} onEdit={onEdit} onDelete={onDelete} />
          </div>
        )}
      </div>

      {/* A new body container for all the secondary details */}
      <div className="list-item__body">
        <div className="list-item__left-details">
          <div className="list-item__subtitle fs14">{subtitle}</div>
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
            <div className="list-item__amount fs16 fw600" style={{ color: amountColor }}>
              {amount}
            </div>
          )}
          {balanceText && (
            <div className="list-item__balance fs14 ">{balanceText}</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ListItem