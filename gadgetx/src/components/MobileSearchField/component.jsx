import React, { useState } from 'react'
import { IoSearch } from 'react-icons/io5'
import './style.scss'
import { Modal, ModalHeader, ModalBody } from '@/components/Modal'
import Select from '@/components/Select'

const MobileSearchField = ({
  searchRef,
  searchOptions = [],
  handleSearch,
  searchKey,
  setSearchKey,
  searchType,
  setSearchType,
  showSearchType = true,  
  placeHolder = "Search"
}) => {
  const [isOpen, setIsOpen] = useState(false)

  const handleSearchAndClose = () => {
    handleSearch()
    setIsOpen(false)
  }

  return (
    <div>
      <button className="mobile_search_field" onClick={() => setIsOpen(true)}>
        <IoSearch size={18} />
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <ModalHeader>Search</ModalHeader>
        <ModalBody>
          {showSearchType && (
            <Select
              value={searchType}
              onChange={(e) => {
                setSearchType(e.target.value)
                searchRef.current?.focus()
              }}
              className="fs14 mobile_search_field__select"
              options={[
                { value: '', label: 'Search Type' },
                ...searchOptions.map((option) => ({
                  value: option.value,
                  label: option.name,
                })),
              ]}
            />
          )}

          <div className="mobile_search_field__popup-content-input_wrapper">
            <input
              type="text"
              ref={searchRef}
              className="fs14"
              placeholder={placeHolder}
              value={searchKey}
              onChange={(e) => setSearchKey(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearchAndClose()
              }}
            />
            <button onClick={handleSearchAndClose}>
              <IoSearch />
            </button>
          </div>
        </ModalBody>
      </Modal>
    </div>
  )
}

export default MobileSearchField
