import React from 'react'

const ContainerWrapper = ({ children }) => (
  <div
    style={{
      display: 'flex',
      height: '100%',
      width: '100%',
      flexDirection: 'column',
      overflow: 'hidden',
    }}
  >
    {children}
  </div>
)

export default ContainerWrapper
