# Esquema del Flujo RAG Completo: App de Interpretación de Sueños

## Descripción General

Este documento describe el flujo actualizado que usa Qdrant. Todos los identificadores del código permanecen en inglés.

---

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
  ▼ Compara con los puntos almacenados (no usa NumPy)
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
# Implements semantic retrieval using Qdrant instead of NumPy + .npy

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

- No se requiere archivo `.npy` porque Qdrant almacena los vectores de forma nativa.
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
| RETRIEVAL    | 3. Búsqueda      | Qdrant Client (`search`)         | Envía el vector al motor Qdrant y compara contra los puntos almacenados en la colección (reemplaza NumPy + `.npy`).         | Los puntos (`points`) con mayor similitud y sus IDs internos.                              |
| RETRIEVAL    | 4. Recuperación  | Qdrant / Tu código Python        | Extrae los `payload` (`interpretation_text`) de los puntos devueltos por Qdrant (reemplaza la lectura del CSV por índices). | Fragmentos de texto plano con los significados exactos (ej: "Gato: ...", "Mordisco: ..."). |
| AUGMENTATION | 5. Ensamblaje    | Tu código Python                 | Empaqueta el sueño original y los fragmentos recuperados de los payloads dentro de las instrucciones para la IA final.      | Un Prompt estructurado enriquecido con tus datos (Input para el LLM).                      |
| GENERATION   | 6. Generación    | El LLM (OpenAI / Claude / Llama) | Lee las instrucciones, combina los símbolos recuperados y redacta la narrativa final.                                       | Un Párrafo fluido, profesional y empático fundamentado en tus datos.                       |
