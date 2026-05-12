export const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL;

const isLocalUrl = (value: string) =>
  /^(https?:\/\/)?(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?(\/|$)/i.test(
    value,
  );

const splitUrlCandidates = (value: string) =>
  value
    .split(/[\s,]+/)
    .map((part) => part.trim())
    .filter(Boolean);

export const requireApiUrl = () => {
  const rawApiUrl = getApiUrl()?.trim();

  if (!rawApiUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }

  const candidates = splitUrlCandidates(rawApiUrl);

  for (const candidate of candidates) {
    const normalizedCandidate = candidate.replace(/\/+$/, "");

    if (/^https?:\/\//i.test(normalizedCandidate) && !isLocalUrl(normalizedCandidate)) {
      return normalizedCandidate;
    }
  }

  for (const candidate of candidates) {
    const normalizedCandidate = candidate.replace(/\/+$/, "");

    if (/^https?:\/\//i.test(normalizedCandidate)) {
      return normalizedCandidate;
    }

    if (!isLocalUrl(normalizedCandidate)) {
      return `https://${normalizedCandidate.replace(/^\/+/, "")}`;
    }
  }

  throw new Error(
    "NEXT_PUBLIC_API_URL must contain a valid deployed URL",
  );
};