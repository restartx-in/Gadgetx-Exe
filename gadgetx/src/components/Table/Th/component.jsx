import './style.scss'

const Th = ({ children  }) => {
  return (
    <th className="table_header_cell fs14 fw600">
      <div className="table_header_cell-content">{children}</div>
    </th>
  )
}

export default Th
