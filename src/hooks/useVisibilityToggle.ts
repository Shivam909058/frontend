import { useState, useCallback } from 'react';

function useVisibilityToggle(initialState?: boolean): {
  isVisible: boolean;
  show: () => void;
  hide: () => void;
  toggleVisibility: () => void;
} {
  const [isVisible, setIsVisible] = useState<boolean>(initialState ?? false);

  const show = useCallback(() => setIsVisible(true), []);
  const hide = useCallback(() => setIsVisible(false), []);

  const toggleVisibility = useCallback(() => setIsVisible(_isVisible => !_isVisible), []);

  return { isVisible, show, hide, toggleVisibility };
}

export { useVisibilityToggle };
