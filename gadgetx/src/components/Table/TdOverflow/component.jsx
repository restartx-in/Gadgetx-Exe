import './style.css'

const TdOverflow = ({ children }) => {
  return (
    <td className="custom-td">
      <div className="td-content">{children}</div>
    </td>
  )
}

export default TdOverflow
