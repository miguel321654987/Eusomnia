<h1 align="center">
  🌙 Eusomnia
</h1>

<p align="center">
  <em>Interpreta tus sueños. Comprende tus hábitos. Mejora tu descanso.</em>
</p>

<p align="center">
  <!-- Frontend -->
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React 19"/>
  <img src="https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite"/>
  <img src="https://img.shields.io/badge/Bootstrap-5-7952B3?style=flat-square&logo=bootstrap&logoColor=white" alt="Bootstrap 5"/>
  <!-- Backend -->
  <img src="https://img.shields.io/badge/Python-3.13-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python 3.13"/>
  <img src="https://img.shields.io/badge/Flask-3.x-000000?style=flat-square&logo=flask&logoColor=white" alt="Flask"/>
  <img src="https://img.shields.io/badge/SQLAlchemy-ORM-D71F00?style=flat-square&logo=sqlalchemy&logoColor=white" alt="SQLAlchemy"/>
  <!-- Auth & seguridad -->
  <img src="https://img.shields.io/badge/JWT-Auth-000000?style=flat-square&logo=jsonwebtokens&logoColor=white" alt="JWT"/>
  <img src="https://img.shields.io/badge/Bcrypt-Hashing-4A90D9?style=flat-square&logo=letsencrypt&logoColor=white" alt="Bcrypt"/>
  <!-- Base de datos -->
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL 16"/>
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

---

## ¿Qué es Eusomnia?

**Eusomnia** es una aplicación web full-stack de análisis integrado de sueños y hábitos de vida.
El usuario registra su sueño del día junto con sus hábitos (actividad, alimentación, pantallas, sensaciones) y recibe una interpretación personalizada generada por IA, enriquecida con un motor de búsqueda semántica sobre un diccionario de ~7.000 símbolos oníricos.

El valor diferencial de Eusomnia es la **integración**: el sueño y los hábitos del día se analizan juntos en una única orquestación de IA, generando recomendaciones siempre justificadas por un dato concreto del registro o del historial.

---

## Características principales

| Módulo                      | Descripción                                                          |
| --------------------------- | -------------------------------------------------------------------- |
| 📖 **Diario de sueños**     | Registro diario de texto libre del sueño + bloque de hábitos del día |
| 🥗 **Análisis nutricional** | Enriquecimiento automático con calorías, cafeína y azúcar vía Edamam |

<!-- Added API documentation for nutrition endpoints -->

## API Endpoints – Nutrición

Los siguientes endpoints permiten analizar alimentos/recetas, registrar el análisis en una entrada diaria y evaluar el impacto sobre el sueño.

| Método | Ruta                            | Descripción                                                                                                                                                                                        |
| ------ | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST` | `/nutrition/analyze`            | Analiza una única consulta de alimento (texto libre) sin persistir. Espera `{ "query": "string", "meal_type": "breakfast"?, "caffeine_mg": number?, "alcohol_g": number?, "omega3_mg": number? }`. |
| `POST` | `/nutrition/analyze-recipe`     | Analiza una receta completa a partir de una lista de ingredientes. Espera `{ "ingredients": ["line1", "line2", ...], "title": "...", "meal_type": "lunch"?, ... }`.                                |
| `POST` | `/nutrition/log`                | Guarda el resultado del análisis asociado a una entrada diaria (`entry_id`). Payload incluye los mismos campos que en `/analyze-recipe` más `entry_id`.                                            |
| `GET`  | `/nutrition/log/<int:entry_id>` | Recupera el registro de nutrición guardado para la entrada indicada.                                                                                                                               |
| `POST` | `/nutrition/evaluate`           | Evalúa el log contra los parámetros de sueño (cafeína, alcohol, omega‑3, etc.) y devuelve una valoración de impacto.                                                                               |
| `GET`  | `/nutrition/parameters`         | Devuelve los límites y rangos de referencia definidos en `src/config/nutrition_sleep_parameters.json`.                                                                                             |

### Ejemplos cURL

```bash
# Analizar una sola comida
curl -X POST http://localhost:3000/nutrition/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT>" \
  -d '{"query": "espresso", "meal_type": "breakfast"}'

# Analizar una receta completa
curl -X POST http://localhost:3000/nutrition/analyze-recipe \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT>" \
  -d '{
    "title": "Ensalada mediterránea",
    "ingredients": ["2 tomates", "100g queso feta", "1 cucharada de aceite de oliva"],
    "meal_type": "lunch"
  }'

# Guardar el análisis en una entrada diaria (suponiendo entry_id=42)
curl -X POST http://localhost:3000/nutrition/log \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT>" \
  -d '{
    "entry_id": 42,
    "title": "Ensalada mediterránea",
    "ingredients": ["2 tomates", "100g queso feta", "1 cucharada de aceite de oliva"],
    "meal_type": "lunch"
  }'

# Evaluar el impacto de la nutrición registrada
curl -X POST http://localhost:3000/nutrition/evaluate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT>" \
  -d '{"entry_id": 42, "weight_kg": 70}'
```

| 🔍 **Motor RAG** | Búsqueda semántica de símbolos oníricos con `LangGraph` + Qdrant |
| 🤖 **Interpretación IA** | Un único JSON de OpenRouter: interpretación, emociones, símbolos, hábitos, patrones, recomendaciones y alertas |
| 📊 **Historial** | Consulta de todos los registros diarios con su análisis completo |
| 👤 **Perfil privado** | JWT + Bcrypt; el diario es estrictamente privado por usuario autenticado |
| 🔔 **Alertas** | Avisos automáticos ante patrones de riesgo (cafeína tardía, hábitos recurrentes...) |

---

## Stack tecnológico

### Frontend

- **React 19** con Hooks y Context API / Flux
- **React Router DOM** para enrutamiento de la SPA
- **Bootstrap 5 + CSS** para diseño responsivo
- **Vite** como bundler

### Backend

- **Python 3.13** con **Flask** y arquitectura MVC por **Blueprints**
- **SQLAlchemy ORM** — nunca SQL crudo
- **Flask-Migrate** para gestión de migraciones
- **Flask-JWT-Extended** para autenticación por token
- **Flask-Bcrypt** para hashing seguro de contraseñas
- **Gunicorn** como servidor WSGI en producción

### Base de datos

- **SQLite** en desarrollo local (`instance/example.db`)
- **PostgreSQL 16** en producción vía `DATABASE_URL`

### Inteligencia Artificial & Datos

- **OpenRouter** — orquestación IA (modelo configurable)
- **LangChain OpenAI embeddings** (`text-embedding-3-small`) — vectorización semántica
- **Qdrant** — motor de búsqueda vectorial para el diccionario onírico
- **Edamam API** — enriquecimiento nutricional (proxy desde Flask)

### Infraestructura

- **Docker + Docker Compose** — entorno de desarrollo con app + PostgreSQL 16
- **Dockerfile.render** — imagen de producción basada en `python:3.13-slim` + Gunicorn
- **Render** — despliegue en producción

---

## Arquitectura del flujo de análisis

```
Usuario (relato del sueño + hábitos + comida)
        │
        ▼
┌─────────────────────────────────────────────┐
│          FASE 1 · RETRIEVAL (RAG)           │
│  LangGraph → vector del sueño   │
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
- Node.js 18+
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
FLASK_APP_KEY=         # Secret key de Flask
FLASK_APP=src/app
FLASK_DEBUG=1

OPENROUTER_API_KEY=    # Clave de OpenRouter
CALORIE_NINJAS_KEY=    # Clave de Edamam
QDRANT_URL=http://localhost:6333
```

### 3. Levantar el entorno con Docker Compose

El devcontainer incluye la **app** y **PostgreSQL 16** preconfigurados:

```bash
docker compose up
```

> El servicio `db` arranca PostgreSQL 16 con usuario `gitpod`, base de datos `example` y contraseña `postgres`. Configura `DATABASE_URL` en tu `.env` si prefieres conectarte directamente.

### 4. Backend (Flask)

```bash
pipenv install
pipenv run init      # Inicializa la base de datos
pipenv run migrate   # Genera migraciones
pipenv run upgrade   # Aplica migraciones
pipenv run start     # Inicia el servidor en el puerto 3000
```

### 5. Frontend (React + Vite)

```bash
npm install
npm run start
```

### 6. Qdrant (motor vectorial)

```bash
docker run -p 6333:6333 qdrant/qdrant
```

### Ingestión de datos en Qdrant

**Variables de entorno** (añada al `.env`):

```dotenv
QDRANT_URL=https://<your-cluster>.eu-west-1-0.aws.cloud.qdrant.io
QDRANT_API_KEY=<your-api-key>
QDRANT_COLLECTION=Eusomnia
```

**Ingestión rápida (sin embeddings)**

Para cargar el CSV de ejemplo sin generar embeddings (útil cuando no hay acceso a OpenAI), ejecute el script ad‑hoc siguiente:

```bash
python - <<'PY'
import csv, os
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct

url = os.getenv('QDRANT_URL')
api_key = os.getenv('QDRANT_API_KEY')
collection = os.getenv('QDRANT_COLLECTION') or 'Eusomnia'

client = QdrantClient(url=url, api_key=api_key, check_compatibility=False)
if not client.collection_exists(collection):
    client.create_collection(
        collection_name=collection,
        vectors_config=VectorParams(size=10, distance=Distance.COSINE),
    )

csv_path = 'data/diccionario.csv'
points = []
with open(csv_path, newline='', encoding='utf-8') as f:
    for idx, row in enumerate(csv.DictReader(f)):
        vector = [0.0] * 10
        payload = {
            'meaning': row.get('meaning', ''),
            'symbol': row.get('symbol', ''),
            'context': row.get('context', ''),
        }
        points.append(PointStruct(id=idx, vector=vector, payload=payload))

# Upsert en lotes de 64
for i in range(0, len(points), 64):
    client.upsert(collection_name=collection, points=points[i:i+64])
print('Ingestión completada. Puntos totales:', client.get_collection(collection).points_count)
PY
```

**Ingestión con embeddings reales**

Si dispone de acceso a OpenRouter/OpenAI, use el script oficial que genera embeddings:

```bash
python scripts/bootstrap_ingest.py
```

**Verificación**

Compruebe que la colección contiene los documentos esperados:

```bash
curl -H "api-key: $QDRANT_API_KEY" "$QDRANT_URL/collections/$QDRANT_COLLECTION"
```

El campo `points_count` debe coincidir con el número de filas del CSV (≈ 8 010).

---

## Migraciones de base de datos

Ejecuta estos comandos **siempre que modifiques un modelo** de SQLAlchemy:

```bash
pipenv run migrate   # Genera el script de migración
pipenv run upgrade   # Aplica la migración a la base de datos
```

---

## Estructura del proyecto

```
eusomnia/
├── src/
│   ├── app.py           # Punto de entrada Flask + registro de Blueprints
│   ├── models.py        # Modelos SQLAlchemy (User, DailyEntry, SleepAnalysis…)
│   ├── admin.py         # Panel de administración Flask-Admin
│   ├── utils.py         # Utilidades y funciones reutilizables
│   └── api/
│       ├── user.py      # Blueprint: autenticación y perfil
│       ├── entries.py   # Blueprint: CRUD del diario diario
│       ├── nutrition.py # Blueprint: proxy Edamam
│       └── analysis.py  # Blueprint: orquestación RAG + IA
├── src/front/
│   ├── js/
│   │   ├── pages/       # Vistas principales (Home, Diary, Result, History, Profile)
│   │   ├── components/  # Componentes reutilizables (Navbar, Footer, Badges…)
│   │   └── store/       # Estado global (Context / Flux)
│   └── styles/          # CSS global y overrides de Bootstrap
├── migrations/          # Migraciones Flask-Migrate
├── .devcontainer/       # Configuración Docker Compose del entorno de desarrollo
├── Dockerfile.render    # Imagen Docker para despliegue en producción (Render)
├── Diagramas/           # Diagramas de arquitectura y modelo de datos
├── Proyecto-Eusomnia.md/# Documentación interna del proyecto
├── Pipfile
├── package.json
└── .env.example
```

---

## Roadmap

### v1.0 — MVP _(En desarrollo)_

- [x] Configuración inicial del entorno (Docker, Pipenv, Vite)
- [ ] Modelos SQLAlchemy y migraciones
- [ ] Autenticación JWT + hashing de contraseñas con Bcrypt
- [ ] Blueprints y endpoints del backend
- [ ] Motor RAG (LangGraph + Qdrant)
- [ ] Orquestación IA con OpenRouter
- [ ] SPA React (Home, Diario, Resultado, Historial, Perfil)
- [ ] Despliegue en producción (Render + PostgreSQL)

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
