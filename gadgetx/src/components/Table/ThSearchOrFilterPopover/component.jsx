import { useState, useRef, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { IoSearch } from 'react-icons/io5'
import './style.scss'

const ThSearchOrFilterPopover = ({ 
  children, 
  isSearch = true, 
  popoverWidth = 180,
  onSearch
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const triggerRef = useRef(null)
  const menuRef = useRef(null)

  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })

  const handleToggleMenu = () => {
    if (!isMenuOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      
      setMenuPosition({
        top: rect.bottom + 4,
        left: rect.left,
      })
    }
    setIsMenuOpen((prev) => !prev)
  }

  const handleSearchAction = () => {
    if (onSearch) onSearch()
    setIsMenuOpen(false)
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isMenuOpen &&
        triggerRef.current && !triggerRef.current.contains(event.target) &&
        menuRef.current && !menuRef.current.contains(event.target)
      ) {
        setIsMenuOpen(false)
      }
    }

    const handleScroll = (event) => {
      if (!menuRef.current) return

      if (menuRef.current.contains(event.target)) {
        return
      }

      if (isMenuOpen) setIsMenuOpen(false)
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      window.addEventListener('scroll', handleScroll, true)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [isMenuOpen])

  return (
    <div className="table_search">
      <button
        ref={triggerRef}
        type="button"
        className={`table_search__trigger ${isMenuOpen ? 'active' : ''}`}
        onClick={handleToggleMenu}
        aria-haspopup="true"
        aria-expanded={isMenuOpen}
        title={isSearch ? "Search" : "Filter"}
      >
        {isSearch ? <IoSearch size={16}/> : <IoSearch size={16}/>}
      </button>

      {isMenuOpen && ReactDOM.createPortal(
        <div
          ref={menuRef}
          className="table_search__menu"
          style={{
            position: 'fixed',
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`,
            width: `${popoverWidth}px`,
            maxWidth: 'calc(100vw - 20px)',
            zIndex: 999999,
          }}
        >
          {isSearch ? (
            <div className="table_search__search-wrapper">
              {children}
              <button 
                type="button" 
                className="table_search__search-btn"
                onClick={handleSearchAction}
                aria-label="Search"
              >
                <IoSearch size={16} />
              </button>
            </div>
          ) : (
            children
          )}
        </div>,
        document.body
      )}
    </div>
  )
}

export default ThSearchOrFilterPopover
