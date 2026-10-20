# CHANGE LOG

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

**Instalación de Qdrant y sentence-transformers**
(commit f8f7a68 | branch **develop**)

**Actualización de documentación AGENTS y guías de planificación**
(commit db407fb | branch **develop**)

### 2026-10-02

**Problema/solución y alcance MVP** (commit f8f7a68 | branch **develop**)

**Stack + repo, ramas y estructura** (commit f8f7a68 | branch **develop**)

**Entorno local y dependencias (Qdrant, sentence-transformers)** (commit f8f7a68 | branch **develop**)

**Backlog de épicas e historias (MVP v1.0 vs v1.1+)** (commit a8b86b6 | branch **develop**)

**Initial development setup** (commit a8b86b6 | branch **develop**)

### 2026-10-01

**Initial project setup: React + Flask template with Eusomnia docs**
(commit f760577 | branch **develop**, also present in **main**)
