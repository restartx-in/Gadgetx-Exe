import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * A custom hook to synchronize a state object with the URL query parameters.
 * @param {object} params - An object where keys are the desired URL parameter names (e.g., camelCase)
 * and values are the state values to sync.
 */
const useSyncURLParams = (params) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    let hasChanged = false;

    // A set of all keys present in the incoming params object.
    const paramKeys = new Set(Object.keys(params));

    // First, update or add params from the state object.
    for (const key in params) {
      const value = params[key];
      const currentVal = searchParams.get(key);
      const strValue = (value !== undefined && value !== null) ? String(value) : "";

      if (strValue !== "") {
        if (currentVal !== strValue) {
          searchParams.set(key, strValue);
          hasChanged = true;
        }
      } else {
        // If the value is empty but the param exists in the URL, remove it.
        if (searchParams.has(key)) {
          searchParams.delete(key);
          hasChanged = true;
        }
      }
    }
    
    // Second, clean up any params in the URL that are no longer in our state object.
    // This handles cases where a filter is cleared.
    for (const key of searchParams.keys()) {
        if (!paramKeys.has(key)) {
            searchParams.delete(key);
            hasChanged = true;
        }
    }


    if (hasChanged) {
      navigate({ search: searchParams.toString() }, { replace: true });
    }
  }, [params, navigate, location]);
};

export default useSyncURLParams;