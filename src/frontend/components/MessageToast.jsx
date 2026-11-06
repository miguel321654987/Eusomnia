import { useEffect } from "react";
import useGlobalReducer from "../hooks/useGlobalReducer.jsx";

const TOAST_DURATION_MS = 3000;

/**
 * Resolve the visual severity using the explicit variant first and the HTTP
 * status as a fallback. Login sends "danger" explicitly for invalid
 * credentials, while expired sessions use "warning".
 */
const resolveVariant = (message) => {
  if (message?.variant) return message.variant;

  const status = Number(message?.status);
  if (status >= 200 && status < 300) return "success";
  if (status === 401 || status === 403) return "warning";
  if (status === 409) return "info";
  return "danger";
};

const getPalette = (variant) => {
  switch (variant) {
    case "success":
      return {
        background: "rgba(34, 197, 94, 0.94)",
        border: "#16a34a",
        foreground: "#ffffff",
        bar: "rgba(255, 255, 255, 0.92)",
      };
    case "warning":
      return {
        background: "rgba(234, 179, 8, 0.96)",
        border: "#ca8a04",
        foreground: "#171003",
        bar: "rgba(23, 16, 3, 0.72)",
      };
    case "info":
      return {
        background: "rgba(14, 165, 233, 0.94)",
        border: "#0284c7",
        foreground: "#ffffff",
        bar: "rgba(255, 255, 255, 0.92)",
      };
    case "danger":
    default:
      return {
        background: "rgba(239, 68, 68, 0.96)",
        border: "#dc2626",
        foreground: "#ffffff",
        bar: "rgba(255, 255, 255, 0.92)",
      };
  }
};

const MessageToast = () => {
  const { store, dispatch } = useGlobalReducer();
  const message = store.message;

  useEffect(() => {
    if (!message) return undefined;

    const timer = setTimeout(() => {
      dispatch({ type: "SET_MESSAGE", payload: null });
    }, TOAST_DURATION_MS);

    return () => clearTimeout(timer);
  }, [message, dispatch]);

  if (!message) return null;

  const variant = resolveVariant(message);
  const palette = getPalette(variant);

  return (
    <>
      <style>
        {`
        @keyframes eusomnia-toast-progress {
          from { transform: scaleX(1); }
          to { transform: scaleX(0); }
        }
        .eusomnia-toast-progress-bar {
          animation: eusomnia-toast-progress ${TOAST_DURATION_MS}ms linear forwards;
          will-change: transform;
        }
        `}
      </style>
      <div
        role="alert"
        aria-live="polite"
        style={{
          position: "fixed",
          top: "1rem",
          right: "1rem",
          zIndex: 1080,
          maxWidth: "22rem",
          width: "min(22rem, calc(100vw - 2rem))",
          borderRadius: "0.85rem",
          overflow: "hidden",
          boxShadow: "0 18px 40px rgba(0, 0, 0, 0.34)",
          backgroundColor: palette.background,
          border: `1px solid ${palette.border}`,
          color: palette.foreground,
        }}
      >
        <div
          style={{
            padding: "0.85rem 1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.7rem",
          }}
        >
          {/* A tiny colored dot avoids external icon fonts/glyphs that can render
              as empty squares on some systems. */}
          <span
            aria-hidden="true"
            style={{
              flexShrink: 0,
              width: "0.7rem",
              height: "0.7rem",
              borderRadius: "999px",
              backgroundColor: palette.bar,
            }}
          />

          <p
            style={{
              flex: 1,
              margin: 0,
              fontSize: "0.95rem",
              fontWeight: 600,
              lineHeight: 1.35,
            }}
          >
            {message.msg}
          </p>

          <button
            type="button"
            aria-label="Cerrar notificación"
            onClick={() =>
              dispatch({ type: "SET_MESSAGE", payload: null })
            }
            style={{
              flexShrink: 0,
              border: "none",
              background: "transparent",
              color: "inherit",
              fontSize: "1.35rem",
              lineHeight: 1,
              cursor: "pointer",
              opacity: 0.85,
            }}
          >
            ×
          </button>
        </div>

        <div
          aria-hidden="true"
          style={{
            height: "5px",
            width: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.16)",
          }}
        >
          <div
            className="eusomnia-toast-progress-bar"
            style={{
              height: "100%",
              width: "100%",
              backgroundColor: palette.bar,
              transformOrigin: "left center",
            }}
          />
        </div>
      </div>
    </>
  );
};

export default MessageToast;
