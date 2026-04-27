import { FiArrowLeft } from 'react-icons/fi';
import './style.scss';

const IconBackButton = () => {
  return (
    <button
      className="icon_back_btn"
      onClick={() => window.history.back()}
      type="button"
    >
      <FiArrowLeft className="icon_back_btn-icon" size={18} />
    </button>
  );
};

export default IconBackButton;