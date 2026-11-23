export const DEMO_DATE = "2026-05-22";
export const SAMPLES = [
  { label: "Field task", text: "North Plot - pruning - 3 - 2.5" },
  {
    label: "Two records",
    text: "South Plot - irrigation - 2 - 1.5\nEast Orchard - harvesting - 4 - 3",
  },
  { label: "Try an error", text: "North Plot - pruning - three - 2.5" },
];

// Every name, date, and amount below is fictional demonstration data.
export const INITIAL_RECORDS = [
  {
    id: "seed-1",
    date: "2026-05-22",
    field: "North Plot",
    task: "pruning",
    people: 3,
    hours: 2.5,
  },
  {
    id: "seed-2",
    date: "2026-05-22",
    field: "East Orchard",
    task: "harvesting",
    people: 5,
    hours: 4,
  },
  {
    id: "seed-3",
    date: "2026-05-21",
    field: "South Plot",
    task: "irrigation",
    people: 2,
    hours: 1.5,
  },
  {
    id: "seed-4",
    date: "2026-05-21",
    field: "West Field",
    task: "planting",
    people: 4,
    hours: 3,
  },
  {
    id: "seed-5",
    date: "2026-05-20",
    field: "North Plot",
    task: "scouting",
    people: 1,
    hours: 2,
  },
  {
    id: "seed-6",
    date: "2026-05-20",
    field: "East Orchard",
    task: "pruning",
    people: 3,
    hours: 3,
  },
  {
    id: "seed-7",
    date: "2026-05-19",
    field: "South Plot",
    task: "planting",
    people: 4,
    hours: 2,
  },
  {
    id: "seed-8",
    date: "2026-05-18",
    field: "West Field",
    task: "scouting",
    people: 2,
    hours: 1.5,
  },
];

export function summarize(records) {
  const laborHours = records.reduce(
    (sum, record) => sum + record.people * record.hours,
    0,
  );
  return {
    records: records.length,
    fields: new Set(records.map((record) => record.field)).size,
    laborHours: Math.round(laborHours * 100) / 100,
  };
}

export function filterRecords(
  records,
  { query = "", field = "", task = "" } = {},
) {
  const search = query.trim().toLowerCase();
  return records.filter(
    (record) =>
      (!field || record.field === field) &&
      (!task || record.task === task) &&
      `${record.field} ${record.task}`.toLowerCase().includes(search),
  );
}

export function activityHours(records) {
  const totals = new Map();
  for (const record of records)
    totals.set(
      record.task,
      (totals.get(record.task) || 0) + record.people * record.hours,
    );
  return [...totals]
    .sort((a, b) => b[1] - a[1])
    .map(([task, hours]) => ({ task, hours: Math.round(hours * 100) / 100 }));
}

export function toCsv(records) {
  const cell = (value) => {
    let text = String(value);
    // Also protect consumers if this utility is later used with non-parser input.
    if (/^[\s]*[=+@-]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  };
  return (
    [
      "Date,Field,Task,People,Hours,Labor hours",
      ...records.map((record) =>
        [
          record.date,
          record.field,
          record.task,
          record.people,
          record.hours,
          Math.round(record.people * record.hours * 100) / 100,
        ]
          .map(cell)
          .join(","),
      ),
    ].join("\r\n") + "\r\n"
  );
}
