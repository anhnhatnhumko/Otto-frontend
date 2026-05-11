export const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL;

export const requireApiUrl = () => {
  const rawApiUrl = getApiUrl()?.trim();

  if (!rawApiUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }

  if (rawApiUrl.includes(",")) {
    throw new Error(
      "NEXT_PUBLIC_API_URL must be a single URL (remove commas/multiple values)",
    );
  }

  const noTrailingSlash = rawApiUrl.replace(/\/+$/, "");

  if (/^https?:\/\//i.test(noTrailingSlash)) {
    return noTrailingSlash;
  }

  const withoutLeadingSlash = noTrailingSlash.replace(/^\/+/, "");
  return `https://${withoutLeadingSlash}`;
};