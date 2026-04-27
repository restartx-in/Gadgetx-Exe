import React, { forwardRef } from 'react';
import TextField from '@mui/material/TextField';
import './style.scss';

const TextArea = forwardRef(({
  name,
  value = '',
  onChange,
  onBlur, 
  error,  
  placeholder = '',
  required = false,
  disabled = false,
  label,
  isLabel = true, 
  className = '', 
  rows = 3,
  style = {},
  ...rest
},ref) => {
  return (
    <div className={`custom-textarea ${className}`} style={style}>
      <TextField
        id={name}
        name={name}
        label={isLabel ? label : null}
        value={value ?? ''}
        onChange={onChange}
        inputRef={ref}
        onBlur={onBlur}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        multiline
        minRows={rows}
        fullWidth
        variant="outlined"
        
        error={!!error} 
        helperText={error?.message} 

        slotProps={{
          htmlInput: {
            autoComplete: "off",
            ...rest,
          },
          inputLabel: {
            required: false, 
          },
        }}
        {...rest}
      />
    </div>
  );
});

export default TextArea;