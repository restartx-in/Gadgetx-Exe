import { TOASTTYPE, TOASTSTATUS } from "@/constants/object/toastType";

export const onFormError = (formErrors, showToast) => {
  const findFirstError = (errors) => {
    if (!errors) return null;
    if (errors.message) return errors.message;
    
    // If it's an array or object, recurse
    for (const key in errors) {
      const error = findFirstError(errors[key]);
      if (error) return error;
    }
    return null;
  };

  const message = findFirstError(formErrors);
  if (message) {
    showToast({
      type: TOASTTYPE.GENARAL,
      message: message,
      status: TOASTSTATUS.ERROR,
    });
  }
};