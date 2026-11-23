"""Bounded, side-effect-free adaptations of Agcess's original SMS workflows."""

import math
import re
from collections.abc import Mapping

MAX_MESSAGE_LENGTH = 1600
MAX_RECORDS = 20
TASKS = frozenset({"pruning", "harvesting", "irrigation", "planting", "scouting"})


class ParseError(ValueError):
    """A public validation error with a stable code and optional line number."""

    def __init__(self, code: str, message: str, line: int | None = None):
        super().__init__(message)
        self.code = code
        self.line = line


def _body(body: str) -> str:
    if not isinstance(body, str):
        raise ParseError("type", "Enter a text message.")
    if len(body) > MAX_MESSAGE_LENGTH:
        raise ParseError("too_long", "Keep the message within 1,600 characters.")
    if not body.strip():
        raise ParseError("empty", "Enter a message to parse.")
    return body.strip()


def parse_field_work(body: str) -> list[dict]:
    """Parse one 'field - task - people - hours' record per nonempty line.

    Spaces inside field names are retained. Hyphens separate the four parts.
    People is an integer from 1 to 100; hours is a decimal greater than zero
    and at most 24. Explicit lines replace legacy implicit batch expansion.
    """
    _body(body)  # Validate without losing the message's original line numbers.
    lines = [(number, line.strip()) for number, line in enumerate(body.split("\n"), 1) if line.strip()]
    if len(lines) > MAX_RECORDS:
        raise ParseError("too_many_lines", "Use at most 20 records per message.")
    records = []
    for number, line in lines:
        parts = [part.strip() for part in line.split("-")]
        if len(parts) != 4:
            raise ParseError("format", "Use field - task - people - hours.", number)
        field, task, people, hours = parts
        if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9 .'_]{0,59}", field):
            raise ParseError("field", "Use a field name of 1–60 letters, digits, spaces, or . ' _.", number)
        task = task.lower()
        if task not in TASKS:
            raise ParseError("task", "Choose pruning, harvesting, irrigation, planting, or scouting.", number)
        if not re.fullmatch(r"[0-9]+", people) or not 1 <= int(people) <= 100:
            raise ParseError("people", "People must be a whole number from 1 to 100.", number)
        if not re.fullmatch(r"[0-9]+(?:\.[0-9]{1,2})?", hours):
            raise ParseError("hours", "Hours must be a number from 0.01 to 24, with at most two decimal places.", number)
        duration = float(hours)
        if not 0 < duration <= 24:
            raise ParseError("hours", "Hours must be a number from 0.01 to 24, with at most two decimal places.", number)
        records.append({"field": field, "task": task, "people": int(people), "hours": duration})
    return records


def parse_product(body: str) -> list[dict]:
    """Preserve the original five-token product metadata format.

    Values are labels, not verified chemical handling instructions. This parser
    provides no advice about application, protective equipment, or reentry.
    """
    parts = _body(body).split()
    if len(parts) != 5:
        raise ParseError("format", "Use exactly five product metadata tokens.")
    keys = ("Product_name", "Active_ingredients", "Registration_number", "REI", "PPE")
    return [dict(zip(keys, parts, strict=True))]


def parse_sample(body: str, locations: Mapping[str, Mapping]) -> list[dict]:
    """Parse a configured research location plus tube count or coordinates.

    Accepted forms: 'CODE 3', 'CODE 42.0 -76.0', and
    'CODE sensor 42.0 -76.0', optionally followed by ': notes'.
    Location metadata must be supplied by the caller; no client files are read.
    """
    content, _, notes = _body(body).partition(":")
    parts = content.split()
    if len(parts) not in (2, 3, 4) or (len(parts) == 4 and parts[1] != "sensor"):
        raise ParseError("format", "Use CODE count, CODE latitude longitude, or CODE sensor latitude longitude.")
    code = parts[0]
    if code not in locations:
        raise ParseError("location", "Choose a configured research location.")
    record = dict(locations[code])
    record["location_code"] = code
    if len(parts) == 2:
        if not re.fullmatch(r"[0-9]+", parts[1]) or not 0 <= int(parts[1]) <= 1000:
            raise ParseError("count", "Tube count must be a whole number from 0 to 1,000.")
        record["n_tubes"] = int(parts[1])
    else:
        try:
            latitude, longitude = map(float, parts[-2:])
        except ValueError as exc:
            raise ParseError("coordinates", "Enter numeric latitude and longitude.") from exc
        if not math.isfinite(latitude) or not math.isfinite(longitude) or not -90 <= latitude <= 90 or not -180 <= longitude <= 180:
            raise ParseError("coordinates", "Latitude must be within ±90 and longitude within ±180.")
        record.update({"lat": latitude, "long": longitude})
    if notes.strip():
        record["notes"] = notes.strip()
    return [record]
