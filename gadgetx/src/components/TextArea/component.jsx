import React from 'react';
import TextField from '@mui/material/TextField';
import './style.scss';

const TextArea = ({
  name,
  value = '',
  onChange,
  placeholder = '',
  required = false,
  disabled = false,
  label,
  isLabel = true, 
  className = '', 
  rows = 3,
  style = {},
  ...rest
}) => {
  return (
    <div className={`custom-textarea ${className}`} style={style}>
      <TextField
        id={name}
        name={name}
        label={isLabel ? label : null}
        value={value ?? ''}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        multiline
        minRows={rows}
        fullWidth
        variant="outlined"
        {...rest}
      />
    </div>
  );
};

export default TextArea;