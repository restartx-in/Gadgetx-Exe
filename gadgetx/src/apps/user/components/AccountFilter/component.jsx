import { useState, useRef, useEffect, useCallback } from 'react';
import useAccounts from '@/hooks/api/account/useAccounts';
import './style.scss';

const ArrowIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const AccountFilter = ({ name, value, onChange, className = '', filters = {} }) => {
  const { data: accounts } = useAccounts(filters);
  const scrollContainerRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const checkScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      const isScrollable = scrollWidth > clientWidth;
      setShowLeftArrow(isScrollable && scrollLeft > 1);
      setShowRightArrow(isScrollable && scrollLeft < scrollWidth - clientWidth - 1);
    }
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(checkScroll);
    observer.observe(container);

    container.addEventListener('scroll', checkScroll, { passive: true });
    
    checkScroll();

    return () => {
      observer.disconnect();
      container.removeEventListener('scroll', checkScroll);
    };
  }, [accounts, checkScroll]);

  const handleSelect = (selectedValue) => {
    onChange({ target: { name, value: selectedValue } });
  };

  const handleScroll = (direction) => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = container.clientWidth * 0.8;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className={`account_filter_wrapper ${className}`}>
      <div className="account_filter_scroll_wrapper">
        {showLeftArrow && (
          <button type="button" className="scroll_arrow_button left" onClick={() => handleScroll('left')} aria-label="Scroll left">
            <ArrowIcon />
          </button>
        )}

        <div className="account_filter_container" ref={scrollContainerRef}>
          <button
            type="button"
            className={`account_filter_button ${!value ? 'active' : ''}`}
            onClick={() => handleSelect('')}
            aria-pressed={!value}
          >
            All
          </button>
          {(accounts || []).map((account) => (
            <button
              key={account.id}
              type="button"
              className={`account_filter_button ${value === account.name ? 'active' : ''}`}
              onClick={() => handleSelect(value === account.name ? '' : account.name)}
              aria-pressed={value === account.name}
            >
              {account.name}
            </button>
          ))}
        </div>
        
        {showRightArrow && (
          <button type="button" className="scroll_arrow_button right" onClick={() => handleScroll('right')} aria-label="Scroll right">
            <ArrowIcon />
          </button>
        )}
      </div>
    </div>
  );
};

export default AccountFilter;