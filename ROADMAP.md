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

- ✅ Blueprints (user, daily_entries, nutrition, analysis) (1.5 h) (commit ca4f6c2)
- ✅ Modelos SQLAlchemy + migraciones Flask‑Migrate (2 h) (commit <hash‑modelos>)
- ✅ Corrección de imports, tipado y Pylance (0.5 h) (commit dab7c7d)
- ✅ Creación de Endpoints de nutrición y cálculo de parámetros de sueño (1 h) (commit ffde1e4)
- ✅ **Creado `src/config/nutrition_sleep_parameters.json` y loader (`api/blueprints/nutrition_bp/loader.py`)** (0.5 h) (commit a1407be9)
- ✅ Definición del flujo completo de 4 pasos para evaluación nutricional (0.5 h) (commit dd944d2f)
- ✅ Añadir cobertura de pruebas a API de nutrición (0.5 h) (commit e87822d4)
- ✅ Nuevos endpoints GET `/logs` y PUT/PATCH/DELETE `/log/<int:entry_id>` en nutrition_bp (0.5 h) (commit cf5edc6)
- ✅ Refactor eliminación de redundancias en user_bp/routes.py (0.5 h) (commit 1cfb34bc)
- ✅ Auth JWT + preferencias IA (1.5 h) (commit <auth_jwt_hash>)
- ✅ Endpoints CRUD de DailyEntry y proxy Edamam (3 h) (commit <daily_entry_hash>)
- ✅ Orquestación IA (OpenRouter → JSON único) (2.5 h) (commit <orquestacion_hash>)
- ✅ Motor RAG (LangGraph + vectorización OpenRouter + Qdrant remoto + ingesta CSV) (3 h) (commits 704d31b, 6443ceb, ea98f76)
- ✅ Pruebas RAG, validaciones, errores de conexión Qdrant y doc API (1.5 h) (commits a606b6b, 7f73a92)

### ⬜ Pendiente

_(ninguna – todas las tareas de la Semana 2 están completadas)_

## Semana 3 — Frontend (React) e Integración Full Stack

**Objetivo semanal:** construir las vistas frontend React y conectarlas con la API del backend.

### ✅ Completado

- ✅ Estructura base de navegación: Navbar, Footer y layout global (commit c16cfbb)
- ✅ Vistas principales React: Home, DailyLog, DailyResult, History y Perfil (commits 2769753, c3c50dd, 3db6872, d9127b7, 554d194)
- ✅ Gestión de perfil, edición de datos de usuario y preferencias de IA (commit 554d194)
- ✅ Integración completa del flujo Registro Diario → Evaluación Nutricional → Análisis IA RAG

### ⬜ Pendiente

_(ninguna – todas las tareas de la Semana 3 están completadas)_

## Semana 4 — Rediseño UX/UI, Fallbacks y Autenticación Avanzada

**Objetivo semanal:** refinamiento visual, resiliencia del backend y mejoras en la experiencia de usuario.

### ✅ Completado

- ✅ Rediseño modular UI completo de vistas (Home, Registro Diario, Resultado del Día, Historial/Perfil) (commits bf1a040, e97225b, 267f60d, 55c599e)
- ✅ Implementación de fallbacks nutricionales (Triptófano, Omega 3, Alcohol) para Edamam y OpenRouter (commits de53052, c943679, 24245dd)
- ✅ Cálculo dinámico de horas de sueño en la interfaz (commit f366e52)
- ✅ Autenticación avanzada: "Recordar usuario y contraseña", extensión de expiración JWT y alertas Toast (commits 37a0d88, 5f85a43)

### ⬜ Pendiente

_(ninguna – todas las tareas de la Semana 4 están completadas)_


## Semana 5 — Despliegue en Producción (Render)

**Objetivo semanal:** desplegar la aplicación completa en Render con arquitectura desacoplada y dejarla operativa en producción.

### ✅ Completado

- ✅ Diseño de arquitectura de despliegue: Static Site (frontend) + Web Service Docker (backend) + PostgreSQL 18 gestionado en Render (commits 4865c42, 8194c87)
- ✅ Creación de `Dockerfile.render` con `python:3.13-slim`, `pipenv`, `psycopg[binary]` y gunicorn en puerto `${PORT:-10000}` (commits 4865c42, c1f48d9, 9a8a5ed)
- ✅ `render.yaml` Blueprint definitivo con los tres servicios (`eusomnia-db`, `eusomnia-backend`, `eusomnia-frontend`) (commits b62c9ef, a506622, 231006b, 70a8809)
- ✅ Corrección de `app.py`: health check en `/`, sitemap en `/sitemap`, CORS universal (commit 2ba6a1b)
- ✅ Fix `api.js`: `normalizeBackendUrl()` para anteponer `https://` al host inyectado por Render (commit 8194c87)
- ✅ Fix `main.jsx`: eliminado componente `<BackendURL />` bloqueante (commit 8194c87)
- ✅ Instalación explícita de `psycopg[binary]` en Dockerfile para SQLAlchemy 2.0 + Python 3.13 (commit 2b3d06e)
- ✅ Ajustes de UX en Perfil: modelo por defecto `openai/gpt-4o-mini`, selector de zona horaria, toasts persistentes (commits 3e79b34, 65c739d, d855fe9)
- ✅ Servicios en producción verificados:
  - 🌐 Frontend: https://eusomnia-frontend.onrender.com (Static Site, global CDN)
  - 🔧 Backend: https://eusomnia-backend.onrender.com (Docker, Oregon)
  - 🗄️ Base de datos: `eusomnia-db` (PostgreSQL 18, Oregon)
- ✅ Documentación actualizada: README.md con URLs de producción, guía de despliegue y Roadmap; CHANGE-LOG.md con todas las entradas de Nov 12–13

### ⬜ Pendiente

_(ninguna – todas las tareas de la Semana 5 están completadas)_
