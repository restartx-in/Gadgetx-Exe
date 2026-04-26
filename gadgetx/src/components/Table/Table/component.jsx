import './style.scss'
const Table = ({ children }) => {
  return (
    <div className="common_table_wrapper">
      <table>{children}</table>
    </div>
  )
}

export default Table
