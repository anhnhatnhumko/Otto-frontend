import { extractUserFacingErrorFromUnknown } from "./user-facing-error";

const OTP_EXPIRED_PATTERN = /(otp.*hết hạn|hết hạn.*otp|không còn hiệu lực)/i;
const OTP_INVALID_PATTERN = /(otp.*không hợp lệ|mã xác minh.*không đúng|sai mã otp)/i;

export function normalizeOtpErrorMessage(
  error: unknown,
  fallback: string,
) {
  return extractUserFacingErrorFromUnknown(error, fallback);
}

export function isExpiredOtpMessage(message: string) {
  return OTP_EXPIRED_PATTERN.test(String(message || ""));
}

export function isInvalidOtpMessage(message: string) {
  return OTP_INVALID_PATTERN.test(String(message || ""));
}
