import { useState, useRef, useEffect } from 'react';
import { IoSearch } from 'react-icons/io5'

import './style.scss';

const SearchableTh = ({ title, onSearch }) => {
  const [showPopup, setShowPopup] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const popupRef = useRef(null);

  const handleSearchClick = () => {
    onSearch(searchTerm);
    setShowPopup(false);
  };

  const handleClickOutside = (event) => {
    if (popupRef.current && !popupRef.current.contains(event.target)) {
      setShowPopup(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="searchable-th">
      <span>{title}</span>
      <button className="search-icon-button" onClick={() => setShowPopup(prev => !prev)}>
        <IoSearch size={16} />
      </button>
      {showPopup && (
        <div className="search-popup" ref={popupRef}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`Search ${title}...`}
            className="search-input"
          />
          <button onClick={handleSearchClick} className="search-button">
            Search
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchableTh;