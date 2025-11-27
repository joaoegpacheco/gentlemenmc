/**
 * Custom hooks for async operations and business logic
 */
import { useState, useEffect, useCallback, useRef } from 'react';

export interface AsyncState<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
}

/**
 * Hook for handling async operations
 */
export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  immediate = true
): AsyncState<T> & { execute: () => Promise<void>; reset: () => void } {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    error: null,
    isLoading: immediate,
    isError: false,
    isSuccess: false,
  });

  const execute = useCallback(async () => {
    setState({
      data: null,
      error: null,
      isLoading: true,
      isError: false,
      isSuccess: false,
    });

    try {
      const response = await asyncFunction();
      setState({
        data: response,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
      });
    } catch (error) {
      setState({
        data: null,
        error: error as Error,
        isLoading: false,
        isError: true,
        isSuccess: false,
      });
    }
  }, [asyncFunction]);

  const reset = useCallback(() => {
    setState({
      data: null,
      error: null,
      isLoading: false,
      isError: false,
      isSuccess: false,
    });
  }, []);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, []);

  return { ...state, execute, reset };
}

/**
 * Hook for handling async mutations (create, update, delete)
 */
export function useMutation<TData, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>
) {
  const [state, setState] = useState<AsyncState<TData>>({
    data: null,
    error: null,
    isLoading: false,
    isError: false,
    isSuccess: false,
  });

  const mutate = useCallback(
    async (variables: TVariables) => {
      setState({
        data: null,
        error: null,
        isLoading: true,
        isError: false,
        isSuccess: false,
      });

      try {
        const response = await mutationFn(variables);
        setState({
          data: response,
          error: null,
          isLoading: false,
          isError: false,
          isSuccess: true,
        });
        return response;
      } catch (error) {
        setState({
          data: null,
          error: error as Error,
          isLoading: false,
          isError: true,
          isSuccess: false,
        });
        throw error;
      }
    },
    [mutationFn]
  );

  const reset = useCallback(() => {
    setState({
      data: null,
      error: null,
      isLoading: false,
      isError: false,
      isSuccess: false,
    });
  }, []);

  return { ...state, mutate, reset };
}

/**
 * Hook for debouncing values
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for interval operations
 */
export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;

    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

/**
 * Hook for previous value
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

/**
 * Hook for local storage
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  const removeValue = () => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  };

  return [storedValue, setValue, removeValue];
}

/**
 * Hook for click outside
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  callback: () => void
): React.RefObject<T> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [callback]);

  return ref;
}

/**
 * Hook for copy to clipboard
 */
export function useClipboard(timeout = 2000) {
  const [isCopied, setIsCopied] = useState(false);

  const copy = useCallback(async (text: string) => {
    if (!navigator?.clipboard) {
      console.warn('Clipboard not supported');
      return false;
    }

    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), timeout);
      return true;
    } catch (error) {
      console.error('Failed to copy:', error);
      setIsCopied(false);
      return false;
    }
  }, [timeout]);

  return { isCopied, copy };
}

