import { useState, useCallback, useRef } from 'react';

/**
 * Custom hook for making API requests
 * @returns {Object} Object containing data, loading, error states and request function
 */
export const useApi = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const request = useCallback(async (url, options = {}) => {
    // Abort previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      const defaultOptions = {
        headers: {
          'Content-Type': 'application/json',
        },
        signal: abortControllerRef.current.signal,
      };

      // Merge default options with provided options
      const requestOptions = {
        ...defaultOptions,
        ...options,
        headers: {
          ...defaultOptions.headers,
          ...options.headers,
        },
      };

      const response = await fetch(url, requestOptions);

      if (!response.ok) {
        let errorMessage = response.statusText;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          // If JSON parsing fails, use statusText
        }

        throw {
          status: response.status,
          statusText: response.statusText,
          message: errorMessage,
        };
      }

      const responseData = await response.json();
      setData(responseData);
      
      return responseData;
    } catch (err) {
      // Don't update state if request was aborted
      if (err.name === 'AbortError') {
        return;
      }

      const errorObject = {
        message: err.message || 'An error occurred',
        ...(err.status && { status: err.status }),
        ...(err.statusText && { statusText: err.statusText }),
      };

      setError(errorObject);
      throw errorObject;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
    
    // Abort any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  return {
    data,
    loading,
    error,
    request,
    reset,
  };
};
