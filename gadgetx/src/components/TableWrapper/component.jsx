import React from 'react'

const TableWrapper = ({ children }) => (
  <div
    style={{
      flex: 1,
      overflow: 'auto',
      width: '100%',
    }}
  >
    {children}
  </div>
)

export default TableWrapper
