# Esquema del Flujo RAG Completo: App de Interpretación de Sueños

## Descripción General

**Diagrama ASCII – Flujo completo (con Qdrant y Sentence‑Transformer)**

```
┌─1─┐  1️⃣ Entrada del usuario
│   │  (texto del sueño, hábitos, nutrición)
└─┬─┘
  │
  ▼
┌─2─┐  2️⃣ Front‑end → API
│   │  POST /daily_entries (JSON)
└─┬─┘
  │
  ▼
┌─3─┐  3️⃣ Persistencia (SQLAlchemy)
│   │  Crea fila en tabla daily_entries
└─┬─┘
  │
  ▼
┌─4─┐  4️⃣ Solicitud de análisis
│   │  POST /analysis/<entry_id>
└─┬─┘
  │
  ▼
┌─5─┐  5️⃣ Serialización
│   │  DailyEntry.serialize() → payload JSON
└─┬─┘
  │
  ▼
┌─6─┐  6️⃣ Vectorización (Sentence‑Transformer)
│   │  Convierte el texto del sueño en un vector denso
└─┬─┘
  │
  ▼
┌─7─┐  7️⃣ Búsqueda semántica (Qdrant)
│   │  Envía el vector a Qdrant y recupera los puntos más similares
└─┬─┘
  │
  ▼
┌─8─┐  8️⃣ Recuperación de contexto
│   │  Extrae `payload.interpretation_text` de los puntos (CSV)
└─┬─┘
  │
  ▼
┌─9─┐  9️⃣ Ensamblaje del Prompt
│   │  Une el sueño original + fragmentos recuperados en plantilla estructurada
└─┬─┘
  │
  ▼
┌─10─┐ 10️⃣ Orquestación
│    │  run_unified_ai_analysis(payload, key, model)
└─┬──┘
   │
   ▼
┌─11─┐ 11️⃣ Llamada a OpenRouter
│    │  POST /chat/completions con el prompt enriquecido
└─┬──┘
   │
   ▼
┌─12─┐ 12️⃣ Respuesta IA
│    │  JSON con 7 claves:
│    │   • interpretation
│    │   • predominant_emotions
│    │   • detected_symbols
│    │   • habits_reading
│    │   • patterns_detected
│    │   • recommendations
│    │   • alerts
└─┬──┘
   │
   ▼
┌─13─┐ 13️⃣ Respuesta al cliente
│    │  200 OK + resultados
└─┬──┘
   │
   ▼
┌─14─┐ 14️⃣ Gestión de versiones
│    │  Si ya existía SleepAnalysis → eliminar registro anterior
└─┬──┘
   │
   ▼
┌─15─┐ 15️⃣ Creación del nuevo análisis
│    │  Instanciar SleepAnalysis (list → json.dumps)
└─┬──┘
   │
   ▼
┌─16─┐ 16️⃣ Persistencia final
│    │  db.session.add + commit → tabla sleep_analyses
└─┬──┘
   │
   ▼
┌─17─┐ 17️⃣ Entrega final
│    │  JSON del análisis devuelto al front‑end
└────┘
```

---

### **Explicación resumida del flujo**

1. **Entrada del usuario** – El usuario escribe su sueño y datos asociados.
2. **Front‑end → API** – El cliente envía el registro mediante `POST /daily_entries`.
3. **Persistencia** – SQLAlchemy crea una fila en `daily_entries`.
4. **Solicitud de análisis** – El cliente llama a `POST /analysis/<id>`.
5. **Serialización** – El backend convierte la fila en un payload JSON.
6. **Vectorización** – _Sentence‑Transformer_ codifica el texto en un vector numérico.
7. **Búsqueda semántica** – Qdrant compara el vector con los almacenados y devuelve los puntos más similares.
8. **Recuperación de contexto** – Se extraen los textos de interpretación (`payload.interpretation_text`) de los puntos obtenidos (origen CSV).
9. **Ensamblaje del Prompt** – Se construye un prompt estructurado que incluye el sueño original y los fragmentos recuperados.
10. **Orquestación** – `run_unified_ai_analysis` prepara la llamada a la IA.
11. **Llamada a OpenRouter** – Se envía el prompt enriquecido a la API de LLM.
12. **Respuesta IA** – La IA devuelve un JSON con las 7 claves esperadas.
13. **Respuesta al cliente** – Backend devuelve `200 OK` con los resultados.
14. **Gestión de versiones** – Si ya existía un análisis previo, se elimina.
15. **Creación del nuevo análisis** – Se instancia `SleepAnalysis` (listas → `json.dumps`).
16. **Persistencia final** – Se guarda en `sleep_analyses` (`add` + `commit`).
17. **Entrega final** – Se envía el JSON completo al front‑end.

---

### **Fase RAG (Retrieval‑Augmented‑Generation)**

| Paso      | Acción                       | Herramienta / Tecnologías                                                                                                          |
| --------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **6**     | **Vectorización**            | _Sentence‑Transformer_ (`all‑MiniLM‑L6‑v2`) transforma el texto en un vector denso.                                                |
| **7**     | **Búsqueda semántica**       | Cliente **Qdrant** envía el vector y recibe los puntos más cercanos (top‑k).                                                       |
| **8**     | **Recuperación de contexto** | Se extraen los `payload.interpretation_text` de cada punto (originados del CSV del diccionario de sueños).                         |
| **9**     | **Ensamblaje del Prompt**    | El código Python combina el sueño del usuario y los fragmentos recuperados dentro de una plantilla estructurada, lista para la IA. |
| **10‑12** | **Generación**               | La IA (OpenRouter) procesa el prompt enriquecido y devuelve la interpretación estructurada.                                        |

Estos bloques resaltan cómo el flujo incorpora la lógica RAG antes de la generación final del análisis onírico.

## Flujo Actualizado

```
[ USUARIO ]
  ▼ Escribe sueño breve
  "Soñé que un felino me mordía la mano"

===============================================================
FASE 1: RECUPERACIÓN (Retrieval Semántico con Qdrant)
===============================================================
  ▼
[ APP (Sentence-Transformer) ]
  ▼ Convierte el sueño en números
  Vector: [0.12, -0.45, 0.89, ...]
  ▼
[ QDRANT (Local / Cloud) ]
  ▼ Envía el vector al motor Qdrant
  ▼ Compara con los puntos almacenados
  ▼ Devuelve los puntos más cercanos (ej: id_14, id_89)
  ▼
[ TU DICCIONARIO (fuente CSV) ]
  ▼ Usa los payloads de los puntos para extraer el texto
  Contexto extraído:
  - "Gato: Representa intuición o traición oculta."
  - "Mordisco: Conflicto inminente o agresión."

===============================================================
FASE 2: AUMENTACIÓN (Ensamblaje del Prompt)
===============================================================
[ EL PROMPT (App) ]
  ▼ Une el sueño del usuario y los payloads extraídos
  ▼ Dentro de una plantilla estructurada con instrucciones
  Resultado: Un solo bloque de texto listo para la API

===============================================================
FASE 3: GENERACIÓN (Respuesta Final con LLM)
===============================================================
[ IA (LLM) ]
  ▼ Recibe el prompt enriquecido con datos de Qdrant
  ▼ Redacta una interpretación fluida, empática y coherente
  Resultado: String narrativo final
  ▼
[ USUARIO ]
  "Tu sueño sugiere un conflicto (mordisco) con tu lado intuitivo (felino)..."
```

---

## Ejemplo de Implementación

```python
# services/qdrant_service.py
# Implements semantic retrieval using Qdrant

import os
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient


class DreamRetrievalService:
    # Initialize embedding model and Qdrant connection
    def __init__(self, collection_name="dream_dictionary"):
        # Load connection details from environment variables (.env)
        qdrant_url = os.getenv("QDRANT_URL", "http://localhost:6333")
        self.model = SentenceTransformer("all-MiniLM-L6-v2")
        self.client = QdrantClient(url=qdrant_url)
        self.collection = collection_name

    def encode_dream(self, dream_text):
        # Convert user dream text into a dense vector
        try:
            vector = self.model.encode(dream_text).tolist()
            return vector
        except Exception as e:
            # Structured error handling for encoding failures
            raise ValueError(f"Failed to encode dream text: {e}")

    def retrieve_context(self, dream_text, top_k=2):
        # Build query vector from the user's description
        query_vector = self.encode_dream(dream_text)
        # Search inside Qdrant; similarity math is handled internally
        try:
            results = self.client.search(
                collection_name=self.collection,
                query_vector=query_vector,
                limit=top_k,
                with_payload=True,
            )
            # Extract payload texts that replace CSV index lookup
            contexts = []
            for point in results:
                payload_text = point.payload.get("interpretation_text")
                if payload_text:
                    contexts.append(payload_text)
            return contexts
        except Exception as e:
            # Handle retrieval errors without exposing internals
            raise ConnectionError(f"Qdrant retrieval failed: {e}")
```

---

## Notas Técnicas

- Qdrant almacena los vectores de forma nativa.
- El archivo `CSV` sigue siendo la fuente original para cargar la colección.
- Las variables de entorno (`QDRANT_URL`) deben definirse en `.env`.
- Si existen modelos `SQLAlchemy` en el proyecto, cualquier cambio requiere ejecutar
  `flask db migrate` y `flask db upgrade`.

---

## Matriz de Componentes: Quién hace qué y qué se obtiene

| Fase RAG     | Paso             | Quién actúa                      | Qué hace exactamente                                                                                                        | Qué se obtiene (Output)                                                                    |
| ------------ | ---------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Inicio       | 1. Entrada       | El Usuario                       | Introduce su experiencia en la app.                                                                                         | El string: "Soñé que un felino me mordía la mano".                                         |
| RETRIEVAL    | 2. Vectorización | sentence-transformers            | Traduce el lenguaje humano a coordenadas matemáticas que capturan el significado.                                           | Un Vector (Tensor/Array) de números que representa conceptualmente el sueño.               |
| RETRIEVAL    | 3. Búsqueda      | Qdrant Client (`search`)         | Envía el vector al motor Qdrant y compara contra los puntos almacenados en la colección.                                    | Los puntos (`points`) con mayor similitud y sus IDs internos.                              |
| RETRIEVAL    | 4. Recuperación  | Qdrant / Tu código Python        | Extrae los `payload` (`interpretation_text`) de los puntos devueltos por Qdrant (reemplaza la lectura del CSV por índices). | Fragmentos de texto plano con los significados exactos (ej: "Gato: ...", "Mordisco: ..."). |
| AUGMENTATION | 5. Ensamblaje    | Tu código Python                 | Empaqueta el sueño original y los fragmentos recuperados de los payloads dentro de las instrucciones para la IA final.      | Un Prompt estructurado enriquecido con tus datos (Input para el LLM).                      |
| GENERATION   | 6. Generación    | El LLM (OpenAI / Claude / Llama) | Lee las instrucciones, combina los símbolos recuperados y redacta la narrativa final.                                       | Un Párrafo fluido, profesional y empático fundamentado en tus datos.                       |
