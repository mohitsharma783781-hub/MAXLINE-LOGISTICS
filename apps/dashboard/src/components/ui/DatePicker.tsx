import React from 'react';
import { Calendar } from 'lucide-react';
import { Input, type InputProps } from './Input';

export interface DatePickerProps extends Omit<InputProps, 'type' | 'trailingIcon'> {
  minDate?: string;
  maxDate?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  minDate,
  maxDate,
  ...props
}) => {
  return (
    <Input
      type="date"
      min={minDate}
      max={maxDate}
      trailingIcon={<Calendar size={16} />}
      {...props}
    />
  );
};
