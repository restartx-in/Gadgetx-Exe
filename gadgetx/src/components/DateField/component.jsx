// DateField/component.jsx

import React from 'react'
import PropTypes from 'prop-types'

// MUI and Date Picker Imports
import { LocalizationProvider, DatePicker, DateTimePicker } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'

import './style.scss'

const DateField = ({
  value = null,
  onChange,
  label = 'Select Date',
  disabled = false,
  showTime = false,
}) => {
  const wrapperClasses = ['date-field-wrapper'].filter(Boolean).join(' ')

  const Component = showTime ? DateTimePicker : DatePicker

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <div className={wrapperClasses}>
        <Component
          label={label}
          value={value}
          onChange={onChange}
          disabled={disabled}
          slotProps={{
            textField: {
              size: 'small',
              fullWidth: true,
              sx: { width: '100%' },
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

export default DateField