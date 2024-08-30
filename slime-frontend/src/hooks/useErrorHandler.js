import { useState, useCallback, useEffect } from 'react';

const useErrorHandler = (defaultDuration = 5000) => {
  const [errors, setErrors] = useState([]);
  const [isVisible, setIsVisible] = useState(false);

  const addError = useCallback((message, severity = 'error', duration = defaultDuration) => {
    const newError = {
      id: Date.now(),
      message,
      severity,
      duration
    };
    setErrors(prevErrors => [...prevErrors, newError]);
    setIsVisible(true);
  }, [defaultDuration]);

  const removeError = useCallback((id) => {
    setErrors(prevErrors => prevErrors.filter(error => error.id !== id));
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors([]);
    setIsVisible(false);
  }, []);

  useEffect(() => {
    if (errors.length > 0) {
      const timer = setTimeout(() => {
        removeError(errors[0].id);
        if (errors.length === 1) {
          setIsVisible(false);
        }
      }, errors[0].duration);

      return () => clearTimeout(timer);
    }
  }, [errors, removeError]);

  const getLatestError = useCallback(() => {
    return errors.length > 0 ? errors[errors.length - 1] : null;
  }, [errors]);

  return {
    errors,
    isVisible,
    addError,
    removeError,
    clearAllErrors,
    getLatestError
  };
};

export default useErrorHandler;