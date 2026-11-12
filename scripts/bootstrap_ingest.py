"""Bootstrap script to ingest the dream dictionary CSV into Qdrant.

Este script es **idempotente**: si se ejecuta varias veces los puntos con el mismo
``id`` (la palabra clave) serán *upserted* y, por tanto, no se crearán duplicados.

El CSV ``diccionario.csv`` contiene dos formatos de fila.  La lógica para
determinar el identificador único está implementada dentro del método
``DreamRetrievalService.ingest_from_csv`` y sigue estas reglas:

* Si la columna ``symbol`` tiene más de una letra, su valor se utiliza como ``id``.
* En caso contrario (``symbol`` es una letra), se usa la columna ``context`` que
  contiene la palabra completa.

De esta forma, todas las entradas —independientemente de su posición en el
archivo— comparten un esquema de identificación consistente.
"""

from __future__ import annotations

import os
import sys

# Añadimos la raíz del proyecto al ``PYTHONPATH`` para poder importar módulos
# internos sin problemas de resolución.
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.append(PROJECT_ROOT)

from src.api.services.qdrant_service import DreamRetrievalService


def main() -> None:
    """Ejecuta la ingestión del CSV en Qdrant.

    La ruta al CSV se construye de forma absoluta a partir del directorio ``data``
    situado en la raíz del repositorio.  Si el archivo no existe, el script finaliza
    con un mensaje de error claro.
    """
    csv_path = os.path.abspath(os.path.join(PROJECT_ROOT, "data", "diccionario.csv"))

    if not os.path.isfile(csv_path):
        raise FileNotFoundError(f"CSV no encontrado en la ruta esperada: {csv_path}")

    # Instancia del servicio que gestiona la conexión a Qdrant y los embeddings.
    service = DreamRetrievalService()

    # ``ingest_from_csv`` gestiona internamente la lógica de selección del ``id``.
    inserted = service.ingest_from_csv(
        csv_path=csv_path,
        text_column="meaning",  # columna que contiene la explicación del sueño
        id_column="id",          # el método maneja la lógica de fallback descrita arriba
    )

    print(
        f"✅ Ingestión completada: {inserted} registros insertados en la colección "
        f"'{service.collection_name}'."
    )


if __name__ == "__main__":
    main()
