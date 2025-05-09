import { useEffect, useState } from 'react';

export const useIntersectionObserver = ({
  options,
  onIntersection,
  onUnobserve,
}: {
  options?: IntersectionObserverInit;
  onIntersection: (p: IntersectionObserverEntry) => void;
  onUnobserve?: () => void;
}): {
  setRef: (el: HTMLDivElement | null) => void;
} => {
  const [ref, setRef] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      onIntersection(entry);
    }, options);

    if (ref !== null) {
      observer.observe(ref);
    }

    return (): void => {
      if (ref !== null) {
        observer.unobserve(ref);
        onUnobserve?.();
      }
    };
  }, [ref, onIntersection, options, onUnobserve]);

  return {
    setRef,
  };
};