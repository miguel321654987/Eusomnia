import { useState } from "react";

function formatRecordedTime(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? null
    : new Intl.DateTimeFormat("es", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(date);
}

export const DreamAnalysisSection = ({
  emotions = [],
  symbols = [],
  synthesis,
  habitsReading,
  originalDream,
  recordedTime,
}) => {
  const [expandedSymbol, setExpandedSymbol] = useState(null);
  const timeLabel = formatRecordedTime(recordedTime);

  const toggleSymbol = (id) => {
    setExpandedSymbol((previous) => (previous === id ? null : id));
  };

  return (
    <div className="d-flex flex-column gap-4">
      <section className="eusomnia-card p-4 p-sm-5 shadow-lg d-flex flex-column gap-4">
        <div className="d-flex align-items-center gap-3">
          <div
            className="rounded-3 d-flex align-items-center justify-content-center p-2 flex-shrink-0"
            style={{
              width: "44px",
              height: "44px",
              background: "var(--eusomnia-surface-high)",
              color: "var(--eusomnia-primary)",
            }}
          >
            <span className="material-symbols-outlined fs-5">auto_stories</span>
          </div>
          <div>
            <h2 className="font-headline h5 fw-bold text-light mb-0">
              Interpretación del sueño
            </h2>
            <p className="font-body small text-secondary mb-0">
              Resultado guardado del análisis con IA
            </p>
          </div>
        </div>

        {emotions.length > 0 && (
          <div>
            <span
              className="font-label small fw-bold text-uppercase d-block mb-2"
              style={{ fontSize: "0.75rem", color: "var(--eusomnia-text-muted)" }}
            >
              Emociones identificadas
            </span>
            <div className="d-flex flex-wrap gap-2">
              {emotions.map((emotion, index) => (
                <span
                  key={`${emotion.label}-${index}`}
                  className="badge rounded-pill px-3 py-2 font-label small d-inline-flex align-items-center gap-2"
                  style={{
                    background:
                      index === 0
                        ? "rgba(0, 229, 255, 0.15)"
                        : "rgba(171, 201, 241, 0.18)",
                    color:
                      index === 0
                        ? "var(--eusomnia-primary)"
                        : "var(--eusomnia-secondary)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                  }}
                >
                  {emotion.emoji && <span>{emotion.emoji}</span>}
                  <span>{emotion.label}</span>
                  {emotion.pct !== undefined && emotion.pct !== null && (
                    <strong>{emotion.pct}%</strong>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}

        {symbols.length > 0 && (
          <div className="d-flex flex-column gap-2">
            <span
              className="font-label small fw-bold text-uppercase d-block mb-1"
              style={{ fontSize: "0.75rem", color: "var(--eusomnia-text-muted)" }}
            >
              Símbolos detectados
            </span>
            {symbols.map((symbol) => {
              const isExpanded = expandedSymbol === symbol.id;
              return (
                <div key={symbol.id} className="symbol-accordion-item">
                  <button
                    type="button"
                    className={`symbol-accordion-header ${isExpanded ? "expanded" : ""}`}
                    onClick={() => toggleSymbol(symbol.id)}
                    aria-expanded={isExpanded}
                  >
                    <div className="d-flex align-items-center gap-3">
                      {symbol.emoji && (
                        <span className="fs-4" aria-hidden="true">
                          {symbol.emoji}
                        </span>
                      )}
                      <div>
                        <div
                          className="font-headline small fw-bold"
                          style={{ color: "var(--eusomnia-primary)" }}
                        >
                          {symbol.title}
                        </div>
                        {symbol.archetype && (
                          <div className="font-body small text-secondary">
                            {symbol.archetype}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-secondary icon-toggle fs-5">
                      expand_more
                    </span>
                  </button>
                  {isExpanded && (
                    <div className="symbol-accordion-body font-body">
                      {symbol.content || "El análisis no incluyó más detalles para este símbolo."}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div
          className="p-3 p-sm-4 rounded-3 d-flex flex-column gap-2"
          style={{
            background: "rgba(34, 42, 58, 0.8)",
            border: "1px solid rgba(0, 229, 255, 0.2)",
          }}
        >
          <span
            className="font-label small fw-bold"
            style={{ color: "var(--eusomnia-primary)" }}
          >
            Síntesis del análisis
          </span>
          <p className="font-body small text-light mb-0" style={{ lineHeight: 1.6 }}>
            {synthesis || "El análisis todavía no contiene una interpretación."}
          </p>
          {habitsReading && (
            <p className="font-body small text-secondary mb-0" style={{ lineHeight: 1.6 }}>
              {habitsReading}
            </p>
          )}
        </div>
      </section>

      {originalDream && (
        <section className="eusomnia-card p-4 shadow-sm d-flex flex-column gap-2">
          <div className="d-flex align-items-center justify-content-between gap-2">
            <span
              className="font-label small fw-bold text-uppercase d-flex align-items-center gap-2"
              style={{ fontSize: "0.75rem", color: "var(--eusomnia-text-muted)" }}
            >
              <span className="material-symbols-outlined fs-6">record_voice_over</span>
              <span>Relato registrado</span>
            </span>
            {timeLabel && (
              <time
                className="font-label small"
                dateTime={recordedTime}
                style={{ color: "var(--eusomnia-secondary)", fontSize: "0.75rem" }}
              >
                {timeLabel}
              </time>
            )}
          </div>
          <blockquote
            className="p-3 rounded-3 font-body small fst-italic mb-0"
            style={{
              background: "rgba(6, 14, 29, 0.7)",
              color: "var(--eusomnia-text)",
              borderLeft: "3px solid var(--eusomnia-primary)",
              lineHeight: 1.6,
            }}
          >
            {originalDream}
          </blockquote>
        </section>
      )}
    </div>
  );
};
