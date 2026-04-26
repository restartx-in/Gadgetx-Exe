import { useState, useEffect, forwardRef, useRef, useMemo } from 'react'
import { useDoneBys } from '@/hooks/api/doneBy/useDoneBys'

import CustomTextField from '@/components/CustomTextField'
import CustomScrollbar from '@/components/CustomScrollbar'

import './style.scss'

const DoneByAutoComplete = forwardRef(
  (
    {
      name,
      value,
      onChange,
      label='Done By',
      placeholder = 'Select a Done By',
      required = false,
      disabled = false,
      className = '',
      filters = {},
      style = {},
    },
    ref,
  ) => {
    const {
      data: doneBys,
      isLoading,
      isError,
      error,
    } = useDoneBys(filters)
    const [doneByOptions, setDoneByOptions] = useState([])

    useEffect(() => {
      if (doneBys) {
        const options = doneBys.map((doneBy) => ({
          value: doneBy.id,
          label: doneBy.name,
        }))
        setDoneByOptions(options)
      }
    }, [doneBys])

    if (isLoading) {
      return (
        <div className="donebyinput-select">
          <CustomTextField
            label={label}
            placeholder="Loading options..."
            disabled
            fullWidth
            variant="outlined"
          />
        </div>
      )
    }

    if (isError) {
      console.error('Failed to load done by options:', error)
      return (
        <div className="donebyinput-select">
          <CustomTextField
            label={label}
            placeholder="Error loading options"
            disabled
            error
            fullWidth
            variant="outlined"
          />
        </div>
      )
    }

    return (
      <DoneBySelectAutocompleteInput
        ref={ref}
        name={name}
        value={value}
        onChange={onChange}
        options={doneByOptions}
        label={label}
        placeholder={placeholder}
        required={required}
        disabled={disabled || isLoading}
        className={className}
        style={style}
      />
    )
  },
)

export default DoneByAutoComplete

const DoneBySelectAutocompleteInput = forwardRef(
  (
    {
      name,
      value,
      onChange,
      options,
      label,
      placeholder = '',
      required = false,
      disabled = false,
      className = '',
      style = {},
      ...rest
    },
    ref,
  ) => {
    const [showDropdown, setShowDropdown] = useState(false)
    const [inputValue, setInputValue] = useState('')
    const [activeIndex, setActiveIndex] = useState(-1)
    
    // REMOVED: dropdownRef and scrolling useEffect
    const hasBeenFocused = useRef(false)

    useEffect(() => {
      const selectedOption = options.find((opt) => opt.value === value)
      setInputValue(selectedOption ? selectedOption.label : '')
    }, [value, options])

    const filteredOptions = useMemo(() => {
      if (!inputValue) {
        return options
      }
      return options.filter((opt) =>
        opt.label.toLowerCase().includes(inputValue.toLowerCase()),
      )
    }, [inputValue, options])

    const handleInputChange = (e) => {
      const currentInput = e.target.value
      setInputValue(currentInput)
      setActiveIndex(-1)
      setShowDropdown(true)

      if (currentInput.length === 0) {
        onChange({ target: { name, value: '' } })
      }
    }

    const handleSelectOption = (option) => {
      onChange({ target: { name, value: option.value } })
      setInputValue(option.label)
      setShowDropdown(false)
    }

    const handleFocus = () => {
      if (hasBeenFocused.current) {
        setShowDropdown(true)
      }
      hasBeenFocused.current = true
    }

    const handleKeyDown = (e) => {
      if (disabled || !showDropdown) return
      
      const itemsCount = filteredOptions.length
      if (itemsCount === 0) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setActiveIndex((prevIndex) => (prevIndex + 1) % itemsCount)
          break
        case 'ArrowUp':
          e.preventDefault()
          setActiveIndex(
            (prevIndex) => (prevIndex - 1 + itemsCount) % itemsCount,
          )
          break
        case 'Enter':
          if (activeIndex < 0) return
          e.preventDefault()
          handleSelectOption(filteredOptions[activeIndex])
          break
        case 'Escape':
          setShowDropdown(false)
          break
        default:
          break
      }
    }

    return (
      <div 
        style={{ ...style, position: 'relative' }}
      >
        <CustomTextField
          ref={ref}
          id={name}
          name={name}
          label={label}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onClick={() => setShowDropdown(true)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete="off"
          fullWidth
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          {...rest}
        />

        {showDropdown && (
          <CustomScrollbar
            className="donebyinput-select__dropdown"
            activeIndex={activeIndex}
            as="ul"
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, index) => (
                <li
                  key={opt.value}
                  // PreventDefault is crucial here to stop blur before click
                  onMouseDown={(e) => {
                    e.preventDefault()
                    handleSelectOption(opt)
                  }}
                  className={`donebyinput-select__option ${
                    index === activeIndex ? 'active' : ''
                  }`}
                >
                  <div className="donebyinput-select__option-content">
                    <span>{opt.label}</span>
                  </div>
                </li>
              ))
            ) : (
              inputValue && (
                <li className="donebyinput-select__option donebyinput-select__option--disabled">
                  No matches found
                </li>
              )
            )}
          </CustomScrollbar>
        )}
      </div>
    )
  },
)