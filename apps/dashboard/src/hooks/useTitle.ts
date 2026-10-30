import { useEffect } from 'react';
import { APP_CONFIG } from '../config/app.config';

export function useTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} | ${APP_CONFIG.name}` : APP_CONFIG.name;
  }, [title]);
}
