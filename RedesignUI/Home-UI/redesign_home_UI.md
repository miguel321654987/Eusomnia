# 🌙 Plan de Implementación: Rediseño Modular de Home (Eusomnia)

## Resumen del Objetivo

Rediseñar la vista principal `Home.jsx` adoptando el sistema de diseño visual de Stitch (**"Nocturne Synapse"**) mediante **Bootstrap 5** y clases CSS globales en `Index.css` (sin Tailwind), organizando la vista en **componentes independientes y desacoplados** en `src/frontend/components/home/`, y aclarando el origen y estado de los datos (existentes en backend/store vs. datos ejemplares/fallback).

---

## 🔍 Auditoría de Contenidos: ¿Qué está implementado y qué requiere nueva lógica?

| Sección                       | Contenido Visual en Stitch                                                | Estado en Backend / Store                                                                                                                                                                                                        | Estrategia de Implementación                                                                                                                                                                                                                     |
| :---------------------------- | :------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Hero Section**              | Badge de versión, título, CTAs, estado de usuario y tarjeta HUD sináptica | • `store.user`: **Implementado** (`name`, `email`).<br>• Telemetría HUD (score 84%, gráfica SVG): **No existe telemetría en tiempo real en backend**.                                                                            | Se enlaza dinámicamente con `store.user` para mostrar el nombre del usuario logueado o _"Invitado"_. La telemetría HUD se presenta con el layout SVG interactivo como visualizador bio-sináptico clínico.                                        |
| **3 Pilares**                 | Metodología clínica (Agilidad, Motor Unificado, Nutrición & Edamam)       | **Contenido editorial / estático** de la marca Eusomnia.                                                                                                                                                                         | Componente estático puro (`PillarsSection.jsx`), sin necesidad de lógica de API.                                                                                                                                                                 |
| **Arquitectura del Descanso** | Métricas de habitáculo (18.5°C, <10 Lux) y foto con sensor                | **Contenido editorial / guía clínica**.                                                                                                                                                                                          | Componente estático modular (`RestArchitectureSection.jsx`).                                                                                                                                                                                     |
| **Bitácora Reciente**         | Tarjetas de últimas 3 noches (sueño, lucidez, calidad, notas)             | • Backend: `GET /api/daily_entries` **está implementado** en `daily_entries_bp`, devuelve entradas con `sleep_report`, `habit_log`, `analysis`.<br>• Store frontend: aún no tiene acción dedicada para cachear bitácora en Home. | Se diseña `RecentEntriesSection.jsx` para admitir datos reales y proporcionar una lista inicial de **3 noches representativas de muestra** (fallback elegante) si el usuario es nuevo, no tiene entradas registradas aún o navega como invitado. |
| **Panel Acceso Rápido**       | Saludo personalizado, aviso de reportes pendientes y botones              | • `store.user`: **Implementado**.                                                                                                                                                                                                | `QuickAccessSection.jsx` reacciona a `store.user`. Si no hay sesión, muestra tarjeta de bienvenida e invitación a registrarse abriendo `#signupModal`.                                                                                           |
| **Modal Demo Onírica**        | Simulación de análisis: datos somáticos + narrativa = veredicto IA        | Simulación interactiva de demostración.                                                                                                                                                                                          | `DemoModal.jsx` controlado por estado de React (`showDemoModal`), permitiendo al usuario probar el valor del motor antes de registrarse.                                                                                                         |

---

## 🏛️ Arquitectura de Componentes Propuesta

```
src/frontend/
├── Index.css                       <-- Estilos globales Eusomnia (Nocturne Synapse, fuentes, glowing, HUD)
├── pages/
│   └── Home.jsx                    <-- Orquestador principal (limpio, modular, < 70 líneas)
└── components/
    └── home/
        ├── HeroSection.jsx         <-- Hero + HUD Sináptico + Estado de Sesión
        ├── PillarsSection.jsx      <-- Los Tres Pilares de Eusomnia (Tarjetas metodológicas)
        ├── RestArchitectureSection.jsx <-- Entorno clínico y santuario del descanso
        ├── RecentEntriesSection.jsx <-- Bitácora de últimas noches registradas
        ├── QuickAccessSection.jsx  <-- Panel inferior de bienvenida / sincronización
        └── DemoModal.jsx           <-- Modal interactivo de simulación onírica
```

---

## Cambios Propuestos Paso a Paso

### 1. Tipografías e Iconos Externos

#### [MODIFY] `index.html`

- Inyectar Google Fonts: `Plus Jakarta Sans`, `Manrope`, `Space Grotesk`.
- Inyectar `Material Symbols Outlined` para la iconografía de neuromonitoreo.

### 2. Capa de Estilos Globales

#### [MODIFY] `src/frontend/Index.css`

- Definir variables CSS (`--eusomnia-bg: #0a1322`, `--eusomnia-primary: #00e5ff`, etc.).
- Definir estilos de tarjetas con efecto de vidrio esmerilado (`.eusomnia-card`, `.eusomnia-card-hud`).
- Definir estilos de botones respetando `.btn-primary` (fondo cian bioluminiscente, texto `#00363d`, sombra luminiscente).
- Clases para los degradados de texto y orbes ambientales.

### 3. Componentes Modulares de Home

#### [NEW] `src/frontend/components/home/HeroSection.jsx`

- Contenedor con `row` y `col-lg-7` / `col-lg-5`.
- Columna izquierda: Badge, H1 con degradado, CTAs primarios (`<Link to="/registro-diario">` con `.btn.btn-primary` y botón para demo modal), píldora de usuario activo conectada a `store.user` (o botón para abrir `#loginModal`).
- Columna derecha: Tarjeta HUD con dial circular SVG del 84%, gráfica de onda sináptica SVG, alerta nutricional somática y ancla de símbolo.

#### [NEW] `src/frontend/components/home/PillarsSection.jsx`

- Rejilla Bootstrap `row g-4` con 3 columnas `col-md-4`.
- Pilar 1: Agilidad (Registro en < 2 min).
- Pilar 2: Motor Unificado (Causa somática + símbolo onírico).
- Pilar 3: Nutrición & Edamam (Prescripciones y crononutrición).

#### [NEW] `src/frontend/components/home/RestArchitectureSection.jsx`

- Tarjeta panorámica con métricas clave (18.5° C y < 10 Lux de luz azul).
- Imagen del habitáculo con badge de monitoreo ambiental.

#### [NEW] `src/frontend/components/home/RecentEntriesSection.jsx`

- Muestra las 3 tarjetas de bitácora con tiempo de descanso, título del sueño, extracto, chips de lucidez y calidad.
- Botones de _"Ver Diagnóstico"_ vinculados a `/resultado-del-dia` y enlace general a `/historial`.

#### [NEW] `src/frontend/components/home/QuickAccessSection.jsx`

- Saludo condicional:
  - Si `store.user` está activo: Saludo con su nombre real y botón _"Registrar Noche"_.
  - Si no hay sesión: Invitación con llamada a la acción para identificarse o crear cuenta.

#### [NEW] `src/frontend/components/home/DemoModal.jsx`

- Componente de modal flotante controlado por la prop `isOpen` y `onClose`.
- Renderiza la comparativa somática vs. onírica y el veredicto del motor IA.

#### [MODIFY] `src/frontend/pages/Home.jsx`

- Orquesta limpiamente los 5 componentes de sección y el modal de demo.
- Maneja el estado local `const [showDemoModal, setShowDemoModal] = useState(false)`.
- Extrae `store` de `useGlobalReducer()`.

---

## Plan de Verificación

### Pruebas Automatizadas y de Compilación

```bash
npm run build
```

- Verificar que Vite compile correctamente sin errores de sintaxis, variables no declaradas o estilos rotos.

### Verificación Manual en Navegador

1. **Comportamiento Visual:** Comprobar que los colores oscuros de medianoche, degradados cian y fuentes `Plus Jakarta Sans` y `Manrope` se cargan fielmente según Stitch.
2. **Interactividad:**
   - Hacer clic en _"Ver Demo de Análisis"_ -> debe abrirse el `DemoModal`.
   - Cerrar el modal mediante la 'X' o el botón de cerrar -> debe ocultarse limpiamente.
   - Probar el estado con sesión vs. sin sesión -> el badge debe mostrar el nombre del usuario o el botón para abrir el modal de login.
3. **Enlaces de Navegación:**
   - Comprobar que los botones y enlaces apunten a `/registro-diario`, `/resultado-del-dia`, `/historial` y `/perfil`.
