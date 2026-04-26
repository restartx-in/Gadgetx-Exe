import './style.scss'

const TdDateS = ({ children }) => {
  return (
    <td className="td_date">
      <div className="td_date-content">
        {children ? new Date(children).toLocaleDateString('en-CA') : ''}
      </div>
    </td>
  )
}

export default TdDateS
