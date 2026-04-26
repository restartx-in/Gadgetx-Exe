import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

function useQueryParamsHandler(queryConfig, state, setState, stateValues) {
  const location = useLocation();
  const initialLoad = useRef(true);

  useEffect(() => {
    if (initialLoad.current) {
      initialLoad.current = false;
      if (queryConfig.existingQueryParams?.size === 0) return; // skip on initial load
    }

    queryConfig.queryParams.forEach(({ key, setter, defaultValue, value }) => {
      const queryValue = queryConfig.existingQueryParams.get(key);
      if (!queryValue) {
        setter(defaultValue);
      } else {
        value && setter(value);
      }
    });


  }, [location?.search]);
}

export default useQueryParamsHandler;