type ErrorPayload = {
  message?: unknown;
  error?: unknown;
  statusCode?: unknown;
};

function tryParseJsonString(value: string) {
  const text = value.trim();

  if (!text || (!text.startsWith("{") && !text.startsWith("["))) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function normalizeMessageValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeMessageValue(item))
      .filter(Boolean)
      .join(", ");
  }

  if (typeof value === "string") {
    const parsed = tryParseJsonString(value);
    if (parsed) {
      return normalizeMessageValue(parsed);
    }

    return value.trim();
  }

  if (value && typeof value === "object") {
    const payload = value as ErrorPayload;

    if (payload.message !== undefined) {
      return normalizeMessageValue(payload.message);
    }
  }

  return "";
}

export function extractUserFacingErrorMessage(
  payload: unknown,
  fallback = "Có lỗi xảy ra. Vui lòng thử lại.",
) {
  const message = normalizeMessageValue(payload);
  return message || fallback;
}

export function extractUserFacingErrorFromUnknown(
  error: unknown,
  fallback = "Có lỗi xảy ra. Vui lòng thử lại.",
) {
  if (error instanceof Error) {
    return extractUserFacingErrorMessage(error.message, fallback);
  }

  return extractUserFacingErrorMessage(error, fallback);
}
