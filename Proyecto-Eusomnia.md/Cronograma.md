---
# Cronograma de Ejecución — Eusomnia
Duración: 15 h/semana · 6 semanas · 90 h totales
Stack: React 19 + Vite + Bootstrap / Flask + Blueprints + SQLAlchemy / SQLite↔PostgreSQL / NumPy + sentence-transformers / CalorieNinjas / OpenRouter
---

## Semana 1 — Fundaciones, alcance y diseño

**Objetivo semanal:** definir el alcance del MVP y dejar el proyecto listo para construir.

| #   | Tarea                                                                                                                |   Horas    |
| --- | -------------------------------------------------------------------------------------------------------------------- | :--------: |
| 1   | Problema/solución y alcance MVP                                                                                      |    2 h     |
| 2   | Stack + repo, ramas y estructura                                                                                     |   1,5 h    |
| 3   | Entorno local y dependencias (`numpy`, `sentence-transformers`)                                                      |    2 h     |
| 4   | Modelo de datos (diagrama: User+prefs, DailyEntry, SleepReport, HabitLog, NutritionLog, DreamConcept, SleepAnalysis) |    3 h     |
| 5   | Backlog de épicas e historias (MVP v1.0 vs v1.1+)                                                                    |    2 h     |
| 6   | Wireframes (Home, Registro, Resultado, Historial, Perfil, Navbar, Footer)                                            |    3 h     |
|     | **Total**                                                                                                            | **13.5 h** |

---

## Semana 2 — Backend, motor RAG y orquestación IA

**Objetivo semanal:** backend Flask del MVP con motor RAG y orquestación IA funcionales.

| #   | Tarea                                                 |  Horas   |
| --- | ----------------------------------------------------- | :------: |
| 1   | Blueprints (user, daily_entries, nutrition, analysis) |  1,5 h   |
| 2   | Modelos SQLAlchemy + migraciones Flask-Migrate        |   2 h    |
| 3   | Auth JWT + preferencias IA                            |  1,5 h   |
| 4   | Endpoints (CRUD diario, proxy CalorieNinjas)          |   3 h    |
| 5   | Motor RAG (sentence-transformers + Qdrant)            |   3 h    |
| 6   | Orquestación IA (OpenRouter → JSON único)             |  2,5 h   |
| 7   | Pruebas básicas, validaciones, errores y doc API      |  1,5 h   |
|     | **Total**                                             | **15 h** |

---

## Semana 3 — Frontend React, integración y estado global

**Objetivo semanal:** SPA React conectada al backend, cubriendo todo el ciclo de uso.

| #   | Tarea                                                                |  Horas   |
| --- | -------------------------------------------------------------------- | :------: |
| 1   | Routing (react-router-dom) y estructura de componentes/páginas       |  1,5 h   |
| 2   | Registro/login con token y rutas protegidas                          |   2 h    |
| 3   | Home + Navbar/Footer                                                 |  1,5 h   |
| 4   | Registro diario (bloques Hábitos + Sueño)                            |   3 h    |
| 5   | Resultado del día (interpretación, badges, recomendaciones, alertas) |   3 h    |
| 6   | Historial (lista + detalle)                                          |   2 h    |
| 7   | Perfil + estado global + feedback (loaders/toasts) + responsivo      |   2 h    |
|     | **Total**                                                            | **15 h** |

---

## Semana 4 — Estabilización, UX y documentación

**Objetivo semanal:** pulir el MVP y cerrar deuda técnica.

| #   | Tarea                                               |  Horas   |
| --- | --------------------------------------------------- | :------: |
| 1   | Corregir issues de semanas 2-3                      |   4 h    |
| 2   | Funcionalidad adicional dentro del MVP              |   3 h    |
| 3   | Mejoras de UX                                       |  2,5 h   |
| 4   | Refactorizar componentes y extraer hooks/utilidades |   2 h    |
| 5   | Actualizar backlog                                  |   1 h    |
| 6   | Variables de entorno (`.env` / `.env.example`)      |   1 h    |
| 7   | README (instalación, migraciones, ejecución)        |  1,5 h   |
|     | **Total**                                           | **15 h** |

---

## Semana 5 — Despliegue, pruebas E2E y demo

**Objetivo semanal:** poner Eusomnia en producción y verificar el flujo completo.

| #   | Tarea                                                   |  Horas   |
| --- | ------------------------------------------------------- | :------: |
| 1   | Desplegar backend y frontend (Render + PostgreSQL)      |   4 h    |
| 2   | Variables de entorno de producción                      |  1,5 h   |
| 3   | Pruebas end-to-end (registrar→analizar→recomendaciones) |   3 h    |
| 4   | Detalles visuales finales                               |   2 h    |
| 5   | Video demo                                              |  2,5 h   |
| 6   | README con URL de producción y notas de deploy          |   2 h    |
|     | **Total**                                               | **15 h** |

---

## Semana 6 — Publicación, evaluación y plan a 30 días

**Objetivo semanal:** cerrar el proyecto y proyectar su continuidad.

| #   | Tarea                              |  Horas   |
| --- | ---------------------------------- | :------: |
| 1   | Publicar el proyecto               |  1,5 h   |
| 2   | Autoevaluación del MVP             |   2 h    |
| 3   | Preparar presentación              |   3 h    |
| 4   | Presentación + feedback del mentor |  2,5 h   |
| 5   | Plan de acción a 30 días (v1.1+)   |   3 h    |
| 6   | Actualizar CV y LinkedIn           |   3 h    |
|     | **Total**                          | **15 h** |

---

**Resumen:** 6 semanas × 15 h = **90 h**.
