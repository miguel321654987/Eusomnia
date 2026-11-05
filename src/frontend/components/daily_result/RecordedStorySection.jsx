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

export const RecordedStorySection = ({ originalDream, recordedTime }) => {
  if (!originalDream) {
    return null;
  }

  const timeLabel = formatRecordedTime(recordedTime);

  return (
    <section
      className="eusomnia-card p-4 p-sm-5 shadow-sm d-flex flex-column gap-3 w-100 h-100"
      style={{ minWidth: 0 }}
    >
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2">
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
          overflowWrap: "anywhere",
          wordBreak: "break-word",
          whiteSpace: "pre-wrap",
        }}
      >
        {originalDream}
      </blockquote>
    </section>
  );
};

export default RecordedStorySection;