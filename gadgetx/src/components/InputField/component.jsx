import React from 'react';
import CustomTextField from '@/components/CustomTextField';
import './style.scss';

const InputField = ({
  name,
  value = '',
  onChange,
  placeholder = '',
  type = 'text',
  required = false,
  disabled = false,
  className = '',
  label,
  isLabel = true,
  ...rest
}) => {
  return (
    <div className={`custom-input ${className} ${disabled ? 'disabled' : ''}`}>
      <CustomTextField
        id={name}
        label={label}
        name={name}
        value={value ?? ''}
        onChange={onChange}
        placeholder={placeholder}
        type={type}
        required={required}
        disabled={disabled}
        className="custom-input__field"
        variant="outlined"
        size="small"
        fullWidth
        autoComplete="off"
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
    </div>
  );
};

export default InputField;