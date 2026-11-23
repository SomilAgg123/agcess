import test from "node:test";
import assert from "node:assert/strict";
import {
  INITIAL_RECORDS,
  summarize,
  filterRecords,
  activityHours,
  toCsv,
} from "../src/data.js";

test("summary uses person-hours, not elapsed hours or unique worker counts", () => {
  assert.deepEqual(summarize(INITIAL_RECORDS), {
    records: 8,
    fields: 4,
    laborHours: 64.5,
  });
  assert.deepEqual(summarize([]), { records: 0, fields: 0, laborHours: 0 });
});
test("filters combine and do not mutate the source", () => {
  const filtered = filterRecords(INITIAL_RECORDS, {
    field: "North Plot",
    task: "pruning",
    query: "NORTH",
  });
  assert.equal(filtered.length, 1);
  assert.equal(INITIAL_RECORDS.length, 8);
  assert.equal(
    filterRecords(INITIAL_RECORDS, { query: "not-found" }).length,
    0,
  );
});
test("activity totals equal dashboard total", () => {
  assert.equal(
    activityHours(INITIAL_RECORDS).reduce((sum, item) => sum + item.hours, 0),
    64.5,
  );
});
test("CSV escapes quotes, includes labor hours, and contains only selected records", () => {
  const output = toCsv([
    {
      date: "2026-05-22",
      field: 'Example "Plot"',
      task: "pruning",
      people: 3,
      hours: 2.5,
    },
  ]);
  assert.match(output, /"Example ""Plot"""/);
  assert.match(output, /"7.5"/);
  assert.equal(output.trim().split("\r\n").length, 2);
});
test("CSV protects against formula cells even for data from outside the parser", () => {
  const output = toCsv([
    {
      date: "2026-05-22",
      field: "=SUM(A1:A2)",
      task: "pruning",
      people: 1,
      hours: 1,
    },
  ]);
  assert.match(output, /"'=SUM\(A1:A2\)"/);
});
