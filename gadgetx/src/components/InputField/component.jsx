import React, { forwardRef } from "react";
import CustomTextField from "@/components/CustomTextField";

const InputField = forwardRef(
  (
    {
      name,
      value,
      onChange,
      onBlur, // Add onBlur for RHF
      placeholder = "",
      type = "text",
      required = false,
      disabled = false,
      className = "",
      label,
      error, // Pass error state
      ...rest
    },
    ref,
  ) => {
    return (
      <div
        className={`custom-input ${className} ${disabled ? "disabled" : ""}`}
      >
        <CustomTextField
          ref={ref}
          id={name}
          label={label}
          name={name}
          value={value ?? ""}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          type={type}
          required={required}
          disabled={disabled}
          error={!!error}
          helperText={error?.message}
          className="custom-input__field"
          variant="outlined"
          size="small"
          fullWidth
          autoComplete="off"
          {...rest}
        />
      </div>
    );
  },
);

InputField.displayName = "InputField";
export default InputField;
