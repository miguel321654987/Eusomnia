# CHANGE LOG

### 2026-11-11

**docs(roadmap): Actualización de ROADMAP.md**  
(commit e0382e7)
- Sincronización del estado actual de avance del proyecto hasta la Semana 4 en `ROADMAP.md`.

### 2026-11-06

**feat(api): Notificaciones Toast y opción Recordar Usuario**  
(commits 37a0d88, 5f85a43)
- Funcionalidad para recordar usuario/contraseña en el inicio de sesión.
- Actualización del formato visual de los mensajes Toast de notificación.

### 2026-11-05

**style(front): Reordenación UI de Resultado del día**  
(commit 3bb5538)
- Reorganización de componentes y bloques visuales en la pantalla de Resultado del Día.

### 2026-11-04

**feat(api) & style(front): Fallbacks para Triptófano, Omega 3 y Alcohol**  
(commits 5151d8f, 86992db, 1741f84, de53052, c943679)
- Incorporación de Triptófano, Omega 3 y Alcohol en el análisis nutricional.
- Sistema de fallback automático para Triptófano y Omega 3 cuando Edamam no devuelva el valor.
- Redistribución visual de inputs en `StepNutrition.jsx` y mejoras en Resultado del Día.

### 2026-11-03

**style(front) & fix(api): Cálculo de horas de sueño y endpoint eliminar registro**  
(commits 494ce1a, 3a34728, f366e52)
- Cálculo dinámico de las horas totales de sueño e inserción visual en la interfaz.
- Corrección de error en el endpoint de eliminación de registros.
- Actualización de textos descriptivos en la vista Home.

### 2026-11-01

**fix(api): Integración de formatos Edamam y navegación**  
(commits ca2ba0f, 9477e80)
- Ajustes en la estructura de peticiones enviadas a la API de Edamam.
- Corrección de errores en la edición de registros y navegación en la aplicación.

### 2026-10-30

**fix(front & back): Mejoras de UX y conexión con Qdrant**  
(commits bc9f1d7, f5ec6e6, 1cf37c1)
- Resolución de fallos de conexión hacia el servicio de Qdrant.
- Ajustes de estilos, navegación y experiencia de usuario.

### 2026-10-29

**fix(api) & style(front): Corrección de flujos Edamam/OpenRouter y vista Perfil.jsx**  
(commits e2ae7cb, 24245dd, 55c599e)
- Corrección de errores en la respuesta y procesamiento de los flujos de Edamam y OpenRouter.
- Rediseño modular de la vista Perfil.jsx.

### 2026-10-28

**style(front) & chore(api): Rediseño modular de Home, Registro y Resultado del Día**  
(commits bf1a040, e97225b, 267f60d, 5dffe2d)
- Rediseño modular completo de las vistas Home.jsx, Registro Diario y Resultado del Día.
- Reordenación en la jerarquía y prioridad de uso de modelos de IA en OpenRouter.

### 2026-10-27

**style(front & back): Ajustes en Sidebar y expiración de Token JWT**  
(commit 802b37b)
- Eliminación de padding lateral (`px-0`) en la barra lateral (Sidebar).
- Ajuste del tiempo de expiración del token JWT a 1 hora (`TOKEN_EXPIRES = timedelta(hours=1)`).

### 2026-10-26

**style(front): Actualización visual y animación inicial**  
(commits 73f3c50, 2e0bdaa, c2f4f8c)
- Inserción de imagen de fondo global y mejoras visuales en vistas existentes.
- Añadida animación a la vista inicial.

### 2026-10-25

**feat(api): Cluster Qdrant remoto y solución a error 502**  
(commits ea98f76, 7f73a92)
- Configuración del cluster Qdrant remoto para la colección `Eusomnia`.
- Corrección del error 502 Bad Gateway en la petición POST `/api/analysis/<id>` utilizada en `DailyLog.jsx`.

### 2026-10-24

**feat(api & db): Nodo vectorize en OpenRouter e ingesta de CSV**  
(commits 6443ceb, 81d0787, 042d912, fca07a7, a606b6b)
- Creación del nuevo nodo `vectorize` en LangGraph integrado con la API de OpenRouter.
- Integración de `diccionario.csv` e `diccionario_normalized.csv`.
- Adaptación de `ingest_from_csv` para soportar ambos formatos de CSV y adición de sus pruebas unitarias.

### 2026-10-23

**feat(api & docs): Servicio Qdrant y Grafo RAG LangGraph**  
(commits 704d31b, 01a6b39, 86de074, 4121392, de9088c)
- Migración y eliminación de dependencias obsoletas de `sentence-transformers` hacia LangGraph.
- Implementación del servicio Qdrant y componentes del grafo LangGraph RAG.
- Corrección de errores de tipos en Pydantic y Pylance.

### 2026-10-22

**feat(front): UI DailyLog implementada**  
(commit d9449e4)
- Maquetado e implementación de la vista de Registro Diario (`DailyLog`).

### 2026-10-21

**feat(front): UI Home**  
(commit 4bd2a89)
- Maquetado inicial de la interfaz de la página de inicio.

### 2026-10-20

**feat(front): Componentes iniciales de UI y navegación**  
(commits c16cfbb, 2769753, c3c50dd, 3db6872, d9127b7, 554d194, 0865250)
- Creación de Navbar.jsx, Footer.jsx, Home.jsx, DailyLog.jsx, DailyResult.jsx, History.jsx y Perfil.jsx.
- Implementación de edición de credenciales de usuario, preferencias de IA y recordatorios en vista Perfil.
- Corrección de errores de formato y sintaxis en frontend (ESLint).

### 2026-10-19

**feat(api): Añadidos en src/api/blueprints/nutrition_bp/routes.py GET `/logs` y PUT/PATCH/DELETE /log/\<int:entry_id\>**
(commit cf5edc69b7045ca4144002f4a6e64cddb19e268)

- Se añadieron los endpoints solicitados y se corrigió el manejo de errores en la integración con Edamam.
- Listado paginado de NutritionLog, actualizaciones parciales y eliminación con validaciones.

**refactor(api): Eliminar redundancias de endpoints en src/api/blueprints/user_bp/routes.py**
(commit 1cfb34bca7ae324710596cebd29919fef436f9ed)

- Simplificación de rutas y consolidación de lógica en `user_bp`.
- Mejoras en validaciones y respuesta uniforme.

### 2026-10-18

**feat(api): Definición del flujo completo de **4 pasos** necesarios para obtener la evaluación nutricional**
(commit dd944d2f534425710cad1f7f03ed0ca1d2fbb855)

- Diagnóstico del error 404 y definición del flujo de creación de DailyEntry, NutritionLog, consulta y evaluación.
- Ejemplos de request/response y esqueleto de pruebas unitarias.

**test(api): Añadir cobertura de pruebas a API de nutrición**
(commit e87822d48fad052cd71fe28f5c567de1a53551db)

- Configuración de fixtures, pruebas de endpoints y ejecución exitosa de la suite (26 tests).

### 2026-10-16

**fix(api)Corrección de errores en import, Pylance y tipado**  
(commit dab7c7d | branch **feature/blueprint-structure**, origin/feature/blueprint-structure)

- Añadido modelo `NutritionLog` con su tabla `nutrition_logs` y relación bidireccional con `DailyEntry`.
- Importación condicional (`TYPE_CHECKING`) de `SleepAnalysis` en `daily_entries_bp/models.py` para evitar ciclos de importación.
- Importación de `DailyEntry` en `analysis_bp/models.py` para resolver el forward‑reference.
- Tipado de `run_unified_ai_analysis` ajustado a `str | None` (antes `str`).
- Actualizadas las rutas de los blueprints `nutrition_bp` y `analysis_bp` para importar la instancia del Blueprint con alias `bp` y usar `@bp.route(...)`, eliminando errores de importación y ciclos.
- Verificada la compilación (`python -m py_compile`) y el arranque de la aplicación Flask sin errores.

**feat(api): Creado src/config/nutrition_sleep_parameters.json y loader**  
(commit a1407be95b68d9ae4bce8370f5c6c685316badc9)

- Se incluye el archivo de configuración **`src/config/nutrition_sleep_parameters.json`** con los parámetros de referencia nutricional vinculados a la higiene del sueño (metadata, user_profile, nutrients, meals y calculation_rules).
- Se implementa **`src/api/blueprints/nutrition_bp/loader.py`**, que:
  - Resuelve la ruta absoluta al JSON de forma robusta.
  - Carga el contenido una sola vez por proceso mediante caché en módulo.
  - Exporta la función `load_sleep_params() -> Dict[str, Any]` para que el resto del código acceda al diccionario de parámetros sin preocuparse por I/O.
- Se añaden pruebas unitarias (`tests/api/test_nutrition_loader.py`) que verifican:
  - Presencia de las 5 claves principales.
  - Correcta evaluación de las fórmulas de proteína en función del peso.
  - Factores de peso por comida (breakfast 0.8, lunch 1.0, snack 1.2, dinner 1.5).

### 2026-10-16

**feat(api): Crear Endpoints de nutrición y Cálculo de parámetros de sueño** \
(commit ffde1e4 | branch **feature/blueprint-structure**, origin/feature/blueprint-structure)

- Implementados los endpoints REST de nutrición: `analyze`, `analyze-recipe`, `log`, `evaluate` y `parameters`.
- Añadido el archivo de configuración `src/config/nutrition_sleep_parameters.json` con parámetros por defecto para cálculo de sueño.
- Creado `api/blueprints/nutrition_bp/loader.py` que carga dicho fichero y lo expone mediante el endpoint `/nutrition/parameters`.
- Actualizada la documentación del API (ejemplos cURL) en el README.
- Todas las pruebas continúan pasando (21 passed).

### 2026-10-15

**Creación de directorios para Blueprints**
(commit ca4f6c2 | branch **feature/blueprint-structure**)

**Implementación de Blueprints modulares (user, daily_entries, nutrition, analysis)**
(commit <hash> | branch **feature/blueprint-structure**)

**Modelos SQLAlchemy unificados y migraciones con Flask-Migrate**
(commit <hash> | branch **feature/blueprint-structure**)

### 2026-10-13

**Instalación de Qdrant y LangGraph**
(commit f8f7a68 | branch **develop**)

**Actualización de documentación AGENTS y guías de planificación**
(commit db407fb | branch **develop**)

### 2026-10-02

**Problema/solución y alcance MVP** (commit f8f7a68 | branch **develop**)

**Stack + repo, ramas y estructura** (commit f8f7a68 | branch **develop**)

**Entorno local y dependencias (Qdrant, LangGraph)** (commit f8f7a68 | branch **develop**)

**Backlog de épicas e historias (MVP v1.0 vs v1.1+)** (commit a8b86b6 | branch **develop**)

**Initial development setup** (commit a8b86b6 | branch **develop**)

### 2026-10-01

**Initial project setup: React + Flask template with Eusomnia docs**
(commit f760577 | branch **develop**, also present in **main**)
