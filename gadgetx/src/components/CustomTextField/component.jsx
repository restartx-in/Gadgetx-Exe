import React, { forwardRef } from "react";
import TextField from "@mui/material/TextField";

const CustomTextField = forwardRef(({ sx = {}, ...props }, ref) => {
  return (
    <TextField
      inputRef={ref}
      variant="outlined"
      fullWidth
      // Merge default custom styles with any sx passed via props
      sx={{
          backgroundColor: "var(--app-bg)", // background
          borderRadius: "8px", // border-radius
          "& .MuiOutlinedInput-root": {
                height: "40px", // your fixed height
                borderRadius: "8px",
                paddingTop: "0 !important",
                paddingBottom: "0 !important",
                display: "flex",
                alignItems: "center", // centers input text

          "&:hover fieldset": {
            border: "solid 1px var(--text-field-active-color)", // remove hover border
          },
          fontSize: "14px", // input text font style
          "& fieldset": {
            borderRadius: "8px",
          },
          "& input::placeholder": {
            color: "black", // placeholder color
            fontStyle: "italic", // placeholder style
          },
        },

     

        // ⭐ Center label INSIDE field (not floating)
        "& .MuiInputLabel-root": {
          top: "50%",
          transform: "translateY(-50%)", // center vertically
          marginLeft: "14px",
          pointerEvents: "none",
        },

        // ⭐ When label floats on focus or typed
        "& .MuiInputLabel-shrink": {
          top: 0,
          transform: "translateY(-50%) scale(0.75)",
          marginLeft: "14px",
        },
      }}
      slotProps={{
        inputLabel: {
          required: false, // Hides asterisk visually even if required prop is true
        },
      }}
      {...props}
    />
  );
});

export default CustomTextField;
