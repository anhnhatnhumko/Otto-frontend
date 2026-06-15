import { extractUserFacingErrorMessage } from "./user-facing-error";

export async function apiPost<T>(
  path: string,
  body: unknown
): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let error: unknown = null;

    try {
      error = await res.json();
    } catch {
      error = await res.text().catch(() => "");
    }

    throw new Error(
      extractUserFacingErrorMessage(error, "Có lỗi xảy ra. Vui lòng thử lại."),
    );
  }

  return res.json();
}
