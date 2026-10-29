const configuredBackendUrl = import.meta.env.VITE_BACKEND_URL?.replace(
  /\/+$/,
  "",
);

export const apiUrl = (path) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const backendUrl = import.meta.env.DEV ? "" : configuredBackendUrl || "";
  return `${backendUrl}${normalizedPath}`;
};
