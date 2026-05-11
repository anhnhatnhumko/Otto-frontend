export const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL;

export const requireApiUrl = () => {
  const apiUrl = getApiUrl();

  if (!apiUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }

  return apiUrl;
};