import './style.scss'

const Td = ({ children, colSpan = 1, style = {} }) => {
  return (
    <td colSpan={colSpan} style={{ fontFamily: "poppins", ...style }}>
      <div className="td" style={style?.textAlign === "center" ? { justifyContent: "center" } : {}}>
        {children}
      </div>
    </td>
  )
}

export default Td