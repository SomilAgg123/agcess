import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";
import { parseFieldWork } from "../src/parser.js";

const cases = JSON.parse(
  readFileSync(
    new URL("../../../examples/field-work-cases.json", import.meta.url),
    "utf8",
  ),
);
for (const fixture of cases) {
  test(fixture.name, () => {
    if (fixture.error)
      assert.throws(
        () => parseFieldWork(fixture.input),
        (error) => error.code === fixture.error,
      );
    else assert.deepEqual(parseFieldWork(fixture.input), fixture.records);
  });
}
test("message and batch bounds match Python", () => {
  assert.throws(
    () => parseFieldWork("a".repeat(1601)),
    (error) => error.code === "too_long",
  );
  assert.throws(
    () => parseFieldWork("A-pruning-1-1\n".repeat(21)),
    (error) => error.code === "too_many_lines",
  );
  assert.equal(parseFieldWork("A-pruning-1-1\n".repeat(20)).length, 20);
});
test("error identifies the malformed line", () => {
  assert.throws(
    () => parseFieldWork("A-pruning-1-1\nB-unknown-1-1"),
    (error) => error.line === 2,
  );
});
