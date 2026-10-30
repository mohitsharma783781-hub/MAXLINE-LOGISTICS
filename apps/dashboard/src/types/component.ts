import React from 'react';

export type ComponentSize = 'sm' | 'md' | 'lg';

export type ComponentVariant = 
  | 'primary' 
  | 'secondary' 
  | 'outline' 
  | 'ghost' 
  | 'danger' 
  | 'success' 
  | 'warning' 
  | 'info'
  | 'brand'
  | 'link';

export type StatusType = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'brand';

export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
  id?: string;
  style?: React.CSSProperties;
}
