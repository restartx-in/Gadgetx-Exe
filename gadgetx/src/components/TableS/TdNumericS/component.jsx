import './style.scss'

const TdNumericS = ({ children }) => {
  return (
    <td>
      <div className="td_numeric fs14 fw400">
        {'₹' + Number(children).toLocaleString('en-IN')}
      </div>
    </td>
  )
}

export default TdNumericS
