import './style.scss' // Import ThSe SCSS file

const ThS = ({ children }) => {
  return (
    <th className="table-header-cell fs14 fw800">
      {' '}
      {/* Apply main class to th */}
      <div className="table-header-cell__content">
        {' '}
        {/* Apply content class to div */}
        {children}
      </div>
    </th>
  )
}

export default ThS
