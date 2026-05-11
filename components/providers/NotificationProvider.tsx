'use client';

import { useNotifications } from '@/hooks/useNotifications';
import React from 'react';

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  // Hook khởi động lắng nghe real-time notification
  useNotifications();
  
  return <>{children}</>;
};
