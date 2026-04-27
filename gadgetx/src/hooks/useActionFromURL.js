import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const useActionFromURL = (actionName, onActionFound) => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('action') === actionName) {
      onActionFound();
    }
  }, [searchParams, actionName, onActionFound]);
};

export default useActionFromURL;