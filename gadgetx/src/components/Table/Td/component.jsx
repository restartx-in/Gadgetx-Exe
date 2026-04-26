import './style.scss'

const Td = ({ children, colSpan = 1 }) => {
  return (
    <td colSpan={colSpan}  style={{fontFamily:"poppins"}}>
      <div className="td">{children}</div>
    </td>
  )
}

export default Td