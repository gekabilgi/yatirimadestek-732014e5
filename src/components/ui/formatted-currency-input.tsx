import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { 
  formatCurrencyInput, 
  parseCurrencyInput, 
  calculateCursorPosition,
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
    const [lastCursorPosition, setLastCursorPosition] = React.useState<number>(0);

    // Combine refs
    React.useImperativeHandle(ref, () => inputRef.current!, []);

    // Initialize display value
    React.useEffect(() => {
      const numericValue = typeof value === 'string' ? parseFloat(value) || 0 : (value || 0);
      if (numericValue > 0) {
        setDisplayValue(formatCurrencyInput(numericValue));
      } else {
        setDisplayValue('');
      }
    }, [value]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const cursorPosition = e.target.selectionStart || 0;

      // Validate input - only allow digits, dots, and commas
      if (inputValue !== '' && !isValidCurrencyInput(inputValue)) {
        return;
      }

      // If input is empty, clear everything
      if (inputValue === '') {
        setDisplayValue('');
        onChange?.(0);
        onFormattedChange?.('');
        return;
      }

      // Parse the input to get numeric value
      const numericValue = parseCurrencyInput(inputValue);
      
      // Format the numeric value
      const formattedValue = formatCurrencyInput(numericValue);
      
      // Calculate new cursor position
      const newCursorPosition = calculateCursorPosition(
        displayValue,
        formattedValue,
        cursorPosition
      );

      // Update state
      setDisplayValue(formattedValue);
      setLastCursorPosition(newCursorPosition);
      
      // Call callbacks
      onChange?.(numericValue);
      onFormattedChange?.(formattedValue);
    };

    // Set cursor position after render
    React.useEffect(() => {
      if (inputRef.current && lastCursorPosition > 0) {
        requestAnimationFrame(() => {
          if (inputRef.current) {
            inputRef.current.setSelectionRange(lastCursorPosition, lastCursorPosition);
          }
        });
      }
    }, [displayValue, lastCursorPosition]);

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pastedText = e.clipboardData.getData('text');
      
      // Try to parse the pasted value
      const numericValue = parseCurrencyInput(pastedText);
      if (!isNaN(numericValue)) {
        const formattedValue = formatCurrencyInput(numericValue);
        setDisplayValue(formattedValue);
        onChange?.(numericValue);
        onFormattedChange?.(formattedValue);
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
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
        onPaste={handlePaste}
        onBlur={handleBlur}
        placeholder="0,00"
        className={cn(className)}
      />
    );
  }
);

FormattedCurrencyInput.displayName = "FormattedCurrencyInput";

export { FormattedCurrencyInput };