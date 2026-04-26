// src/components/VStack/component.jsx
import React from 'react'

const VStack = ({ children, gap = '16px' }) => {
  const inlineStyles = {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    // justifyContent: 'start',
    // alignItems: 'center',
    gap: gap,
  }

  return <div style={inlineStyles}>{children}</div>
}

export default VStack
