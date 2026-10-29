import csv
import io
import json
import re
from datetime import date

from flask import Response, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from fpdf import FPDF
from fpdf.enums import WrapMode, XPos, YPos
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from api.blueprints.daily_entries_bp.models import DailyEntry
from api.blueprints.user_bp.models import User
from api.extensions import db
from api.utils import APIException
from . import exports_bp


def _parse_date_range():
    start_value = request.args.get("start_date")
    end_value = request.args.get("end_date")
    if not start_value and not end_value:
        return None, None
    if not start_value or not end_value:
        raise APIException(
            "Both start_date and end_date are required", status_code=400
        )
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", start_value) or not re.fullmatch(
        r"\d{4}-\d{2}-\d{2}", end_value
    ):
        raise APIException(
            "Dates must use the YYYY-MM-DD format", status_code=400
        )
    try:
        start_date = date.fromisoformat(start_value)
        end_date = date.fromisoformat(end_value)
    except ValueError as exc:
        raise APIException(
            "Dates must use the YYYY-MM-DD format", status_code=400
        ) from exc
    if start_date > end_date:
        raise APIException(
            "start_date must be earlier than or equal to end_date",
            status_code=400,
        )
    return start_date, end_date


def _get_entries(user_id, start_date, end_date):
    statement = (
        select(DailyEntry)
        .where(DailyEntry.user_id == user_id)
        .options(
            selectinload(DailyEntry.sleep_report),
            selectinload(DailyEntry.habit_log),
            selectinload(DailyEntry.nutrition_log),
            selectinload(DailyEntry.analysis),
        )
        .order_by(DailyEntry.entry_date.asc(), DailyEntry.id.asc())
    )
    if start_date is not None:
        statement = statement.where(DailyEntry.entry_date >= start_date)
    if end_date is not None:
        statement = statement.where(DailyEntry.entry_date <= end_date)
    return db.session.scalars(statement).all()


def _csv_safe(value):
    if value is None:
        return ""
    text = str(value)
    if text.startswith(("=", "+", "-", "@", "\t", "\r")):
        return f"'{text}"
    return text


def _pdf_text(value):
    if value is None:
        return ""
    return str(value).encode("cp1252", errors="replace").decode("cp1252")


def _pdf_multi_cell(pdf, height, value):
    pdf.multi_cell(
        0,
        height,
        _pdf_text(value),
        new_x=XPos.LMARGIN,
        new_y=YPos.NEXT,
        wrapmode=WrapMode.CHAR,
    )


def _build_pdf(user, entries, start_date, end_date):
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=16)
    pdf.add_page()
    pdf.set_text_color(22, 38, 58)
    pdf.set_font("Helvetica", "B", 18)
    _pdf_multi_cell(pdf, 10, "Eusomnia - Exportación de registros")
    pdf.set_font("Helvetica", "", 10)
    _pdf_multi_cell(pdf, 6, f"Cuenta: {user.name} {user.last_name}")
    _pdf_multi_cell(
        pdf,
        6,
        f"Periodo: {start_date.isoformat() if start_date else 'Todo'} - "
        f"{end_date.isoformat() if end_date else 'Todo'}",
    )
    _pdf_multi_cell(pdf, 6, f"Registros incluidos: {len(entries)}")
    pdf.ln(5)

    for entry in entries:
        pdf.set_font("Helvetica", "B", 12)
        _pdf_multi_cell(pdf, 8, f"Registro del {entry.entry_date.isoformat()}")
        pdf.set_font("Helvetica", "", 10)
        if entry.original_entry_date != entry.entry_date:
            _pdf_multi_cell(
                pdf,
                6,
                f"Fecha original: {entry.original_entry_date.isoformat()}",
            )

        sleep_report = entry.sleep_report
        if sleep_report:
            pdf.set_font("Helvetica", "B", 10)
            _pdf_multi_cell(pdf, 6, "Relato del sueño")
            pdf.set_font("Helvetica", "", 10)
            _pdf_multi_cell(
                pdf,
                6,
                f"Texto original: {sleep_report.raw_text}\n"
                f"Texto final: {sleep_report.final_text or sleep_report.raw_text}\n"
                f"Audio: {sleep_report.audio_url or 'Sin archivo'}",
            )

        habits = entry.habit_log
        if habits:
            pdf.set_font("Helvetica", "B", 10)
            _pdf_multi_cell(pdf, 6, "Sueño y hábitos")
            pdf.set_font("Helvetica", "", 10)
            details = [
                f"{key}: {value if value is not None else 'Sin dato'}"
                for key, value in habits.serialize().items()
                if key != "entry_id"
            ]
            _pdf_multi_cell(pdf, 6, "\n".join(details))

        nutrition = entry.nutrition_log
        if nutrition:
            pdf.set_font("Helvetica", "B", 10)
            _pdf_multi_cell(pdf, 6, "Nutrición registrada")
            pdf.set_font("Helvetica", "", 10)
            details = [
                f"{key}: {value if value is not None else 'Sin dato'}"
                for key, value in nutrition.serialize().items()
                if key != "entry_id"
            ]
            _pdf_multi_cell(pdf, 6, "\n".join(details))

        analysis = entry.analysis
        if analysis:
            pdf.set_font("Helvetica", "B", 10)
            _pdf_multi_cell(pdf, 6, "Análisis guardado")
            pdf.set_font("Helvetica", "", 10)
            details = [
                f"{key}: {value if value is not None else 'Sin dato'}"
                for key, value in analysis.serialize().items()
                if key not in {"id", "entry_id"}
            ]
            _pdf_multi_cell(pdf, 6, "\n".join(details))
        pdf.ln(5)

    return bytes(pdf.output())


@exports_bp.route("/json", methods=["GET"])
@jwt_required()
def export_json():
    user_id = int(get_jwt_identity())
    start_date, end_date = _parse_date_range()
    entries = _get_entries(user_id, start_date, end_date)
    return jsonify({
        "message": "User data exported successfully",
        "results": [entry.serialize() for entry in entries],
    }), 200


@exports_bp.route("/csv", methods=["GET"])
@jwt_required()
def export_csv():
    user_id = int(get_jwt_identity())
    start_date, end_date = _parse_date_range()
    entries = _get_entries(user_id, start_date, end_date)
    output = io.StringIO(newline="")
    writer = csv.writer(output)
    writer.writerow([
        "entry_id",
        "entry_date",
        "original_entry_date",
        "created_at",
        "updated_at",
        "sleep_report_json",
        "habit_log_json",
        "nutrition_log_json",
        "analysis_json",
    ])
    for entry in entries:
        writer.writerow([
            _csv_safe(entry.id),
            _csv_safe(entry.entry_date.isoformat()),
            _csv_safe(entry.original_entry_date.isoformat()),
            _csv_safe(entry.created_at.isoformat() if entry.created_at else ""),
            _csv_safe(entry.updated_at.isoformat() if entry.updated_at else ""),
            _csv_safe(
                json.dumps(
                    entry.sleep_report.serialize() if entry.sleep_report else None,
                    ensure_ascii=False,
                )
            ),
            _csv_safe(
                json.dumps(
                    entry.habit_log.serialize() if entry.habit_log else None,
                    ensure_ascii=False,
                )
            ),
            _csv_safe(
                json.dumps(
                    entry.nutrition_log.serialize() if entry.nutrition_log else None,
                    ensure_ascii=False,
                )
            ),
            _csv_safe(
                json.dumps(
                    entry.analysis.serialize() if entry.analysis else None,
                    ensure_ascii=False,
                )
            ),
        ])
    return Response(
        output.getvalue(),
        mimetype="text/csv; charset=utf-8",
        headers={"Content-Disposition": "attachment; filename=eusomnia-export.csv"},
    )


@exports_bp.route("/pdf", methods=["GET"])
@jwt_required()
def export_pdf():
    user_id = int(get_jwt_identity())
    start_date, end_date = _parse_date_range()
    user = db.session.get(User, user_id)
    if user is None:
        raise APIException("User not found", status_code=404)
    entries = _get_entries(user_id, start_date, end_date)
    pdf_bytes = _build_pdf(user, entries, start_date, end_date)
    return Response(
        pdf_bytes,
        mimetype="application/pdf",
        headers={"Content-Disposition": "attachment; filename=eusomnia-report.pdf"},
    )
