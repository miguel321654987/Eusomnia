<h1 align="center">
  🌙 Eusomnia
</h1>

<p align="center">
  <em>Interpreta tus sueños. Comprende tus hábitos. Mejora tu descanso.</em>
</p>

<p align="center">
  <!-- Frontend -->
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React 19"/>
  <img src="https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite 8"/>
  <img src="https://img.shields.io/badge/Bootstrap-5-7952B3?style=flat-square&logo=bootstrap&logoColor=white" alt="Bootstrap 5"/>
  <!-- Backend -->
  <img src="https://img.shields.io/badge/Python-3.13-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python 3.13"/>
  <img src="https://img.shields.io/badge/Flask-3.x-000000?style=flat-square&logo=flask&logoColor=white" alt="Flask"/>
  <img src="https://img.shields.io/badge/SQLAlchemy-ORM-D71F00?style=flat-square&logo=sqlalchemy&logoColor=white" alt="SQLAlchemy"/>
  <!-- Auth & seguridad -->
  <img src="https://img.shields.io/badge/JWT-Auth-000000?style=flat-square&logo=jsonwebtokens&logoColor=white" alt="JWT"/>
  <img src="https://img.shields.io/badge/Bcrypt-Hashing-4A90D9?style=flat-square&logo=letsencrypt&logoColor=white" alt="Bcrypt"/>
  <!-- Base de datos -->
  <img src="https://img.shields.io/badge/PostgreSQL-18-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL 18"/>
  <img src="https://img.shields.io/badge/SQLite-Dev-003B57?style=flat-square&logo=sqlite&logoColor=white" alt="SQLite"/>
  <!-- IA & vectores -->
  <img src="https://img.shields.io/badge/OpenRouter-AI-6B46C1?style=flat-square&logo=openai&logoColor=white" alt="OpenRouter"/>
  <img src="https://img.shields.io/badge/Qdrant-Vector%20DB-DC244C?style=flat-square&logo=qdrant&logoColor=white" alt="Qdrant"/>
  <img src="https://img.shields.io/badge/LangChain-Embeddings-1C3C3C?style=flat-square&logo=langchain&logoColor=white" alt="LangChain Embeddings"/>
  <!-- Infraestructura -->
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker"/>
  <img src="https://img.shields.io/badge/Gunicorn-WSGI-499848?style=flat-square&logo=gunicorn&logoColor=white" alt="Gunicorn"/>
  <img src="https://img.shields.io/badge/Render-Deploy-46E3B7?style=flat-square&logo=render&logoColor=white" alt="Render"/>
  <!-- Estado -->
  <img src="https://img.shields.io/badge/Estado-En%20desarrollo-orange?style=flat-square" alt="Estado"/>
</p>

<p align="center">
  🌐 <strong><a href="https://eusomnia-frontend.onrender.com">eusomnia-frontend.onrender.com</a></strong>
</p>

---

## ¿Qué es Eusomnia?

**Eusomnia** es una aplicación web full-stack de análisis integrado de sueños y hábitos de vida.
El usuario registra su sueño del día junto con sus hábitos (actividad, alimentación, pantallas, sensaciones) y recibe una interpretación personalizada generada por IA, enriquecida con un motor de búsqueda semántica sobre un diccionario de ~7.000 símbolos oníricos.

El valor diferencial de Eusomnia es la **integración**: el sueño y los hábitos del día se analizan juntos en una única orquestación de IA, generando recomendaciones siempre justificadas por un dato concreto del registro o del historial.

---

## Características principales

| Módulo                      | Descripción                                                                                                    |
| --------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 📖 **Diario de sueños**     | Registro diario de texto libre del sueño + bloque de hábitos del día                                           |
| 🥗 **Análisis nutricional** | Enriquecimiento automático con calorías, cafeína y azúcar vía Edamam                                           |
| 🔍 **Motor RAG**            | Búsqueda semántica de símbolos oníricos con `LangGraph` + Qdrant                                               |
| 🤖 **Interpretación IA**    | Un único JSON de OpenRouter: interpretación, emociones, símbolos, hábitos, patrones, recomendaciones y alertas |
| 📊 **Historial**            | Consulta de todos los registros diarios con su análisis completo                                               |
| 👤 **Perfil privado**       | JWT + Bcrypt; el diario es estrictamente privado por usuario autenticado                                       |
| 🔔 **Alertas**              | Avisos automáticos ante patrones de riesgo (cafeína tardía, hábitos recurrentes...)                            |

---

## Stack tecnológico

### Frontend

- **React 19** con Hooks y Context API / Flux
- **React Router DOM** para enrutamiento de la SPA
- **Bootstrap 5 + CSS** para diseño responsivo
- **Vite 8** como bundler

### Backend

- **Python 3.13** con **Flask** y arquitectura MVC por **Blueprints**
- **SQLAlchemy ORM** — nunca SQL crudo
- **Flask-Migrate** para gestión de migraciones
- **Flask-JWT-Extended** para autenticación por token
- **Flask-Bcrypt** para hashing seguro de contraseñas
- **Gunicorn** como servidor WSGI en producción
- **psycopg** como driver PostgreSQL para SQLAlchemy 2.0

### Base de datos

- **SQLite** en desarrollo local (`instance/example.db`)
- **PostgreSQL 18** en producción vía `DATABASE_URL`

### Inteligencia Artificial & Datos

- **OpenRouter** — orquestación IA (modelo configurable, por defecto `gpt-4o-mini`)
- **LangChain OpenAI embeddings** (`text-embedding-3-small`) — vectorización semántica
- **Qdrant** — motor de búsqueda vectorial para el diccionario onírico
- **Edamam API** — enriquecimiento nutricional (proxy desde Flask)

### Infraestructura

- **Docker + Docker Compose** — entorno de desarrollo con app + PostgreSQL 18
- **Dockerfile.render** — imagen de producción basada en `python:3.13-slim` + Gunicorn
- **Render** — despliegue en producción (Static Site + Web Service + PostgreSQL gestionado)

---

## Arquitectura del flujo de análisis

```
Usuario (relato del sueño + hábitos + comida)
        │
        ▼
┌─────────────────────────────────────────────┐
│          FASE 1 · RETRIEVAL (RAG)           │
│  LangGraph → vector del sueño               │
│  Qdrant → símbolos oníricos más cercanos    │
└────────────────────┬────────────────────────┘
                     │ contexto simbólico
                     ▼
┌─────────────────────────────────────────────┐
│         FASE 2 · AUGMENTATION               │
│  Prompt: sueño + símbolos + hábitos         │
│           + nutrición + historial reciente  │
└────────────────────┬────────────────────────┘
                     │ prompt enriquecido
                     ▼
┌─────────────────────────────────────────────┐
│         FASE 3 · GENERATION (LLM)           │
│  OpenRouter → JSON único:                   │
│  interpretación · emociones · símbolos      │
│  hábitos · patrones · recomendaciones       │
└────────────────────┬────────────────────────┘
                     │ JSON + datos del día
                     ▼
┌─────────────────────────────────────────────┐
│         FASE 4 · PERSISTENCIA               │
│  SQLAlchemy → DailyEntry (registro único)   │
│  React → tarjetas · badges · historial      │
└─────────────────────────────────────────────┘
```

---

## Instalación y puesta en marcha

### Requisitos previos

- Python 3.13+
- Node.js 20+
- Pipenv
- Docker + Docker Compose

### 1. Clonar el repositorio

```bash
git clone https://github.com/miguel321654987/eusomnia.git
cd eusomnia
```

### 2. Variables de entorno

Crea un fichero `.env` en la raíz del proyecto a partir de `.env.example`:

```bash
cp .env.example .env
```

Variables necesarias:

```env
DATABASE_URL=          # URL de PostgreSQL (producción). Vacía = SQLite local
JWT_SECRET_KEY=        # Secret key larga para firmar tokens JWT
FLASK_APP=src/app.py
FLASK_DEBUG=1

OPENROUTER_API_KEY=    # Clave de OpenRouter para la IA
EDAMAM_APP_ID=         # App ID de Edamam (nutrición)
EDAMAM_APP_KEY=        # App Key de Edamam (nutrición)
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=        # Clave del cluster Qdrant (si es remoto)
QDRANT_COLLECTION=Eusomnia
```

### 3. Levantar el entorno con Docker Compose

El devcontainer incluye la **app** y **PostgreSQL 18** preconfigurados:

```bash
docker compose up
```

> El servicio `db` arranca PostgreSQL con usuario `gitpod`, base de datos `example` y contraseña `postgres`. Configura `DATABASE_URL` en tu `.env` si prefieres conectarte directamente.

### 4. Backend (Flask)

```bash
pipenv install
pipenv run migrate   # Genera migraciones
pipenv run upgrade   # Aplica migraciones
pipenv run start     # Inicia el servidor en el puerto 3000
```

### 5. Frontend (React + Vite)

```bash
npm install
npm run dev          # Inicia en http://localhost:5173
```

### 6. Qdrant (motor vectorial)

```bash
docker run -p 6333:6333 qdrant/qdrant
```

### Ingestión de datos en Qdrant

**Variables de entorno** (añade al `.env`):

```dotenv
QDRANT_URL=https://<your-cluster>.eu-west-1-0.aws.cloud.qdrant.io
QDRANT_API_KEY=<your-api-key>
QDRANT_COLLECTION=Eusomnia
```

**Ingestión con embeddings reales**

Si dispones de acceso a OpenRouter/OpenAI, usa el script oficial que genera embeddings:

```bash
python scripts/bootstrap_ingest.py
```

**Verificación**

```bash
curl -H "api-key: $QDRANT_API_KEY" "$QDRANT_URL/collections/$QDRANT_COLLECTION"
```

El campo `points_count` debe coincidir con el número de filas del CSV (≈ 8.010).

---

## Migraciones de base de datos

Ejecuta estos comandos **siempre que modifiques un modelo** de SQLAlchemy:

```bash
pipenv run migrate   # Genera el script de migración
pipenv run upgrade   # Aplica la migración a la base de datos
```

---

## Despliegue en Render

La aplicación se despliega en **Render** utilizando una arquitectura desacoplada definida en `render.yaml` (Blueprint):

| Servicio              | Tipo           | URL                                    |
| --------------------- | -------------- | -------------------------------------- |
| `eusomnia-frontend`   | Static Site    | https://eusomnia-frontend.onrender.com |
| `eusomnia-backend`    | Web Service    | https://eusomnia-backend.onrender.com  |
| `eusomnia-db`         | PostgreSQL 18  | (interna, región Oregon)               |

### Arquitectura de despliegue

```
┌─────────────────────────┐       ┌─────────────────────────┐
│   Static Site (CDN)     │──────▶│   Web Service (Docker)  │
│  eusomnia-frontend      │       │  eusomnia-backend       │
│  npm run build → /dist  │       │  Python 3.13 + Gunicorn │
│  Regla SPA: /* → index  │       │  Puerto: 10000          │
└─────────────────────────┘       └───────────┬─────────────┘
                                              │
                                  ┌───────────▼─────────────┐
                                  │   PostgreSQL 18         │
                                  │   eusomnia-db           │
                                  │   Región: Oregon        │
                                  └─────────────────────────┘
```

### Desplegar desde cero con Blueprint (1 clic)

1. En [Render Dashboard](https://dashboard.render.com/) → **New +** → **Blueprint**.
2. Conecta el repositorio GitHub y selecciona la rama `develop`.
3. Render detectará `render.yaml` y creará los 3 servicios automáticamente.
4. Tras crear los servicios, en **`eusomnia-backend` → Environment**, añade las claves privadas:
   - `JWT_SECRET_KEY`
   - `OPENROUTER_API_KEY`
   - `EDAMAM_APP_ID` / `EDAMAM_APP_KEY`
   - `QDRANT_URL` / `QDRANT_API_KEY` / `QDRANT_COLLECTION`

### Notas importantes de despliegue

- **`psycopg[binary]`** se instala explícitamente en `Dockerfile.render` ya que SQLAlchemy 2.0 con Python 3.13 lo requiere como driver por defecto para PostgreSQL.
- **`SKIP_INSTALL_DEPS=true`** está configurado en el Static Site para evitar que Render intente ejecutar `pipenv install` al detectar el `Pipfile` en la raíz del repositorio.
- **Puerto 10000**: Render asigna dinámicamente el puerto `$PORT` (por defecto 10000). Gunicorn se enlaza a `0.0.0.0:${PORT:-10000}`.
- **Migraciones**: Se ejecutan automáticamente al arrancar el backend (`flask db upgrade` integrado en el `CMD` del Dockerfile).

---

## Estructura del proyecto

```
eusomnia/
├── src/
│   ├── app.py                      # Punto de entrada Flask + registro de Blueprints
│   ├── wsgi.py                     # Entrypoint para Gunicorn en producción
│   ├── api/
│   │   ├── extensions.py           # Extensiones Flask (db, bcrypt)
│   │   ├── models.py               # Importaciones centralizadas de modelos
│   │   ├── routes.py               # Registro del Blueprint maestro 'api'
│   │   ├── admin.py                # Panel Flask-Admin
│   │   ├── utils.py                # Utilidades y APIException
│   │   ├── blueprints/
│   │   │   ├── user_bp/            # Autenticación y perfil de usuario
│   │   │   ├── daily_entries_bp/   # CRUD del diario diario
│   │   │   ├── nutrition_bp/       # Análisis nutricional vía Edamam
│   │   │   ├── analysis_bp/        # Orquestación RAG + IA (LangGraph + OpenRouter)
│   │   │   └── exports_bp/         # Exportación de datos
│   │   └── services/
│   │       ├── qdrant_service.py   # Cliente Qdrant y búsqueda vectorial
│   │       ├── rag_graph.py        # Grafo LangGraph para el motor RAG
│   │       ├── embedding_provider.py
│   │       └── translation_service.py
│   └── frontend/
│       ├── main.jsx                # Punto de entrada React
│       ├── routes.jsx              # Configuración de React Router
│       ├── store.js                # Estado global (Flux / Context)
│       ├── api.js                  # Helper de URLs para la API
│       ├── Index.css               # Estilos globales
│       ├── pages/
│       │   ├── Home.jsx            # Página de inicio con resumen de registros
│       │   ├── RegistroDiario.jsx  # Formulario multistep de registro diario
│       │   ├── ResultadoDelDia.jsx # Resultado del análisis de IA
│       │   ├── Historial.jsx       # Historial de todos los registros
│       │   └── Perfil.jsx          # Perfil de usuario y preferencias de IA
│       ├── components/
│       │   ├── Navbar.jsx
│       │   ├── Footer.jsx
│       │   ├── Login.jsx
│       │   ├── Signup.jsx
│       │   ├── daily_entry/        # Componentes del formulario multistep
│       │   ├── daily_result/       # Componentes de la vista de resultado
│       │   └── home/               # Componentes de la página de inicio
│       └── hooks/
│           ├── StoreProvider.jsx   # Proveedor del estado global
│           ├── useGlobalReducer.jsx
│           └── actions.js          # Acciones del store
├── migrations/                     # Migraciones Flask-Migrate
├── tests/                          # Suite de pruebas (pytest + vitest)
├── data/                           # Diccionario onírico CSV (~8.000 símbolos)
├── .devcontainer/                  # Configuración Docker Compose del entorno de desarrollo
├── Dockerfile.render               # Imagen Docker para despliegue en producción (Render)
├── render.yaml                     # Blueprint Render (IaC): backend + frontend + BD
├── Pipfile                         # Dependencias Python
├── package.json                    # Dependencias Node.js
└── .env.example                    # Plantilla de variables de entorno
```

---

## Roadmap

### v1.0 — MVP ✅ Desplegado en producción

- [x] Configuración inicial del entorno (Docker, Pipenv, Vite)
- [x] Modelos SQLAlchemy y migraciones Flask-Migrate
- [x] Autenticación JWT + hashing de contraseñas con Bcrypt
- [x] Blueprints y endpoints del backend (user, daily_entries, nutrition, analysis, exports)
- [x] Motor RAG (LangGraph + Qdrant + ~8.000 símbolos oníricos)
- [x] Orquestación IA con OpenRouter (modelo configurable por usuario)
- [x] SPA React (Home, RegistroDiario, ResultadoDelDia, Historial, Perfil)
- [x] Despliegue en producción (Render + PostgreSQL 18)

### v1.1+ — Próximas funcionalidades

- [ ] Entrada de voz con transcripción (Whisper API)
- [ ] BYOAI Pro: clave y modelo propios del usuario
- [ ] Panel integral con gráficos de evolución temporal
- [ ] Mapa de símbolos y emociones sobre el histórico
- [ ] Motor de correlaciones propio sobre el historial acumulado

---

## Ciclo de uso

```
Registrar → Analizar → Recomendaciones → Ajustar hábitos → Registrar
```

Cada vuelta del ciclo enriquece el historial y mejora la precisión del análisis.

---

## Licencia

Este proyecto está bajo la licencia **MIT**. Consulta el fichero `LICENSE` para más detalles.
