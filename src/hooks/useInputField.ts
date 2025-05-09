// lib
import { useState, useCallback } from 'react';

// type
import type { ChangeEventHandler } from 'react';

export const useInputField = (
  initialValue?: string
): { value: string; onChangeValue: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement> } => {
  const [value, setValue] = useState<string>(initialValue ?? '');

  const onChangeValue: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement> = useCallback(e => {
    setValue(e.target.value);
  }, []);

  return { value, onChangeValue };
};
