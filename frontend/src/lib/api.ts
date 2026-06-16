const PROD_API_URL = "https://pay-tracker-k856.onrender.com/api/v1";

export function getApiBaseUrl() {
  const configured = import.meta.env.VITE_API_URL || PROD_API_URL;

  if (typeof window === "undefined") {
    return configured;
  }

  const isLocalPage = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  const pointsToLocalApi =
    configured.includes("://localhost:") ||
    configured.includes("://127.0.0.1:");

  if (!isLocalPage && pointsToLocalApi) {
    return PROD_API_URL;
  }

  return configured;
}
