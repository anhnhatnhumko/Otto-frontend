'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function VerifyEmailErrorContent() {
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get('email');

  const [email, setEmail] = useState(emailFromQuery || '');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResend = async () => {
    if (!email) {
      setMessage('Vui lòng nhập email');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/resend-verify-email`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setMessage(data?.message || 'Không thể gửi email');
        return;
      }

      setMessage('📩 Đã gửi lại email xác thực. Vui lòng kiểm tra hộp thư.');
    } catch {
      setMessage('Lỗi kết nối máy chủ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3">
      <h1 className="text-xl font-bold text-red-600">
        ❌ Xác thực email thất bại
      </h1>

      {!emailFromQuery && (
        <input
          className="border px-3 py-2 rounded w-72"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Nhập email"
          disabled={loading}
        />
      )}

      <button
        onClick={handleResend}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? 'Đang gửi...' : 'Gửi lại email xác thực'}
      </button>

      {message && (
        <p className="text-sm text-gray-700">{message}</p>
      )}
    </div>
  );
}

export default function VerifyEmailError() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Đang tải...</div>}>
      <VerifyEmailErrorContent />
    </Suspense>
  );
}
