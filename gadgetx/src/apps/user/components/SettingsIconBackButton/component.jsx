import { FiArrowLeft } from 'react-icons/fi'
import './style.scss'


const SettingsIconBackButton = ({ onClick = () => window.history.back() }) => {
  return (
    <button className="icon_back_btn" onClick={onClick} type="button">
      <FiArrowLeft className="icon_back_btn-icon" size={18} />
    </button>
  )
}

export default SettingsIconBackButton
