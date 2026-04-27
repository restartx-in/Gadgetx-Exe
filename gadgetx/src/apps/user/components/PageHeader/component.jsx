import React from 'react'
import './style.scss'

const PageHeader = ({ children }) => {
  return (
    <div className="page_header">
      {children && <div className="page_header-actions">{children}</div>}
    </div>
  )
}

export default PageHeader
