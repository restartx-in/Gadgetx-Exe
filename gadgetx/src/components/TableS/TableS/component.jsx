import './style.scss'
const TableS = ({ children }) => {
  return (
    <div className="common_table_wrapper">
      <table>{children}</table>
    </div>
  )
}

export default TableS
