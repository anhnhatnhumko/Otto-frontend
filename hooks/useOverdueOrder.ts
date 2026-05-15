import { useCallback, useState } from 'react';
import { requireApiUrl } from '@/lib/api-url';
import { OverdueOrderInfo } from '@/components/OverdueOrderPopup';

export const useOverdueOrder = () => {
  const [open, setOpen] = useState(false);
  const [overdueInfo, setOverdueInfo] = useState<OverdueOrderInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const API_URL = requireApiUrl();

  const showOverduePopup = useCallback((order: any) => {
    if (!order || order.status !== 'TIMEOUT') return;

    const scheduleTime = new Date(order.scheduleTime).getTime();
    const now = new Date().getTime();
    const overdueMinutes = Math.floor((now - scheduleTime) / (60 * 1000));

    const info: OverdueOrderInfo = {
      orderId: order._id,
      service: order.serviceSnapshot?.name || 'Dịch vụ',
      date: order.scheduleTime ? new Date(order.scheduleTime).toLocaleDateString('vi-VN') : '',
      time: order.scheduleTime ? new Date(order.scheduleTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '',
      address: order.address || '',
      taskerName: order.tasker?.name || 'Tasker',
      taskerRating: order.tasker?.rating || 0,
      overdueMinutes,
    };

    setOverdueInfo(info);
    setOpen(true);
  }, []);

  const handleKeepOrder = useCallback(async (orderId: string) => {
    setLoading(true);
    try {
      // Đơn đã TIMEOUT, tasker cần nhận lại hoặc customer giữ nó
      // Có thể chuyển sang IN_PROGRESS hoặc ASSIGNED lại
      const res = await fetch(`${API_URL}/orders/${orderId}/timeout-keep`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Không thể giữ đơn');
      }

      setOpen(false);
      setOverdueInfo(null);
      return true;
    } catch (error) {
      console.error('Failed to keep order:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  const handleCancelOrder = useCallback(async (orderId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/orders/${orderId}/cancel`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Không thể hủy đơn');
      }

      setOpen(false);
      setOverdueInfo(null);
      return true;
    } catch (error) {
      console.error('Failed to cancel order:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  return {
    open,
    setOpen,
    overdueInfo,
    showOverduePopup,
    handleKeepOrder,
    handleCancelOrder,
    loading,
  };
};
