import { FiRefreshCw } from 'react-icons/fi';
import './style.scss';

export default function RefreshButton({ onClick }) {
  return (
    <button className="refresh_button fw500" onClick={onClick}>
      <FiRefreshCw size={18} />
    </button>
  );
}
