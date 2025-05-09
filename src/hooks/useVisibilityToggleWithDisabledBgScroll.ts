// types
import type { RefObject } from 'react';

// hooks
import { useVisibilityToggle } from './useVisibilityToggle';
import { useCallback } from 'react';

export const useVisibilityToggleWithDisabledBgScroll = ({
  initialState,
  containerRef,
}: {
  initialState?: boolean;
  containerRef?: RefObject<HTMLElement>;
} = {}): { isVisible: boolean; show: () => void; hide: () => void } => {
  const containerEl = containerRef?.current ?? (typeof window != 'undefined' && window.document ? document.body : null);
  const { isVisible, show: _show, hide: _hide } = useVisibilityToggle(initialState);

  const show = useCallback(() => {
    _show();

    if (containerEl) {
      containerEl.style.overflow = 'hidden';
    }
  }, [_show, containerEl]);

  const hide = useCallback(() => {
    _hide();

    if (containerEl) {
      containerEl.style.overflow = 'unset';
    }
  }, [_hide, containerEl]);

  return { isVisible, show, hide };
};
