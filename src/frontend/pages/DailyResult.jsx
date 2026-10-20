/**
 * Página que muestra la interpretación del día, emociones, badges y recomendaciones.
 * Por ahora muestra contenido estático como placeholder.
 */
export const DailyResult = () => {
  return (
    <div className="container mt-4">
      <h2>Resultado del Día</h2>
      <p>Aquí aparecerá la interpretación de tus hábitos y sueño del día.</p>
      {/* Badges placeholder */}
      <div className="mt-3">
        <span className="badge bg-success me-2">Buen descanso</span>
        <span className="badge bg-warning text-dark">Hidratación</span>
      </div>
      <div className="mt-4">
        <h4>Recomendaciones</h4>
        <ul>
          <li>Mantén una rutina de sueño regular.</li>
          <li>Bebe al menos 2 litros de agua al día.</li>
        </ul>
      </div>
    </div>
  );
};
