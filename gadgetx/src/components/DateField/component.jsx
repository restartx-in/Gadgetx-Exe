// DateField/component.jsx

import React from 'react'
import PropTypes from 'prop-types'

// MUI and Date Picker Imports
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'

import './style.scss'

const DateField = ({ value, onChange, label, disabled = false }) => {
  const wrapperClasses = ['date-field-wrapper'].filter(Boolean).join(' ')

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <div className={wrapperClasses}>
        <DatePicker
          label={label}
          value={value}
          onChange={onChange}
          disabled={disabled}
          slotProps={{
            textField: {
              size: 'small',
            },
          }}
        />
      </div>
    </LocalizationProvider>
  )
}

DateField.propTypes = {
  value: PropTypes.instanceOf(Date),
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string,
}

DateField.defaultProps = {
  value: null,
  label: 'Select Date',
}

export default DateField