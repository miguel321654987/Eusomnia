# 🌙 Walkthrough: Rediseño Modular de Home (Eusomnia)

Se ha completado el rediseño total de la vista principal `Home.jsx` siguiendo fielmente la estética **"Nocturne Synapse"** exportada de Stitch (`DESIGN.md`, `code.html`, `screen.png`).

---

## 🚀 Cambios Realizados

### 1. Tipografías e Iconografía Externa

- **[MODIFY] [`index.html`](file:///workspaces/index.html)**:
  - Se añadieron las fuentes oficiales de Google: `Plus Jakarta Sans` (titulares), `Manrope` (lectura corporal) y `Space Grotesk` (telemetría y etiquetas técnicas).
  - Se vinculó `Material Symbols Outlined` para los iconos clínicos y de neuro-monitoreo.
  - Título actualizado a: _Eusomnia | Neuro-Monitoreo Circadiano & Análisis Onírico_.

### 2. Estilos Globales Eusomnia

- **[MODIFY] [`src/frontend/Index.css`](file:///workspaces/src/frontend/Index.css)**:
  - Paleta completa con variables CSS: lienzo de medianoche (`--eusomnia-bg: #0a1322`), superficies translúcidas, cian bioluminiscente (`#00e5ff`) y ámbar melatonina (`#ffc67e`).
  - **Fondo Global:** Configuración de `background-image` en `body` con la imagen `sleep-health-tech-background.jpg` matizada mediante un degradado sutil `linear-gradient` para un contraste óptimo.
  - Estilos visuales de tarjetas (`.eusomnia-card`, `.eusomnia-hud-card`), barra de navegación (`.eusomnia-navbar`, `.eusomnia-nav-pills-container`), footer (`.eusomnia-footer`), orbes de luz ambiental y textos degradados.
  - Se preservó y estilizó `.btn-primary` con el resplandor de bioluminiscencia cian para mantener compatibilidad con tests.

### 3. Componentes de Cabecera y Pie de Página

- **[MODIFY] [`src/frontend/components/Navbar.jsx`](file:///workspaces/src/frontend/components/Navbar.jsx)**:
  - Cabecera fija translúcida con efecto _frosted glass_ (`backdrop-filter: blur(16px)`).
  - Expansión responsiva configurada en `navbar-expand-lg` (activo desde 992px), garantizando que en resoluciones de Laptop (1024px) permanezca completamente desplegado sin colapsar en hamburguesa.
  - Logotipo Eusomnia con doble icono superpuesto (`bedtime` y `hub`) en contenedor cian brillante.
  - Píldoras centrales con detección de ruta activa para _Home_, _Registro Diario_, _Resultado del Día_, _Historial_ y _Perfil_.
  - Indicador dinámico de usuario activo con avatar y botón de cierre de sesión, o botones para abrir `#loginModal` y `#signupModal` si es invitado.
- **[MODIFY] [`src/frontend/components/Footer.jsx`](file:///workspaces/src/frontend/components/Footer.jsx)**:
  - Pie de página oscuro (`rgba(6, 14, 29, 0.88)`) con créditos oficiales _© 2026 Eusomnia - TechLab 4Geeks Academy_ y enlaces a _Contacto_ y _Privacidad_.
- **[MODIFY] [`src/frontend/pages/Layout.jsx`](file:///workspaces/src/frontend/pages/Layout.jsx)**:
  - Estructuración `min-vh-100 d-flex flex-column` garantizando que el `Footer` se mantenga al pie de página con `mt-auto`.

### 4. Componentes Modulares Desacoplados

Bajo el directorio `src/frontend/components/home/`:

- **[`HeroSection.jsx`](file:///workspaces/src/frontend/components/home/HeroSection.jsx)**:
  - Rejilla responsiva Bootstrap `row` (`col-12 col-lg-7` y `col-12 col-lg-5`).
  - Lado izquierdo: Titular con degradado cian, descripción científica de valor, botones CTA (`btn-primary` hacia `/registro-diario` y botón para demo) y píldora de sesión dinámica (`store.user` activo vs. botón para identificarse con `#loginModal`).
  - Lado derecho: Tarjeta HUD de _Sinapsis Nocturna_ con medidor circular SVG del 84%, gráfica de onda sináptica NREM/REM, alerta somática nutricional y resonancia de símbolo onírico.

- **[`PillarsSection.jsx`](file:///workspaces/src/frontend/components/home/PillarsSection.jsx)**:
  - Los Tres Pilares de Eusomnia: _01 • Agilidad_ (registro rápido), _02 • Motor Unificado_ (causa somática + símbolo onírico) y _03 • Nutrición & Edamam_ (crononutrición y metabolitos).

- **[`RestArchitectureSection.jsx`](file:///workspaces/src/frontend/components/home/RestArchitectureSection.jsx)**:
  - Arquitectura clínica del santuario nocturno: métricas de temperatura óptima (18.5° C) y luz azul (< 10 Lux), junto a la fotografía arquitectónica con chip del sensor de entorno.

- **[`RecentEntriesSection.jsx`](file:///workspaces/src/frontend/components/home/RecentEntriesSection.jsx)**:
  - Bitácora de noches con duración de sueño, título del sueño, extracto narrativo y chips de nivel de lucidez y calidad.
  - Enlaces a `/resultado-del-dia` y `/historial`.

- **[`QuickAccessSection.jsx`](file:///workspaces/src/frontend/components/home/QuickAccessSection.jsx)**:
  - Panel inferior dinámico: Saludo contextual con nombre del usuario logueado o invitación a crear cuenta abriendo `#signupModal`.

- **[`DemoModal.jsx`](file:///workspaces/src/frontend/components/home/DemoModal.jsx)**:
  - Modal interactivo controlado por estado de React (`isOpen`, `onClose`), con soporte para tecla `Escape` y backdrop blur.
  - Muestra la comparativa de datos somáticos + narrativa onírica -> veredicto neuro-onírico unificado de la IA.

### 4. Orquestador Principal de Home

- **[MODIFY] [`src/frontend/pages/Home.jsx`](file:///workspaces/src/frontend/pages/Home.jsx)**:
  - Reducido a un orquestador limpio y declarativo de ~40 líneas, consumiendo `useGlobalReducer()` y orquestando los componentes modulares.

### 5. Vista Modular de Registro Diario (`/registro-diario`)

Siguiendo los archivos de Stitch (`DESIGN (2).md`, `code (2).html`, `screen (2).png`) y los endpoints de `src/api` (`daily_entries_bp`):

- **Diseño Híbrido Escritorio / Móvil:**
  - Tarjetas táctiles amplias con selección asistida (avance automático tras 300ms) para móviles.
  - Botones de navegación explícitos ("Atrás", "Confirmar y avanzar") y cápsulas de resumen colapsadas con botón "Editar" para escritorio.
- **Subcomponentes modulares en [`src/frontend/components/daily_entry/`](file:///workspaces/src/frontend/components/daily_entry):**
  - **`StepperHeader.jsx`:** Barra de progreso interactiva, contador de pasos (1 a 5), tiempo estimado (~2 min) y porcentaje.
  - **`SummaryCapsules.jsx`:** Cápsulas compactas con los pasos completados y botón "Editar" para volver a cualquier paso anterior.
  - **`StepActivity.jsx` (Paso 1):** Actividad física con 4 opciones (`physical_activity`: Sedentario, Baja, Media, Alta).
  - **`StepSleepHygiene.jsx` (Paso 2):** Dial selector de horas (`3.0` a `14.0`), 4 badges de calidad (`bedtime_mood`: Profundo, Intermedio, Fragmentado, Insomnio) y exposición a pantallas (`screen_time`).
  - **`StepIncidents.jsx` (Paso 3):** Multi-chips de incidencias del día (`incidents`: Buenas noticias, Estrés, Conflicto, Día tranquilo, etc.).
  - **`StepNutrition.jsx` (Paso 4):** Multi-chips de crononutrición (`dinner_type`: Cena ligera/pesada, Cafeína, Alcohol, Infusión).
  - **`StepDreamJournal.jsx` (Paso 5):** Dictado por voz funcional con la Web Speech API (`SpeechRecognition`), chips de preguntas guía y contador de palabras en tiempo real.
  - **`SuccessScreen.jsx`:** Pantalla de confirmación con check circular bioluminiscente, índices biométricos y enlace a `/resultado-del-dia`.
- **Orquestador Principal [`src/frontend/pages/RegistroDiario.jsx`](file:///workspaces/src/frontend/pages/RegistroDiario.jsx):**
  - Conexión con `POST /api/daily_entries` (con token JWT de `store.token` o fallback a persistencia local si es invitado).
- **Enrutamiento [`src/frontend/routes.jsx`](file:///workspaces/src/frontend/routes.jsx):**
  - Registrada la ruta `/registro-diario` bajo `<Layout />`.

---

## 🧪 Verificación y Pruebas Realizadas

1. **Linting de Código:**
   - `npx eslint src/frontend/pages/Home.jsx src/frontend/components/home` -> **0 errores**.
   - `npx eslint src/frontend/components/Navbar.jsx src/frontend/components/Footer.jsx src/frontend/pages/Layout.jsx` -> **0 errores**.
   - `npx eslint src/frontend/pages/RegistroDiario.jsx src/frontend/components/daily_entry` -> **0 errores**.
2. **Compilación de Producción:**
   - `npm run build` -> **Éxito (✓ built in 990ms)** generando los bundles optimizados con total compatibilidad.
