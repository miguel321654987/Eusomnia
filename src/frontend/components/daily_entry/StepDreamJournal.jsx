import { useState, useEffect, useRef } from "react";

export const StepDreamJournal = ({
  narrative,
  onChangeNarrative,
  onBack,
  onSaveDraft,
  onSubmit,
  isSubmitting,
  submitLabel = "Guardar y Analizar con IA",
  submitProgressLabel = "Procesando con IA...",
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);

  // Initialize Web Speech API if supported
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "es-ES";

      recognition.onresult = (event) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript.trim()) {
          onChangeNarrative(
            (prev) => (prev ? `${prev} ${transcript}` : transcript).trim()
          );
        }
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, [onChangeNarrative]);

  const toggleVoiceRecording = () => {
    if (!recognitionRef.current) {
      // Fallback if browser doesn't support Web Speech API
      const sampleText =
        "Esta noche soñé que volaba sobre rascacielos iluminados en una ciudad silenciosa y sin gravedad.";
      onChangeNarrative(
        narrative ? `${narrative} ${sampleText}` : sampleText
      );
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch {
        setIsRecording(false);
      }
    }
  };

  const handleInsertPrompt = (promptText) => {
    const textToInsert = narrative
      ? `${narrative}\n• ${promptText}: `
      : `• ${promptText}: `;
    onChangeNarrative(textToInsert);
  };

  const wordCount = narrative
    ? narrative.trim().split(/\s+/).filter(Boolean).length
    : 0;

  return (
    <section className="eusomnia-card p-4 p-sm-5 shadow-lg position-relative">
      {/* Header */}
      <div className="d-flex align-items-start justify-content-between gap-3 mb-4">
        <div>
          <span
            className="font-label small fw-bold text-uppercase tracking-wider"
            style={{ color: "var(--eusomnia-primary)" }}
          >
            Paso 5 de 5 · Onirismo &amp; Neuroanálisis
          </span>
          <h2 className="font-headline h4 fw-bold text-light mt-1 mb-1">
            Relato del Sueño
          </h2>
          <p className="font-body text-secondary small mb-0">
            Graba por voz o redacta tus impresiones antes de que se desvanezcan en la memoria operativa.
          </p>
        </div>
        <div
          className="rounded-3 d-flex align-items-center justify-content-center p-2 flex-shrink-0"
          style={{ background: "var(--eusomnia-surface-high)", color: "var(--eusomnia-primary)" }}
        >
          <span className="material-symbols-outlined fs-4">auto_awesome</span>
        </div>
      </div>

      {/* Voice Dictation Card */}
      <div
        className="p-3 p-sm-4 rounded-3 mb-4 d-flex flex-column flex-sm-row align-items-center justify-content-between gap-3"
        style={{
          background: "var(--eusomnia-surface)",
          border: isRecording
            ? "1px solid rgba(255, 80, 80, 0.4)"
            : "1px solid rgba(0, 229, 255, 0.2)",
        }}
      >
        <div className="d-flex align-items-center gap-3">
          <div
            className={`rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 ${
              isRecording ? "pulse-recording" : ""
            }`}
            style={{
              width: "48px",
              height: "48px",
              background: isRecording
                ? "rgba(255, 80, 80, 0.2)"
                : "rgba(0, 229, 255, 0.15)",
              color: isRecording ? "#ff5050" : "var(--eusomnia-primary)",
            }}
          >
            <span className="material-symbols-outlined fs-4">
              {isRecording ? "graphic_eq" : "mic"}
            </span>
          </div>

          <div>
            <span className="font-headline small fw-bold text-light d-block">
              {isRecording ? "Escuchando tu relato..." : "Dictado por Voz Matutino"}
            </span>
            <span className="font-body small text-secondary">
              {isRecording
                ? "Habla con calma, se transcribirá en tiempo real"
                : "Ideal para registrar con los ojos semicerrados"}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-sm px-4 py-2 rounded-pill font-label d-inline-flex align-items-center gap-2"
          style={{
            background: isRecording ? "#ff5050" : "var(--eusomnia-surface-high)",
            color: isRecording ? "#ffffff" : "var(--eusomnia-text)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
          onClick={toggleVoiceRecording}
        >
          <span
            className="material-symbols-outlined fs-6"
            style={{ color: isRecording ? "#ffffff" : "var(--eusomnia-primary)" }}
          >
            {isRecording ? "stop" : "mic"}
          </span>
          <span>{isRecording ? "Detener dictado" : "Iniciar dictado"}</span>
        </button>
      </div>

      {/* Guided Suggestions Chips */}
      <div className="mb-2">
        <div className="d-flex align-items-center gap-2 overflow-x-auto pb-2">
          <span className="font-label small fw-bold flex-shrink-0" style={{ color: "var(--eusomnia-primary)", fontSize: "0.78rem" }}>
            Sugerencias:
          </span>
          <button
            type="button"
            className="btn btn-sm btn-eusomnia-secondary py-1 px-2.5 rounded-3 font-label text-nowrap"
            style={{ fontSize: "0.75rem" }}
            onClick={() => handleInsertPrompt("¿Dónde te encontrabas exactamente?")}
          >
            📍 ¿Dónde estabas?
          </button>
          <button
            type="button"
            className="btn btn-sm btn-eusomnia-secondary py-1 px-2.5 rounded-3 font-label text-nowrap"
            style={{ fontSize: "0.75rem" }}
            onClick={() => handleInsertPrompt("¿Qué emoción predominaba?")}
          >
            💭 Emoción predominante
          </button>
          <button
            type="button"
            className="btn btn-sm btn-eusomnia-secondary py-1 px-2.5 rounded-3 font-label text-nowrap"
            style={{ fontSize: "0.75rem" }}
            onClick={() => handleInsertPrompt("¿Personajes o símbolos clave?")}
          >
            👤 Personajes / Símbolos
          </button>
        </div>
      </div>

      {/* Textarea */}
      <div className="position-relative mb-4">
        <textarea
          className="form-control text-light font-body"
          rows={6}
          placeholder="Esta noche soñé que caminaba por un bosque bioluminiscente con senderos de cristal templado..."
          value={narrative}
          onChange={(e) => onChangeNarrative(e.target.value)}
          style={{
            backgroundColor: "var(--eusomnia-surface-lowest)",
            border: "1px solid rgba(0, 229, 255, 0.2)",
            borderRadius: "0.85rem",
            padding: "1rem",
            fontSize: "0.95rem",
            resize: "vertical",
          }}
        />
        <div
          className="position-absolute bottom-0 end-0 p-3 font-label small"
          style={{ color: "var(--eusomnia-text-muted)", fontSize: "0.75rem", pointerEvents: "none" }}
        >
          <span>{wordCount} palabras</span>
        </div>
      </div>

      {/* Submission Cluster */}
      <div className="d-flex flex-column flex-sm-row align-items-center justify-content-between gap-3 pt-2 border-top border-secondary border-opacity-10">
        <button
          type="button"
          className="btn btn-eusomnia-secondary px-3 py-2 d-inline-flex align-items-center gap-2 align-self-start align-self-sm-auto"
          onClick={onBack}
          disabled={isSubmitting}
        >
          <span className="material-symbols-outlined fs-6">arrow_back</span>
          <span>Atrás</span>
        </button>

        <div className="d-flex align-items-center gap-3 w-100 w-sm-auto justify-content-end">
          <button
            type="button"
            className="btn btn-eusomnia-secondary px-3 py-2 flex-grow-1 flex-sm-grow-0"
            onClick={onSaveDraft}
            disabled={isSubmitting}
          >
            Guardar borrador
          </button>

          <button
            type="button"
            className="btn btn-primary px-4 py-2 d-inline-flex align-items-center justify-content-center gap-2 flex-grow-1 flex-sm-grow-0"
            onClick={onSubmit}
            disabled={isSubmitting || !narrative.trim()}
          >
            {isSubmitting ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                <span>{submitProgressLabel}</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined fs-5">auto_awesome</span>
                <span>{submitLabel}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
};
