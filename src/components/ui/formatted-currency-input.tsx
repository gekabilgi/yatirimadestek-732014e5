import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { 
  formatCurrencyInput, 
  parseCurrencyInput,
  isValidCurrencyInput 
} from "@/utils/currencyUtils";

interface FormattedCurrencyInputProps extends Omit<React.ComponentProps<"input">, "onChange" | "value"> {
  value?: number | string;
  onChange?: (value: number) => void;
  onFormattedChange?: (formattedValue: string) => void;
}

const FormattedCurrencyInput = React.forwardRef<HTMLInputElement, FormattedCurrencyInputProps>(
  ({ className, value = '', onChange, onFormattedChange, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [displayValue, setDisplayValue] = React.useState<string>('');
    const isTypingRef = React.useRef(false);

    // Combine refs
    React.useImperativeHandle(ref, () => inputRef.current!, []);

    // Initialize display value
    React.useEffect(() => {
      if (!isTypingRef.current) {
        const numericValue = typeof value === 'string' ? parseInt(value) || 0 : Math.floor(value || 0);
        if (numericValue > 0) {
          setDisplayValue(formatCurrencyInput(numericValue));
        } else {
          setDisplayValue('');
        }
      }
    }, [value]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      isTypingRef.current = true;
      const inputValue = e.target.value;
      
      // Validate input - only allow digits and dots
      if (inputValue !== '' && !isValidCurrencyInput(inputValue)) {
        isTypingRef.current = false;
        return;
      }

      // If input is empty, clear everything
      if (inputValue === '') {
        setDisplayValue('');
        onChange?.(0);
        onFormattedChange?.('');
        isTypingRef.current = false;
        return;
      }

      // Extract only digits to prevent cursor issues
      const digitsOnly = inputValue.replace(/\D/g, '');
      
      // Parse to get numeric value
      const numericValue = parseInt(digitsOnly) || 0;
      
      // Format the value
      const formattedValue = formatCurrencyInput(numericValue);
      
      // Store cursor position before update
      const cursorPos = e.target.selectionStart || 0;
      
      // Update display value
      setDisplayValue(formattedValue);
      
      // Call callbacks
      onChange?.(numericValue);
      onFormattedChange?.(formattedValue);

      // Set cursor to end after formatting to avoid jumping
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.setSelectionRange(formattedValue.length, formattedValue.length);
        }
        isTypingRef.current = false;
      }, 0);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow backspace, delete, arrow keys, tab, enter, and digits
      const allowedKeys = [8, 9, 13, 46, 37, 38, 39, 40]; // Backspace, Tab, Enter, Delete, Arrow keys
      const isDigit = e.keyCode >= 48 && e.keyCode <= 57; // 0-9
      const isNumpadDigit = e.keyCode >= 96 && e.keyCode <= 105; // Numpad 0-9
      
      // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
      if (e.ctrlKey && [65, 67, 86, 88].includes(e.keyCode)) {
        return;
      }
      
      // Allow special keys and digits
      if (!allowedKeys.includes(e.keyCode) && !isDigit && !isNumpadDigit) {
        e.preventDefault();
      }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pastedText = e.clipboardData.getData('text');
      
      // Extract only digits from pasted content
      const digitsOnly = pastedText.replace(/\D/g, '');
      const numericValue = parseInt(digitsOnly) || 0;
      
      if (numericValue > 0) {
        const formattedValue = formatCurrencyInput(numericValue);
        setDisplayValue(formattedValue);
        onChange?.(numericValue);
        onFormattedChange?.(formattedValue);
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      isTypingRef.current = false;
      
      // Ensure proper formatting on blur
      if (displayValue) {
        const numericValue = parseCurrencyInput(displayValue);
        const properlyFormatted = formatCurrencyInput(numericValue);
        if (properlyFormatted !== displayValue) {
          setDisplayValue(properlyFormatted);
          onFormattedChange?.(properlyFormatted);
        }
      }
      
      // Call original onBlur if provided
      props.onBlur?.(e);
    };

    return (
      <Input
        {...props}
        ref={inputRef}
        type="text"
        value={displayValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onBlur={handleBlur}
        placeholder="0"
        className={cn(className)}
      />
    );
  }
);

FormattedCurrencyInput.displayName = "FormattedCurrencyInput";

export { FormattedCurrencyInput };