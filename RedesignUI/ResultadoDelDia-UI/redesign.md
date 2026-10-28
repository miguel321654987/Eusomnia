# 🌙 Plan de Implementación: Rediseño Modular de Resultado del Día (Eusomnia)

## Descripción del Objetivo

Implementar y rediseñar la vista **Resultado del Día** (`/resultado-del-dia`) siguiendo fielmente el sistema de diseño **"Nocturne Synapse"** exportado de Stitch (`DESIGN (3).md`, `code (3).html` y `screen (3).png`).
Esta vista actúa como el **HUD clínico y psicofisiológico** de Eusomnia, donde la IA decodifica de forma unificada la causa biológica y nutricional de la noche anterior (hábitos, digestión, latencia) y el significado simbólico de la narrativa onírica registrada (arquetipos, valencia emocional, consolidación REM).

---

## Revisión de Usuario Requerida

> [!IMPORTANT]
>
> - **Ruta en el Enrutador:** Se registrará la ruta `/resultado-del-dia` dentro de `src/frontend/routes.jsx` bajo el `<Layout />` general, garantizando el acceso fluido desde el Navbar, los enlaces de la Bitácora de Home y la pantalla de éxito de Registro Diario.
> - **Estrategia de Datos Híbrida:** Si existe un registro reciente en el backend o en el estado de la sesión, se cargan sus datos; en caso contrario (o si se accede en modo demo/visitante), se presentan de manera visual e interactiva los datos de referencia clínica de Stitch (sesión del 28 de Octubre, sueño del avión y la ciudad), permitiendo probar la micro-interacción de re-análisis con IA.
> - **Estilos y Tecnologías:** Se respetan los principios acordados: uso de Bootstrap 5 con clases utilitarias personalizadas en `Index.css`, sin dependencias añadidas ni Tailwind.

---

## Preguntas Abiertas

_No existen preguntas bloqueantes tras la fase de entrevistas `/grill-me`._

---

## 🏛️ Mapeo de Secciones y Datos con `src/api`

| Módulo Visual                                      | Componente                     | Origen de Datos en `src/api`                                                                               | Descripción Funcional                                                                                                                                                                                                                                                                                    |
| :------------------------------------------------- | :----------------------------- | :--------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Barra Superior & Telemetría**                    | `TelemetryHeader.jsx`          | `daily_entries_bp` / `analysis_bp`                                                                         | Fecha, badge _Motor IA Unificado v2.4 Activo_, ID de sesión, botón _Re-analizar con IA_, _Modificar / Siesta_ y _Exportar Reporte_.                                                                                                                                                                      |
| **HUD de 3 Indicadores**                           | `SomnolenceGauges.jsx`         | Calculado / IA                                                                                             | • Dial circular de Eficiencia de Sueño (84%).<br>• Barra de Carga Excitante Residual (35% - 95mg cafeína).<br>• Gráfico de Intensidad Onírica REM (72% - 3 fases).                                                                                                                                       |
| **Banner de Alerta Crítica**                       | `HygienicAlertBanner.jsx`      | `SleepAnalysis.alerts`                                                                                     | Alerta somática sobre ingesta tardía (cafeína/azúcares) y micro-fragmentación a las 03:42h.                                                                                                                                                                                                              |
| **Decodificación Onírica (Columna Izquierda)**     | `DreamAnalysisSection.jsx`     | `SleepAnalysis.interpretation`<br>`SleepAnalysis.predominant_emotions`<br>`SleepAnalysis.detected_symbols` | • Espectro afectivo dominante (Libertad 80%, Alegría 65%, Nostalgia 25%).<br>• Acordeón interactivo de símbolos oníricos (Avión, Música, Azotea/Cine).<br>• Síntesis psiconeurológica con toggle de enfoque Jung/Freud.<br>• Transcripción del relato original y tags indexados.                         |
| **Correlaciones y Prescripción (Columna Derecha)** | `HabitCorrelationsSection.jsx` | `HabitLog`<br>`NutritionLog`<br>`SleepAnalysis.recommendations`                                            | • Comparativa de latencia de inicio (16 min promedio vs 28 min noche actual).<br>• Cuadrícula nutricional Edamam (Calorías, Grasas Omega-3, Proteínas, Carbos/Pico glucémico, Micronutrientes).<br>• Contexto previo (actividad, pantallas, ánimo).<br>• 3 Prescripciones numeradas de higiene nocturna. |

---

## 📦 Estructura de Componentes Propuesta

```
src/frontend/
├── pages/
│   └── ResultadoDelDia.jsx          <-- Orquestador principal, estado de reanálisis y datos
└── components/
    └── daily_result/
        ├── TelemetryHeader.jsx      <-- Barra superior, metadatos y botones de acción
        ├── SomnolenceGauges.jsx     <-- 3 Medidores HUD (Eficiencia, Excitantes, REM)
        ├── HygienicAlertBanner.jsx  <-- Banner de alerta digestiva y disrupción de latencia
        ├── DreamAnalysisSection.jsx <-- Acordeón de símbolos, espectro afectivo y relato original
        └── HabitCorrelationsSection.jsx <-- Latencia, telemetría Edamam y 3 prescripciones
```

---

## Cambios Propuestos

### 1. Estilos Específicos para Resultado del Día

#### [MODIFY] `src/frontend/Index.css`

- Clases para medidores y gráficos:
  - `.gauge-circular-container`: Estilos para el dial circular SVG.
  - `.rem-bar-chart`: Mini barras estilizadas para la densidad REM.
  - `.symbol-accordion-header`: Botón del acordeón con transición suave de rotación de icono.
  - `.prescription-badge-number`: Círculo numerado en cian (`#00e5ff`) con contraste clínico.

---

### 2. Componentes Modulares

#### [NEW] `src/frontend/components/daily_result/TelemetryHeader.jsx`

- Contenedor translúcido con icono de neurología.
- Metadatos de fecha y sesión (`#EOS-9942`).
- Acciones:
  - Botón _"Re-analizar con IA"_ con animación de procesamiento de red neuronal.
  - Botón _"Modificar / Siesta"_ vinculado mediante `<Link to="/registro-diario">`.
  - Botón _"Exportar Reporte"_ ejecutando `window.print()`.

#### [NEW] `src/frontend/components/daily_result/SomnolenceGauges.jsx`

- Rejilla de 3 columnas responsivas:
  - Medidor 1: Eficiencia (84%) con dial SVG circular y badge de sincronización circadiana.
  - Medidor 2: Carga de excitantes (35%) con barra de degradado y aviso de 95mg de cafeína.
  - Medidor 3: Intensidad REM (72%) con mini gráfica de barras nocturna.

#### [NEW] `src/frontend/components/daily_result/HygienicAlertBanner.jsx`

- Banner ámbar con icono `warning`, detalle de la disrupción somática a las 03:42h y desglose del estresor metabólico.

#### [NEW] `src/frontend/components/daily_result/DreamAnalysisSection.jsx`

- Columna izquierda (7 columnas en desktop):
  - Chips del espectro afectivo (Libertad, Alegría, Nostalgia).
  - Acordeón interactivo con estado local de React para expandir y contraer los 3 símbolos detectados (✈️ Avión, 🎵 Música, 🏙️ Azotea/Cine).
  - Bloque de síntesis psiconeurológica con botón para alternar perspectiva analítica (Jung/Freud).
  - Cita del relato original transcrito a las 07:15 AM con hashtags indexados (`#vuelo`, `#ciudad`, `#cine`, `#social`).

#### [NEW] `src/frontend/components/daily_result/HabitCorrelationsSection.jsx`

- Columna derecha (5 columnas en desktop):
  - Barra comparativa de latencia de conciliación (16 min habitual vs 28 min noche actual).
  - 4 micro-tarjetas biométricas de Edamam: Calorías (456.7 kcal), Grasas (15.31g), Proteínas (24.13g) y Carbohidratos (59.9g / 21g).
  - Fila de micronutrientes (Sodio, Vit. B12, Vit. E).
  - Resumen contextual previo (Actividad Media, Pantallas < 1h, Ánimo Relajado, Alcohol 0.0g).
  - Lista de 3 Prescripciones Clínicas numeradas de higiene del sueño.

---

### 3. Página Principal y Rutas

#### [NEW] `src/frontend/pages/ResultadoDelDia.jsx`

- Orquestador desacoplado (< 90 líneas).
- Consume `useGlobalReducer()` para contextualizar la sesión y orquesta los 5 subcomponentes.
- Maneja el estado de reanálisis interactivo.

#### [MODIFY] `src/frontend/routes.jsx`

- Importar `ResultadoDelDia` y registrar `<Route path="/resultado-del-dia" element={<ResultadoDelDia />} />`.

---

## Plan de Verificación

### Pruebas Automatizadas y de Compilación

```bash
npm run build
npx eslint src/frontend/pages/ResultadoDelDia.jsx src/frontend/components/daily_result
```

- Verificar compilación en 0 errores y linting sin advertencias.

### Verificación Manual

1. **Renderizado Visual:** Comprobar que los 3 medidores HUD, el banner ámbar y la división en 2 columnas (7 y 5) replican la estética de Stitch.
2. **Interactividad del Acordeón:** Hacer clic en cada símbolo onírico para verificar que se expande y colapsa suavemente con rotación del icono.
3. **Reanálisis con IA:** Pulsar el botón _"Re-analizar con IA"_ y confirmar que se muestra el spinner temporal y se revalida el contenido.
4. **Navegación:** Comprobar que _"Modificar / Siesta"_ redirige a `/registro-diario`.
5. **Exportación:** Pulsar _"Exportar Reporte"_ y validar que se active la ventana de impresión/guardado en PDF del navegador.
