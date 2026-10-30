import React from 'react';
import { Search } from 'lucide-react';
import { Input, type InputProps } from './Input';

export interface SearchInputProps extends Omit<InputProps, 'leadingIcon'> {
  onSearch?: (value: string) => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = 'Search...',
  onSearch,
  onChange,
  value,
  ...props
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) onChange(e);
    if (onSearch) onSearch(e.target.value);
  };

  return (
    <Input
      placeholder={placeholder}
      value={value}
      onChange={handleChange}
      leadingIcon={<Search size={16} />}
      {...props}
    />
  );
};
