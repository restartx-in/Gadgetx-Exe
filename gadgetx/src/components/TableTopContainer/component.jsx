import React from 'react';
import HStack from '@/components/HStack/component.jsx';
import './style.scss';

const TableTopContainer = ({ summary, mainActions, bottomRight, isMargin = false }) => {
  return (
    <div
      className="table_top_container"
      style={{ marginBottom: isMargin ? ".7rem" : "0" }}
    >
      {/* TOP ROW (Summary + Main Actions) */}
      <HStack
        justifyContent="space-between"
        alignItems="center"
        className="table_top_container-content"
      >
        {/* Summary - left */}
        <div className="table_top_container-summary">
          {summary}
        </div>

        {/* Main Actions - right */}
        <HStack
          justifyContent="flex-end"
          alignItems="center"
          gap="12px"
          className="table_top_container-main_actions"
        >
          {mainActions}
        </HStack>
      </HStack>

      {/* BOTTOM RIGHT SECTION */}
      {bottomRight && (
        <div className="table_top_container-bottom_right">
          {bottomRight}
        </div>
      )}
    </div>
  );
};

export default TableTopContainer;
