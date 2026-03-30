import { useState, useEffect } from "react";

export function useMediaQuery(query) {
  const [value, setValue] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    function onChange(event) {
      setValue(event.matches);
    }
    const result = window.matchMedia(query);
    result.addEventListener("change", onChange);
    return () => result.removeEventListener("change", onChange);
  }, [query]);

  return value;
}