import { LuArrowUp,LuArrowDown,LuArrowDownUp  } from "react-icons/lu";

const ThSort = ({ sort, setSort, value, handleSort }) => {
  const handleClick = () => {
    if (sort === value) {
      setSort(`-${value}`)
      handleSort(`-${value}`)
    } else {
      setSort(value)
      handleSort(value)
    }
  }

  const iconStyle = {
    // color: "#4C5055CC",
    cursor: 'pointer',
  }

  const renderIcon = () => {
    if (sort === value) return <LuArrowDown  style={iconStyle} />
    if (sort === `-${value}`) return <LuArrowUp style={iconStyle} />
    return <LuArrowDownUp  style={iconStyle} />
  }

  return (
  <div 
    onClick={handleClick} 
    style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}
  >
    {renderIcon()}
  </div>
)

}

export default ThSort
