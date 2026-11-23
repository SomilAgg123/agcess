# Agcess

**Agricultural field data, captured through SMS.**

Agcess turns structured text messages into records that can be explored through dashboards and reports. Originally developed as a team project in 2022, it connects a familiar field interface—text messaging—with structured data tools.

This repository is a portfolio restoration of that work. It starts with a clean history and uses fictional examples. Development is being proposed through pull requests: first reusable parsers, then an interactive browser demo and deployment setup.

The original architecture used Python/Flask, Twilio, PostgreSQL, React, and earlier Dash/Airtable reporting paths. The portfolio demo will simulate the SMS-to-dashboard workflow without connecting to the original services.

See [AUTHORS.md](AUTHORS.md) for credits and [NOTICE.md](NOTICE.md) for the restoration and licensing status.

## Reusable parsers

The Python package preserves three message workflows with explicit validation and no external services:

- Field work: field, activity, people, and hours, with explicit newline batches.
- Product metadata: the original five-token record shape.
- Research samples: counts or coordinates with caller-supplied location metadata.

Run the tests from the root with Python 3.11 or newer:

```sh
PYTHONPATH=packages/parser python3 -m unittest discover -s packages/parser/tests -v
```

For inputs, limits, and intentional changes from the original project, see the [parser contract](docs/parser-contract.md).
