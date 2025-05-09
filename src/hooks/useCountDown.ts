// lib
import { useCallback, useState
  , useEffect } from 'react';
import { useInterval, useCounter } from 'react-use';

export const useCountDown = ({
  startValue,
  countdownInterval = 1000,
}: {
  startValue: number;
  countdownInterval?: number;
}): [number, { startCountdown: () => void; stopCountdown: () => void; resetCountdown: () => void }] => {
  const [isCounterOn, setIsCounterOn] = useState(false);
  const [currentValue, { dec, reset: resetCounter }] = useCounter(startValue);

  const startCountdown = useCallback(() => setIsCounterOn(true), []);
  const stopCountdown = useCallback(() => setIsCounterOn(false), []);

  useEffect(() => {
    if (currentValue === 0) {
      stopCountdown();
    }
  }, [currentValue]);

  useInterval(dec, isCounterOn ? countdownInterval : null);

  const reset = useCallback(() => {
    stopCountdown();
    resetCounter(startValue);
  }, [resetCounter, startValue]);

  return [currentValue, { startCountdown, stopCountdown, resetCountdown: reset }];
};
