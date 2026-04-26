import './style.scss'

const TdSLS = ({ page = 1, pageSize = 0, index = 0 }) => {
  const currentPage = page > 0 ? page : 1
  const size = pageSize > 0 ? pageSize : 0

  const serialNumber = (currentPage - 1) * size + index + 1

  return (
    <td className="td_sl fs16">
      <div className="td_sl-content">{serialNumber}</div>
    </td>
  )
}

export default TdSLS
