import { forwardRef } from "react";
import TextField from "@mui/material/TextField";

const CustomTextField = forwardRef(({ sx = {}, ...props }, ref) => {
  return (
    <TextField
      inputRef={ref}
      variant="outlined"
      fullWidth
      sx={{
        backgroundColor: "var(--app-bg)",  
        borderRadius: "8px",  
        "& .MuiOutlinedInput-root": {

          height: "40px",  
          borderRadius: "8px",
          paddingTop: "0 !important",
          paddingBottom: "0 !important",
          display: "flex",
          alignItems: "center",  
          fontSize: "14px",  


          "& fieldset": {
            border: "solid 1px var( --border-color)", 
            borderRadius: "8px",
          },
          "&:hover fieldset": {
            border: "solid 1px var( --border-color)",  
          },
          "&.Mui-focused fieldset": {
            border: "solid 1px var(--text-field-active-color)",
          },
          "& input::placeholder": {
            color: "black", 
            fontStyle: "italic",  
          },
        },
        
        "& .MuiInputLabel-root": {
          top: "50%",
          transform: "translateY(-50%)",  
          marginLeft: "14px",
          pointerEvents: "none",
        },

        "& .MuiInputLabel-shrink": {
          top: 0,
          transform: "translateY(-50%) scale(0.75)",
          marginLeft: "14px",
        },
      }}
      slotProps={{
        inputLabel: {
          required: false,  
        },
      }}
      {...props}
    />
  );
});

export default CustomTextField;
