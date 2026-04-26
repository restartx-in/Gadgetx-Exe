import { useState } from 'react'
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io'
import './style.scss'
import { useIsMobile } from '@/utils/useIsMobile'

const PageLimitSelect = ({
  handlePageLimitSelect,
  viewAll,
  itemsPerPage,
  totalItems,
  currentPage = 1,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const isMobile = useIsMobile()

  const options = [
    { value: 10, label: '10 Per Page' },
    { value: 20, label: '20 Per Page' },
    { value: 30, label: '30 Per Page' },
    { value: 40, label: '40 Per Page' },
    { value: 50, label: '50 Per Page' },
    { value: 100, label: '100 Per Page' },
    { value: 150, label: '150 Per Page' },
    { value: 200, label: '200 Per Page' },
    { value: 1000, label: '1000 Per Page' },
  ]

  const getFormattedNumber = (value) =>
    value >= 0 && value < 10 ? `0${value}` : value.toString()

  const getTotalItemInPage = () => {
    const max = currentPage * itemsPerPage
    return max > totalItems ? totalItems : max
  }

  const selectedLabel = viewAll
    ? '1000 Per Page'
    : options.find((o) => o.value === itemsPerPage)?.label

  const handleOptionSelect = (value) => {
    handlePageLimitSelect(value)
    setIsOpen(false)
  }

  return (
    <div className="page_limit_select gap16">
      <div className="page_limit_select__left">
        <span className="fs16">
          {`${getFormattedNumber(
            (currentPage - 1) * itemsPerPage + 1,
          )}-${getFormattedNumber(getTotalItemInPage())}`}
        </span>
      </div>
      <div className="page_limit_select__dropdown">
        <button onClick={() => setIsOpen(!isOpen)}>
          <span className="fs16">
            {selectedLabel || 'Select Items Per Page'}
          </span>
          {isOpen ? (
            <IoIosArrowUp color="var(--navy)" size={isMobile ? 15 : 20} />
          ) : (
            <IoIosArrowDown color="var(--navy)" size={isMobile ? 15 : 20} />
          )}
        </button>

        {isOpen && (
          <div className="page_limit_select__dropdown-menu">
            {options.map((option) => (
              <div
                key={option.value}
                onClick={() => handleOptionSelect(option.value)}
                className="page_limit_select__dropdown-menu-item fs12"
              >
                {option.label}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default PageLimitSelect
