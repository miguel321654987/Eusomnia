# 🌙 Plan de Implementación: Rediseño Modular de Registro Diario (Eusomnia)

## Descripción del Objetivo

Implementar la vista interactiva **Registro Diario** (`/registro-diario`) siguiendo el diseño de Stitch (`DESIGN (2).md`, `code (2).html` y `screen (2).png`).
La vista está concebida como un **protocolo matutino guiado y calmante** con un diseño intermedio entre un _Wizard de escritorio_ y un _Flujo conversacional/progresivo móvil_. Se conectará con el endpoint del backend `POST /api/daily_entries` para registrar de manera unificada los hábitos somáticos (`HabitLog`), crononutrición y el relato onírico (`SleepReport`), con soporte para dictado por voz y pantalla de éxito.

---

## Revisión de Usuario Requerida

> [!IMPORTANT]
>
> - **Ruta en el Enrutador:** Se registrará la ruta `/registro-diario` dentro de `src/frontend/routes.jsx` bajo el `<Layout />` principal para que sea accesible desde la navegación del Navbar y los CTAs del Home.
> - **Autenticación y Sesión:** El endpoint `POST /api/daily_entries` en el backend requiere autenticación JWT (`@jwt_required()`). Si el usuario navega como invitado (no logueado), el formulario permitirá interactuar fluidamente y guardará en almacenamiento local (o mostrará el modal `#loginModal` al enviar), garantizando una experiencia de usuario sin bloqueos técnicos.
> - **Interacción Híbrida Web/Móvil:** Al tocar tarjetas de opción única (Paso 1: Actividad, Paso 2: Calidad de descanso), la opción se ilumina y avanza al siguiente paso con una animación suave de 300ms, manteniendo los botones "Atrás" y "Siguiente" para los usuarios de escritorio.

---

## Preguntas Abiertas

_No quedan preguntas bloqueantes tras completar la fase de entrevistas `/grill-me`._

---

## 🏛️ Mapeo de Datos con el Backend (`src/api`)

| Paso del Wizard               | Campo en Interfaz Stitch                                                                                                                                       | Modelo SQLAlchemy (`src/api`)                                                            | Parámetro en Payload JSON                                                           |
| :---------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------- |
| **Paso 1: Actividad Física**  | Selección de nivel (Sedentario, Baja, Media, Alta)                                                                                                             | `HabitLog.physical_activity`                                                             | `body.habits.physical_activity`                                                     |
| **Paso 2: Higiene del Sueño** | • Horas de sueño (Dial `3.0` a `14.0`)<br>• Calidad de descanso (Profundo, Intermedio, Fragmentado, Insomnio)<br>• Pantallas previas (`0 min`, `< 1h`, `> 2h`) | • `HabitLog.bedtime_mood`<br>• `HabitLog.screen_time`<br>• `HabitLog.food_notes` (horas) | `body.habits.bedtime_mood`<br>`body.habits.screen_time`<br>`body.habits.food_notes` |
| **Paso 3: Incidencias**       | Multi-selección de sucesos (Estrés, Conflicto, Día neutro, etc.)                                                                                               | `HabitLog.incidents`                                                                     | `body.habits.incidents` (unidos por coma o JSON)                                    |
| **Paso 4: Crononutrición**    | Multi-selección de hábitos (Cena ligera/pesada, Cafeína, Alcohol, Infusión)                                                                                    | `HabitLog.dinner_type`                                                                   | `body.habits.dinner_type`                                                           |
| **Paso 5: Relato del Sueño**  | • Dictado por voz / Textarea de narrativa onírica<br>• Sugerencias rápidas de preguntas guía                                                                   | `SleepReport.raw_text`<br>`SleepReport.final_text`                                       | `body.sleep.raw_text`<br>`body.sleep.final_text`                                    |

---

## 📦 Estructura de Componentes Propuesta

```
src/frontend/
├── pages/
│   └── RegistroDiario.jsx           <-- Orquestador de estado, transición de pasos y envío API
└── components/
    └── daily_entry/
        ├── StepperHeader.jsx        <-- Barra de progreso superior y chips de pasos
        ├── SummaryCapsules.jsx      <-- Cápsulas colapsadas de pasos completados con botón 'Editar'
        ├── StepActivity.jsx         <-- Paso 1: Chips de actividad física de ayer
        ├── StepSleepHygiene.jsx     <-- Paso 2: Dial de horas + calidad + exposición a pantallas
        ├── StepIncidents.jsx        <-- Paso 3: Multi-chips de incidencias biopsicosociales
        ├── StepNutrition.jsx        <-- Paso 4: Multi-chips de crononutrición y agentes excitantes
        ├── StepDreamJournal.jsx     <-- Paso 5: Grabación por voz + prompts guía + textarea onírico
        └── SuccessScreen.jsx        <-- Pantalla de confirmación y resumen biométrico
```

---

## Cambios Propuestos

### 1. Estilos Específicos para Registro Diario

#### [MODIFY] `src/frontend/Index.css`

- Añadir utilidades de animación y chips interactivos:
  - `.daily-option-chip`: Tarjeta interactiva con borde translúcido y efecto activo en cian bioluminiscente.
  - `.daily-multichip`: Píldora multi-selección con icono de verificación dinámico.
  - `.stepper-progress-fill`: Animación fluida de la barra de progreso (anchura porcentual con `transition: width 0.4s ease`).
  - `.pulse-recording`: Animación pulsante para el botón de micrófono en dictado por voz.

---

### 2. Componentes del Wizard Modular

#### [NEW] `src/frontend/components/daily_entry/StepperHeader.jsx`

- Muestra el badge "Protocolo Matutino Guiado", el título, el contador `Paso X de 5`, el tiempo estimado `~2 min` y el porcentaje.
- Barra de progreso interactiva con botones de salto directo a pasos ya visitados.

#### [NEW] `src/frontend/components/daily_entry/SummaryCapsules.jsx`

- Resumen en acordeón/cápsula de los pasos completados (`Paso 1`, `Paso 2`, `Paso 3`, `Paso 4`).
- Muestra el valor seleccionado con botón "Editar" para regresar a dicho paso.
- En móvil, se adapta de forma compacta para no saturar la pantalla ni desplazar el paso activo.

#### [NEW] `src/frontend/components/daily_entry/StepActivity.jsx`

- 4 tarjetas grandes de selección de actividad física: Sedentario, Baja, Media, Alta.
- Selección asistida (clic/touch resalta y avanza automáticamente al paso 2 tras 300ms) + botón de avance manual.

#### [NEW] `src/frontend/components/daily_entry/StepSleepHygiene.jsx`

- Dial selector de horas totales de sueño (decremento/incremento de `0.5h` entre `3.0h` y `14.0h`).
- 4 tarjetas táctiles de calidad subjetiva del descanso: Profundo (⚡️), Intermedio (🌱), Fragmentado (🌊), Insomnio (🌪️).
- 3 opciones de exposición a pantallas previas (< 1h, > 2h, 0 min).
- Botones de "Atrás" y "Siguiente".

#### [NEW] `src/frontend/components/daily_entry/StepIncidents.jsx`

- Multi-chips para registrar sucesos que alteran el cortisol: Buenas noticias, Estrés laboral, Discusión, Accidente, Malestar físico, Día tranquilo.
- Permite seleccionar varios elementos simultáneamente.
- Botones de navegación.

#### [NEW] `src/frontend/components/daily_entry/StepNutrition.jsx`

- Multi-chips rápidos de crononutrición: Cena ligera, Cena pesada, Cafeína tardía, Alcohol, Infusión relajante.
- Explicaciones de impacto en la latencia NREM/REM.
- Botones de navegación.

#### [NEW] `src/frontend/components/daily_entry/StepDreamJournal.jsx`

- Tarjeta de dictado por voz interactivo (`SpeechRecognition` de HTML5 / Web Speech API) con indicador de grabación activo.
- Botones de sugerencias para autocompletar preguntas guía ("📍 ¿Dónde estabas?", "💭 Emoción predominante", "👤 Personajes").
- Campo `textarea` para el relato onírico con contador de palabras en tiempo real.
- Botones: "Guardar borrador" y "Guardar y Analizar con IA" (`.btn.btn-primary`).

#### [NEW] `src/frontend/components/daily_entry/SuccessScreen.jsx`

- Pantalla de confirmación visual con check circular cian.
- Tarjetas de resumen del índice de sueño (ej. 88/100), profundidad REM y tensión somática baja.
- Botón para navegar a `/resultado-del-dia` o registrar otro parámetro.

---

### 3. Página y Enrutamiento

#### [NEW] `src/frontend/pages/RegistroDiario.jsx`

- Maneja el estado global del formulario:
  ```js
  const [formData, setFormData] = useState({
    physicalActivity: "Media (Ejercicio regular)",
    sleepHours: 7.5,
    sleepQuality: "Profundo",
    screenTime: "< 1 hora",
    incidents: ["Día tranquilo y neutro"],
    nutrition: ["Cena ligera / temprana"],
    dreamNarrative: "",
  });
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  ```
- Envía la petición a `POST ${BACKEND_URL}/api/daily_entries` con el token JWT si existe en `localStorage`.
- Gestiona la transición entre pasos y el estado completado (`SuccessScreen`).

#### [MODIFY] `src/frontend/routes.jsx`

- Importar `RegistroDiario` y añadir `<Route path="/registro-diario" element={<RegistroDiario />} />`.

---

## Plan de Verificación

### Pruebas Automatizadas y de Compilación

```bash
npm run build
npx eslint src/frontend/pages/RegistroDiario.jsx src/frontend/components/daily_entry
```

- Verificar compilación en 0 errores de sintaxis o resolución.

### Verificación Manual

1. **Flujo de Pasos (1 a 5):** Navegar por los 5 pasos mediante tarjetas táctiles y botones de navegación.
2. **Edición:** Pulsar "Editar" en las cápsulas de resumen para verificar que se regresa al paso correspondiente.
3. **Dictado por voz:** Probar el botón de micrófono en navegadores compatibles y el ingreso de texto manual en el textarea.
4. **Envío y Pantalla de Éxito:** Pulsar "Guardar y Analizar con IA" y verificar la renderización de `SuccessScreen`.
5. **Responsividad Móvil (375px - 768px):** Comprobar que las tarjetas no desborden y que el teclado táctil no oculte los controles esenciales.
