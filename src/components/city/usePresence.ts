"use client";

import { useState } from "react";

/**
 * Keeps the last non-null value mounted while its exit animation plays.
 * `leaving` is true from the moment `value` becomes null until `onExited` is
 * called (wire it to the element's onAnimationEnd).
 */
export function usePresence<T>(value: T | null) {
  const [shown, setShown] = useState(value);
  const [previous, setPrevious] = useState(value);

  // Adjust state during render when the input changes (no effect round-trip).
  if (value !== previous) {
    setPrevious(value);
    if (value !== null) setShown(value);
  }

  const leaving = value === null && shown !== null;
  const onExited = () => {
    if (value === null) setShown(null);
  };
  return { shown: value ?? shown, leaving, onExited };
}
