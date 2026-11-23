# Message contracts

All parsers are pure Python functions. They return records or raise `ParseError`, with a stable `code` and, for field work, a `line`. They do not read files, connect to a database, or contact messaging services. Python 3.11 or newer is required; parsing has no third-party runtime dependencies.

## Field work

```text
North Plot - pruning - 3 - 2.5
South Plot - irrigation - 1 - 0.25
```

One nonempty line produces one record with `field`, `task`, `people`, and `hours`. A message is validated as a whole: a malformed line rejects the batch without storing any records. Hyphens separate the four parts; do not use hyphens inside a field name. Multi-word names retain their spaces. Task names are normalized to lowercase.

The portfolio contract allows pruning, harvesting, irrigation, planting, and scouting. These are illustrative activities, not a recovered client configuration. People must be a whole number from 1 to 100. Hours must be greater than zero and at most 24, with up to two decimal places. There are at most 20 records and 1,600 characters per message. Field names are 1–60 ASCII letters, digits, spaces, or `. ' _`, beginning with a letter or digit.

The original field-work parser expanded whitespace-separated values into combinations and tried to recover implicitly joined messages. That behavior could hang on malformed input. This restoration replaces it with explicit newline batches and bounded validation. It keeps the four-part message concept, but is not a drop-in production API replacement.

The shared examples in `examples/field-work-cases.json` define behavior for Python and the browser simulation. They include the malformed boundary that caused the old parser to hang.

## Product metadata

`parse_product` preserves the original five-token mapping to `Product_name`, `Active_ingredients`, `Registration_number`, `REI`, and `PPE`. Use fictional labels in examples. This is record parsing, not verification of product safety or handling instructions.

## Research samples

`parse_sample(body, locations)` adapts the original tube-count and location formats:

- `DEMO1 3`: a sample count.
- `DEMO1 42.0 -76.0`: a location reading.
- `DEMO1 sensor 42.0 -76.0`: an explicitly labeled sensor location.
- Append `: morning sample` to include notes.

The caller provides a location-to-metadata mapping. Original crop assignments, experiment identifiers, and private client mappings are not included. Counts and coordinates are checked, and the supplied mapping is never mutated. The original client-specific identifier decoding has been replaced by explicit configuration.

## Running the checks

From the repository root:

```sh
PYTHONPATH=packages/parser python3 -m unittest discover -s packages/parser/tests -v
```

Optionally install the package into an isolated environment:

```sh
python3 -m venv .venv
. .venv/bin/activate
python -m pip install -e packages/parser
```
