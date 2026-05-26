import { useCallback, useState } from 'react';
import { OverdueOrderInfo } from '@/components/OverdueOrderPopup';

export const useOverdueOrder = () => {
  const [open, setOpen] = useState(false);
  const [overdueInfo, setOverdueInfo] = useState<OverdueOrderInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastPopupKey, setLastPopupKey] = useState<string | null>(null);

  const closePopupIfInvalid = useCallback((order: any) => {
    if (!open || !overdueInfo) return;

    const status = String(order.status ?? '').toUpperCase();

    // Close if not ASSIGNED anymore
    if (status !== 'ASSIGNED') {
      setOpen(false);
      setOverdueInfo(null);
      return;
    }
  }, [open, overdueInfo]);

  const showOverduePopup = useCallback((order: any) => {
    if (!order) return;

    const status = String(order.status ?? '').toUpperCase();
    // 🔥 ONLY SHOW POPUP WHEN STATUS IS ASSIGNED
    if (status !== 'ASSIGNED') return;

    const warningSignature = String(order.overdueWarningSentAt ?? '');
    const popupKey = `${order._id}:warning:${warningSignature}`;

    if (lastPopupKey === popupKey) return;

    const baseStartTime = order.startTime ?? order.scheduleTime;
    const scheduleTime = new Date(baseStartTime).getTime();
    const now = new Date().getTime();
    const overdueMinutes = Math.floor((now - scheduleTime) / (60 * 1000));

    const serviceName =
      order.service ??
      order.serviceName ??
      order.serviceSnapshot?.name ??
      'Dịch vụ';

    const appointmentDate =
      order.date ??
      (order.scheduleTime ? new Date(order.scheduleTime).toLocaleDateString('vi-VN') : '') ??
      (order.startTime ? new Date(order.startTime).toLocaleDateString('vi-VN') : '');

    const appointmentTime =
      order.time ??
      (order.startTime && order.endTime
        ? `${new Date(order.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${new Date(order.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
        : order.scheduleTime
          ? new Date(order.scheduleTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
          : '');

    const info: OverdueOrderInfo = {
      orderId: order._id,
      service: serviceName,
      date: appointmentDate,
      time: appointmentTime,
      address: order.address || '',
      taskerName: order.tasker?.name || 'Tasker',
      taskerRating: order.tasker?.rating || 0,
      overdueMinutes,
      popupType: 'warning',
    };

    setOverdueInfo(info);
    setOpen(true);
    setLastPopupKey(popupKey);
  }, [lastPopupKey]);

  const handleKeepOrder = useCallback(async (orderId: string) => {
    setLoading(true);
    try {
      if (overdueInfo?.popupType !== 'timeout') {
        setOpen(false);
        setOverdueInfo(null);
        return true;
      }

      const res = await fetch(`/api/orders/${orderId}/timeout-keep`, {
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
  }, [overdueInfo?.popupType]);

  const handleCancelOrder = useCallback(async (orderId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
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
  }, []);

  return {
    open,
    setOpen,
    overdueInfo,
    showOverduePopup,
    closePopupIfInvalid,
    handleKeepOrder,
    handleCancelOrder,
    loading,
  };
};
