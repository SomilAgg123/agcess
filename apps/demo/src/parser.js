// Browser equivalent of packages/parser/agcess_parser/parsers.py.
// Both implementations consume examples/field-work-cases.json in their tests.
export const TASKS = [
  "pruning",
  "harvesting",
  "irrigation",
  "planting",
  "scouting",
];
export const MAX_MESSAGE_LENGTH = 1600;
export const MAX_RECORDS = 20;

export class ParseError extends Error {
  constructor(code, message, line = null) {
    super(message);
    this.name = "ParseError";
    this.code = code;
    this.line = line;
  }
}

export function parseFieldWork(body) {
  if (typeof body !== "string")
    throw new ParseError("type", "Enter a text message.");
  if ([...body].length > MAX_MESSAGE_LENGTH)
    throw new ParseError(
      "too_long",
      "Keep the message within 1,600 characters.",
    );
  if (!body.trim()) throw new ParseError("empty", "Enter a message to parse.");
  const lines = body
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length > MAX_RECORDS)
    throw new ParseError(
      "too_many_lines",
      "Use at most 20 records per message.",
    );
  return lines.map((line, index) => {
    const number = index + 1;
    const parts = line.split("-").map((part) => part.trim());
    if (parts.length !== 4)
      throw new ParseError(
        "format",
        "Use field - task - people - hours.",
        number,
      );
    const [field, rawTask, people, hours] = parts;
    if (!/^[A-Za-z0-9][A-Za-z0-9 .'_]{0,59}$/.test(field)) {
      throw new ParseError(
        "field",
        "Use a field name of 1–60 letters, digits, spaces, or . ' _.",
        number,
      );
    }
    const task = rawTask.toLowerCase();
    if (!TASKS.includes(task))
      throw new ParseError(
        "task",
        "Choose pruning, harvesting, irrigation, planting, or scouting.",
        number,
      );
    if (
      !/^[0-9]+$/.test(people) ||
      Number(people) < 1 ||
      Number(people) > 100
    ) {
      throw new ParseError(
        "people",
        "People must be a whole number from 1 to 100.",
        number,
      );
    }
    if (
      !/^[0-9]+(?:\.[0-9]{1,2})?$/.test(hours) ||
      Number(hours) <= 0 ||
      Number(hours) > 24
    ) {
      throw new ParseError(
        "hours",
        "Hours must be a number from 0.01 to 24, with at most two decimal places.",
        number,
      );
    }
    return { field, task, people: Number(people), hours: Number(hours) };
  });
}
