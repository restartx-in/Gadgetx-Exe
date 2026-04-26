import React, { useEffect, useState } from 'react'
import { IoSearch } from 'react-icons/io5'
import './style.scss'

const SearchField = ({
  searchRef,
  searchOptions = [],
  handleSearch,
  searchKey,
  setSearchType,
  setSearchKey,
  searchType,
  showSearchType = true, 
  customPlaceholder ='search'
}) => {
  const [placeHolder, setPlaceHolder] = useState('')

  useEffect(() => {
    if (!showSearchType) {
      setPlaceHolder(customPlaceholder)
      return
    }

    const searchTypeName =
      searchOptions.find((option) => option.value === searchType)?.name ||
      'Search'

    setPlaceHolder(searchTypeName)
  }, [searchType, searchOptions, showSearchType])

  return (
    <div className="search_field">
      {showSearchType && (
        <select
          value={searchType}
          onChange={(e) => {
            setSearchType(e.target.value)
            searchRef.current?.focus()
          }}
          className="search_field-select fs14"
        >
          <option value="">Search Type</option>
          {searchOptions.map((option, index) => (
            <option key={index} value={option.value}>
              {option.name}
            </option>
          ))}
        </select>
      )}

      <input
        type="text"
        ref={searchRef}
        className="search_field-input fs14"
        placeholder={placeHolder}
        value={searchKey}
        onChange={(e) => setSearchKey(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSearch()
        }}
      />

      <button className="search_field-button fs16" onClick={handleSearch}>
        <IoSearch />
      </button>
    </div>
  )
}

export default SearchField
