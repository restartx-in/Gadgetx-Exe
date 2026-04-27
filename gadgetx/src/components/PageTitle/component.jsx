import React from 'react'
import './style.scss'

const PageTitle = ({ title, subtitle }) => {
  return (
    <div className="page_title">
      <h1 className="page_title-text fs24 fw500">{title}</h1>
      {subtitle && <p className="page_title-subtitle">{subtitle}</p>}
    </div>
  )
}

export default PageTitle