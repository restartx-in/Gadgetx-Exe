import React, { useState, forwardRef, useEffect } from 'react'; 
// Replaced standard TextField with CustomTextField
import CustomTextField from '@/components/CustomTextField';
import './style.scss'; 

const PhoneNoField = forwardRef(
  (
    {
      name,
      value = '',
      onChange,
      label="Phone Number",
      placeholder = '',
      required = false,
      disabled = false,
      ...rest
    },
    ref,
  ) => {
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
      if (disabled) {
        setErrorMessage('');
      }
    }, [disabled]);

    const handleInputChange = (event) => {
      let newValue = event.target.value;
      // Allow only digits
      newValue = newValue.replace(/\D/g, '');

      if (newValue.length > 10) {
        newValue = newValue.slice(0, 10);
      }

      onChange({
        target: { value: newValue, name },
      });

      // Validate length (only show error if value exists but is incomplete)
      if (newValue && newValue.length !== 10) {
        setErrorMessage('Please enter exactly 10 digits.');
      } else {
        setErrorMessage('');
      }
    };

    return (
      <div className={`custom-phone-input ${disabled ? 'disabled' : ''}`}>
        <CustomTextField
          label={label}
          inputRef={ref}
          id={name || 'mobilephone'}
          name={name}
          value={value}
          placeholder={placeholder}
          onChange={handleInputChange}
          required={required}
          disabled={disabled}
          error={!!errorMessage}
          fullWidth
          variant="outlined"
          autoComplete="off"
          className="custom-phone-input__field"
          slotProps={{
            htmlInput: {
              autoComplete: 'off',
              ...rest
            },
            inputLabel: {
              required: false // Hides asterisk
            }
          }}
          {...rest}
        />
        
        {!disabled && errorMessage && (
          <div className="custom-phone-input__error-message">
            <span>!</span>
            {errorMessage}
          </div>
        )}
      </div>
    );
  },
);

PhoneNoField.displayName = 'PhoneNoField';

export default PhoneNoField;