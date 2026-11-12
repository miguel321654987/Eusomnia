const rawBackendUrl = import.meta.env.VITE_BACKEND_URL?.trim().replace(/\/+$/, "");

const normalizeBackendUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return `https://${url}`;
};

const configuredBackendUrl = normalizeBackendUrl(rawBackendUrl);

export const apiUrl = (path) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const backendUrl = import.meta.env.DEV ? "" : configuredBackendUrl;

  return `${backendUrl}${normalizedPath}`;
};
