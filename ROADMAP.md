# ROADMAP

## Semana 1 — Estado actual

**Objetivo semanal:** definir el alcance del MVP y dejar el proyecto listo para construir.

### ✅ Completado

- ✅ Problema/solución y alcance MVP (2 h) (commit f8f7a68)
- ✅ Stack + repo, ramas y estructura (1.5 h) (commit f8f7a68)
- ✅ Entorno local y dependencias (Qdrant, LangGraph + LangChain OpenAI embeddings + `qdrant-client`) (2 h) (commit f8f7a68)
- ✅ Modelo de datos (diagrama: User+prefs, DailyEntry, SleepReport, HabitLog, NutritionLog, DreamConcept, SleepAnalysis) (3 h) (commit <hash‑modelo>)
- ✅ Backlog de épicas e historias (MVP v1.0 vs v1.1+) (2 h) (commit a8b86b6)
- ✅ Wireframes (Home, Registro, Resultado, Historial, Perfil, Navbar, Footer) (3 h) (commit <hash‑wireframes>)
- ✅ Actualización de documentación AGENTS y guías de planificación (0.5 h) (commit db407fb)

### ⬜ Pendiente

_(ninguna – todas las tareas de la Semana 1 están completadas)_

## Semana 2 — Backend, motor RAG y orquestación IA

**Objetivo semanal:** backend Flask del MVP con motor RAG y orquestación IA funcionales.

### ✅ Completado

- ✅ Blueprints (user, daily_entries, nutrition, analysis) (1.5 h) (commit ca4f6c2 / <hash>)
- ✅ Modelos SQLAlchemy + migraciones Flask‑Migrate (2 h) (commit <hash‑modelos>)
- ✅ Corrección de imports, tipado y Pylance (0.5 h) (commit dab7c7d)
- ✅ Creación de Endpoints de nutrición y cálculo de parámetros de sueño (1 h) (commit ffde1e4)
- ✅ **Creado `src/config/nutrition_sleep_parameters.json` y loader (`api/blueprints/nutrition_bp/loader.py`)** (0.5 h) (commit a1407be95b68d9ae4bce8370f5c6c685316badc9)
- ✅ Definición del flujo completo de 4 pasos para evaluación nutricional (0.5 h) (commit dd944d2f)
- ✅ Añadir cobertura de pruebas a API de nutrición (0.5 h) (commit e87822d4)
- ✅ Nuevos endpoints GET `/logs` y PUT/PATCH/DELETE `/log/<int:entry_id>` en nutrition_bp (0.5 h) (commit cf5edc6)
- ✅ Refactor eliminación de redundancias en user_bp/routes.py (0.5 h) (commit 1cfb34bc)
- ✅ Auth JWT + preferencias IA (1.5 h) (commit <auth_jwt_hash>)
- ✅ Endpoints CRUD de DailyEntry y proxy Edamam (3 h) (commit <daily_entry_hash>)
- ✅ Orquestación IA (OpenRouter → JSON único) (2.5 h) (commit <orquestacion_hash>)

### ⬜ Pendiente

- [ ] Motor RAG (LangGraph + LangChain OpenAI embeddings + `qdrant-client`) (3 h)
- [ ] Pruebas básicas, validaciones, errores y doc API (1.5 h)
