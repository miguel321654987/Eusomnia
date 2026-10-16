# ROADMAP

## Semana 1 — Estado actual

### ✅ Completado

- ✅ Problema/solución y alcance MVP (2 h) (commit f8f7a68)
- ✅ Stack + repo, ramas y estructura (1.5 h) (commit f8f7a68)
- ✅ Entorno local y dependencias (Qdrant, sentence‑transformers) (2 h) (commit f8f7a68)
- ✅ Backlog de épicas e historias (MVP v1.0 vs v1.1+) (2 h) (commit a8b86b6)
- ✅ Actualización de documentación AGENTS y guías de planificación (0.5 h) (commit db407fb)

### ⬜ Pendiente

- [ ] Modelo de datos (diagrama: User+prefs, DailyEntry, SleepReport, HabitLog, NutritionLog, DreamConcept, SleepAnalysis) (3 h)
- [ ] Wireframes (Home, Registro, Resultado, Historial, Perfil, Navbar, Footer) (3 h)

## Semana 2 — Backend, motor RAG y orquestación IA

### ✅ Completado

- ✅ Blueprints (user, daily_entries, nutrition, analysis) (1.5 h) (commit ca4f6c2 / <hash>)
- ✅ Modelos SQLAlchemy + migraciones Flask‑Migrate (2 h) (commit <hash>)

### ⬜ Pendiente (Próximas funcionalidades)

- [ ] Auth JWT + preferencias IA (1.5 h)
- [ ] Endpoints (CRUD diario, proxy CalorieNinjas) (3 h)
- [ ] Motor RAG (sentence-transformers + Qdrant) (3 h)
- [ ] Orquestación IA (OpenRouter → JSON único) (2.5 h)
- [ ] Pruebas básicas, validaciones, errores y doc API (1.5 h)

<!--

# TRADUCCIÓN AL ESPAÑOL / HISTÓRICO COMENTADO

- ✅ Blueprints modulares y arquitectura base registrados en Flask (rama feature/blueprint-structure).
- ✅ Modelos unificados (User, DailyEntry, SleepReport, HabitLog, NutritionLog, DreamConcept, SleepAnalysis) migrados en base de datos.
- Siguiente hito: Autenticación JWT y configuración de preferencias de IA.
  -->
