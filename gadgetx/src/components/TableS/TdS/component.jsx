import './style.scss'

const TdS = ({ children }) => {
  return (
    <td className="td fs14 fw600">
      <div>{children}</div>
    </td>
  )
}

export default TdS
