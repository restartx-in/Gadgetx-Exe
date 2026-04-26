import { LuEye } from "react-icons/lu";
import './style.scss' 

const ViewButton = ({ onClick, type = 'button', className = '', children }) => {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`view_button fs10 fw500 ${className}`}
    >
      <LuEye className="view_button__icon" size={18} />
      <span className="view_button__text">{children}</span>
    </button>
  )
}

export default ViewButton