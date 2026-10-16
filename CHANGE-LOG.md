# CHANGE LOG

### 2026-10-16

**Corrección de errores en import, Pylance y tipado**  
(commit dab7c7d | branch **feature/blueprint-structure**, origin/feature/blueprint-structure)

- Añadido modelo `NutritionLog` con su tabla `nutrition_logs` y relación bidireccional con `DailyEntry`.
- Importación condicional (`TYPE_CHECKING`) de `SleepAnalysis` en `daily_entries_bp/models.py` para evitar ciclos de importación.
- Importación de `DailyEntry` en `analysis_bp/models.py` para resolver el forward‑reference.
- Tipado de `run_unified_ai_analysis` ajustado a `str | None` (antes `str`).
- Actualizadas las rutas de los blueprints `nutrition_bp` y `analysis_bp` para importar la instancia del Blueprint con alias `bp` y usar `@bp.route(...)`, eliminando errores de importación y ciclos.
- Verificada la compilación (`python -m py_compile`) y el arranque de la aplicación Flask sin errores.

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
