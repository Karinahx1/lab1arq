import { useEffect, useRef } from 'react';
import { formatThousands } from './format.js';

// Input de moneda que se formatea con separador de miles mientras se escribe,
// preservando la posición del cursor en términos de dígitos (no de caracteres
// formateados), para que insertar o borrar en medio del número no lo desordene.
export function useCurrencyInput(digits, onDigitsChange) {
  const inputRef = useRef(null);
  const pendingCaretDigits = useRef(null);

  function handleChange(event) {
    const input = event.target;
    const caretPos = input.selectionStart ?? input.value.length;
    const digitsBeforeCaret = input.value.slice(0, caretPos).replace(/\D/g, '').length;
    const newDigits = input.value.replace(/\D/g, '');

    pendingCaretDigits.current = digitsBeforeCaret;
    onDigitsChange(newDigits);
  }

  useEffect(() => {
    if (pendingCaretDigits.current === null || !inputRef.current) return;
    const formatted = formatThousands(digits);
    const targetDigits = pendingCaretDigits.current;
    let digitsSeen = 0;
    let caretPos = formatted.length;
    if (targetDigits === 0) {
      caretPos = 0;
    } else {
      for (let i = 0; i < formatted.length; i += 1) {
        if (/\d/.test(formatted[i])) digitsSeen += 1;
        if (digitsSeen === targetDigits) {
          caretPos = i + 1;
          break;
        }
      }
    }
    inputRef.current.setSelectionRange(caretPos, caretPos);
    pendingCaretDigits.current = null;
  }, [digits]);

  return { inputRef, handleChange, displayValue: formatThousands(digits) };
}
