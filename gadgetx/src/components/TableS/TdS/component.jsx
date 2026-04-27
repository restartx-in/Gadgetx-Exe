import './style.scss'

const TdS = ({ children }) => {
  return (
    <td className="td fs14 fw400">
      <div>{children}</div>
    </td>
  )
}

export default TdS
