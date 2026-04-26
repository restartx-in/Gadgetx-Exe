import { CiFilter } from "react-icons/ci";
import './style.scss';

const FilterButton = ({
  onClick,
  type = 'button',
  className = '',
  children,
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`filter_button fs10 fw500 ${className}`}
    >
      <CiFilter className="filter_button-icon" size={18} />
      <span className="filter_button-text">{children}</span>
    </button>
  );
};

export default FilterButton;