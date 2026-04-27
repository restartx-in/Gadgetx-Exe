import React from 'react';
import HStack from '@/components/HStack/component.jsx';
import './style.scss';

const TableTopContainer = ({
  summary,
  mainActions,
  bottomRight,
  topRight,
  isMargin = false,
}) => {
  return (
    <div
      className="table_top_container"
      style={{ marginBottom: isMargin ? '.7rem' : '0' }}
    >
      {/* TOP ROW (Summary + Right Section) */}
      <HStack
        justifyContent="space-between"
        alignItems="center"
        className="table_top_container-content"
      >
        {/* Summary - left */}
        <div className="table_top_container-summary">{summary}</div>

        {/* Right Section */}
        <div className="table_top_container-right_section">
          {/* Top Right Actions */}
          {topRight && (
            <div className="table_top_container-top_right">{topRight}</div>
          )}

          {/* Main Actions */}
          <HStack
            justifyContent="flex-end"
            alignItems="center"
            gap="12px"
            className="table_top_container-main_actions"
             style={{ marginBottom: isMargin ? '.6rem' : '1px' }}
          >
            {mainActions}
          </HStack>
        </div>
      </HStack>

      {/* BOTTOM RIGHT SECTION */}
      {bottomRight && (
        <div className="table_top_container-bottom_right">{bottomRight}</div>
      )}
    </div>
  );
};

export default TableTopContainer;