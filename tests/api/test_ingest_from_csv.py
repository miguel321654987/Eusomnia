import csv
import os
import sys
import tempfile

import pytest

# Ensure the project src package is importable from the tests folder.
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
SRC_ROOT = os.path.join(PROJECT_ROOT, "src")
for _path in (SRC_ROOT, PROJECT_ROOT):
    if _path not in sys.path:
        sys.path.insert(0, _path)

from api.services.qdrant_service import DreamRetrievalService


class DummyService(DreamRetrievalService):
    """Subclass that overrides ``ingest_documents`` to capture records instead of
    sending them to Qdrant.
    """

    def __init__(self):
        # Initialise parent without triggering a real Qdrant connection.
        super().__init__(collection_name="test_collection", client=None, embeddings=None)
        self.ingested_records = None

    def ingest_documents(self, records, batch_size=64):
        """Capture the records passed to :meth:`DreamRetrievalService.ingest_documents`.

        The base class expects a ``batch_size`` keyword argument, so we preserve the
        signature to maintain compatibility while ignoring the batching behavior
        (the test operates purely in‑memory).
        """
        # Store records for later assertions and return them unchanged.
        self.ingested_records = records
        return records


def write_temp_csv(rows, header):
    """Helper to write rows to a temporary CSV file and return its path.

    Args:
        rows (list[dict]): List of row dictionaries matching the header keys.
        header (list[str]): Ordered list of column names.
    Returns:
        str: Path to the temporary CSV file.
    """
    fd, path = tempfile.mkstemp(suffix=".csv", text=True)
    os.close(fd)  # Close the descriptor; we'll open via csv module.
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=header)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)
    return path


def test_ingest_from_csv_id_selection_logic():
    """Verify that ``ingest_from_csv`` selects the correct ``id`` value.

    Scenarios covered:
    1. ``symbol`` longer than one character → use ``symbol``.
    2. ``symbol`` is a single character → fallback to ``context``.
    3. Both ``symbol`` and ``context`` empty → fallback to row index.
    4. ``symbol`` single character with empty ``context`` → fallback to index.
    """
    header = ["interpretation_text", "symbol", "context"]
    rows = [
        {"interpretation_text": "dream 1", "symbol": "AB", "context": "ctx1"},
        {"interpretation_text": "dream 2", "symbol": "C", "context": "ctx2"},
        {"interpretation_text": "dream 3", "symbol": "", "context": ""},
        {"interpretation_text": "dream 4", "symbol": "D", "context": ""},
    ]

    csv_path = write_temp_csv(rows, header)

    service = DummyService()
    service.ingest_from_csv(csv_path)

    # Ensure records were captured.
    assert service.ingested_records is not None
    assert len(service.ingested_records) == 4

    # Extract the computed IDs.
    ids = [rec["id"] for rec in service.ingested_records]

    # Expected IDs based on the logic in ``ingest_from_csv``.
    expected_ids = ["AB", "ctx2", "2", "3"]
    assert ids == expected_ids
