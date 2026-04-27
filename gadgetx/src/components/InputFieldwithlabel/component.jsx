import React from 'react';
import './style.scss'; // <-- changed to style.scss

// Changed the component name to PascalCase
const InputFieldWithLabel = React.forwardRef(
  (
    {
      wrapperClassName = '',
      id,
      label,
      value,
      onChange,
      placeholder = '',
      type = 'text',
      required = false,
      disabled = false,
      ...rest
    },
    ref,
  ) => {
    return (
      <div className={`input_field_with_label ${wrapperClassName}`}>
        {label && <label htmlFor={id} className="input_field_with_label-label">{label}</label>}
        <input
          id={id}
          name={id}
          ref={ref}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          type={type}
          required={required}
          disabled={disabled}
          className={`input_field_with_label-input`}
          {...rest}
        />
      </div>
    );
  },
);

export default InputFieldWithLabel;
