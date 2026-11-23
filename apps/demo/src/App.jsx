import { useEffect, useMemo, useRef, useState } from "react";
import { parseFieldWork, TASKS, MAX_MESSAGE_LENGTH } from "./parser.js";
import {
  INITIAL_RECORDS,
  DEMO_DATE,
  SAMPLES,
  summarize,
  filterRecords,
  activityHours,
  toCsv,
} from "./data.js";

const SOURCE = "https://github.com/SomilAgg123/agcess";
const formatNumber = (value) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
const formatDate = (value) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00Z`));

function Icon({ name, ...props }) {
  const paths = {
    leaf: (
      <>
        <path d="M5 19C5 9 12 5 21 3c0 10-5 16-16 16Z" />
        <path d="M3 21 15 9" />
      </>
    ),
    message: <path d="M20 11a8 8 0 0 1-8 8H5l-3 3V11a9 9 0 1 1 18 0Z" />,
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    download: (
      <>
        <path d="M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5" />
      </>
    ),
    reset: (
      <>
        <path d="M3 10a9 9 0 1 1 2 8M3 4v6h6" />
      </>
    ),
    search: (
      <>
        <circle cx="10" cy="10" r="6" />
        <path d="m15 15 6 6" />
      </>
    ),
    check: <path d="m5 12 4 4L20 5" />,
    code: (
      <>
        <path d="m7 6-6 6 6 6m10-12 6 6-6 6M14 3l-4 18" />
      </>
    ),
  };
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}

function FieldIllustration() {
  return (
    <div className="field-scene" aria-hidden="true">
      <svg className="field-map" viewBox="0 0 520 310" fill="none">
        <defs>
          <pattern
            id="rows"
            width="14"
            height="14"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(-30)"
          >
            <path d="M0 0v14" stroke="#5a8869" strokeWidth="2" />
          </pattern>
          <pattern
            id="dots"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="5" cy="5" r="3" fill="#8eaf83" />
          </pattern>
        </defs>
        <path d="M18 100 233 12l266 106-216 179Z" fill="#dbe7d1" />
        <path d="m28 98 128-52 103 44-128 62Z" fill="#9fbd86" />
        <path d="m28 98 128-52 103 44-128 62Z" fill="url(#rows)" />
        <path d="m172 40 60-25 142 58-83 59Z" fill="#acc89c" />
        <path d="m172 40 60-25 142 58-83 59Z" fill="url(#dots)" />
        <path d="m144 162 126-61 97 44-121 87Z" fill="#548269" />
        <path d="m144 162 126-61 97 44-121 87Z" fill="url(#rows)" />
        <path d="m307 139 79-57 99 40-102 83Z" fill="#bad296" />
        <path d="m260 240 120-83 90-32-188 153Z" fill="#73996f" />
        <path
          d="m132 44 14 47-44 62 27 48 97 44 46 50"
          stroke="#f9fbf5"
          strokeWidth="9"
        />
        <path
          d="m212 26 52 66 36 47 81 14 108-29"
          stroke="#f9fbf5"
          strokeWidth="7"
        />
        <circle cx="233" cy="173" r="12" fill="#c9ef96" />
        <circle cx="233" cy="173" r="5" fill="#204c36" />
        <path
          d="M233 160v-43h71"
          stroke="#204c36"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
      </svg>
      <div className="map-note">
        <span className="map-note-icon">
          <Icon name="message" />
        </span>
        <div>
          <strong>North Plot</strong>
          <span>Pruning · 3 people · 2.5 hours</span>
        </div>
        <span className="map-check">
          <Icon name="check" />
        </span>
      </div>
      <div className="map-caption">ONE FIELD NOTE. A STRUCTURED RECORD.</div>
    </div>
  );
}

function RecordPreview({ records }) {
  return (
    <div className="parsed-records">
      {records.map((record, i) => (
        <dl className="parsed-record" key={i}>
          <div>
            <dt>Field</dt>
            <dd>{record.field}</dd>
          </div>
          <div>
            <dt>Activity</dt>
            <dd className="capitalize">{record.task}</dd>
          </div>
          <div>
            <dt>People</dt>
            <dd>{record.people}</dd>
          </div>
          <div>
            <dt>Hours</dt>
            <dd>{record.hours}</dd>
          </div>
        </dl>
      ))}
    </div>
  );
}

export default function App() {
  const [message, setMessage] = useState(SAMPLES[0].text);
  const [records, setRecords] = useState(() =>
    INITIAL_RECORDS.map((record) => ({ ...record })),
  );
  const [parsed, setParsed] = useState([]);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState("");
  const [filters, setFilters] = useState({ query: "", field: "", task: "" });
  const [resetOpen, setResetOpen] = useState(false);
  const messageRef = useRef(null);
  const resetButtonRef = useRef(null);
  const cancelResetRef = useRef(null);
  const resetDialogRef = useRef(null);
  useEffect(() => {
    const dialog = resetDialogRef.current;
    if (resetOpen) {
      if (!dialog.open) dialog.showModal();
      cancelResetRef.current?.focus();
    } else if (dialog.open) {
      dialog.close();
      resetButtonRef.current?.focus();
    }
  }, [resetOpen]);
  const visible = useMemo(
    () => filterRecords(records, filters),
    [records, filters],
  );
  const summary = summarize(visible);
  const activities = activityHours(visible);
  const fields = [...new Set(records.map((record) => record.field))].sort();
  const hasFilters = Object.values(filters).some(Boolean);
  const newCount = records.filter((record) => record.added).length;

  function updateMessage(value) {
    setMessage(value);
    setParsed([]);
    setError(null);
    setNotice("");
  }
  function parse(event) {
    event.preventDefault();
    setNotice("");
    try {
      const result = parseFieldWork(message);
      setParsed(result);
      setError(null);
      setNotice(
        `${result.length} ${result.length === 1 ? "record is" : "records are"} ready to add.`,
      );
    } catch (problem) {
      setParsed([]);
      setError(problem);
      messageRef.current?.focus();
    }
  }
  function addRecords() {
    if (!parsed.length) return;
    if (records.length + parsed.length > 200) {
      setNotice(
        "This demo holds up to 200 records. Reset the demo to start again.",
      );
      return;
    }
    setRecords((current) => [
      ...parsed.map((record) => ({
        ...record,
        id: crypto.randomUUID(),
        date: DEMO_DATE,
        added: true,
      })),
      ...current,
    ]);
    setFilters({ query: "", field: "", task: "" });
    setNotice(
      `Added ${parsed.length} ${parsed.length === 1 ? "record" : "records"} to the dashboard. Filters have been cleared.`,
    );
    setParsed([]);
  }
  function exportCsv() {
    const url = URL.createObjectURL(
      new Blob([toCsv(visible)], { type: "text/csv;charset=utf-8;" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "agcess-fictional-records.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice(`Exported ${visible.length} fictional records.`);
  }
  function closeReset() {
    setResetOpen(false);
  }
  function reset() {
    setRecords(INITIAL_RECORDS.map((record) => ({ ...record })));
    setFilters({ query: "", field: "", task: "" });
    setMessage(SAMPLES[0].text);
    setParsed([]);
    setError(null);
    setNotice("Demo reset. The original eight fictional records are restored.");
    closeReset();
  }

  return (
    <>
      <a className="skip-link" href="#demo">
        Skip to interactive demo
      </a>
      <header className="site-header">
        <div className="container nav-row">
          <a className="brand" href="#top" aria-label="Agcess home">
            <span className="brand-mark">
              <Icon name="leaf" />
            </span>
            agcess<span className="brand-tag">FIELD NOTES, CONNECTED</span>
          </a>
          <nav aria-label="Main navigation">
            <a href="#story">The project</a>
            <a href={SOURCE}>
              View source <Icon name="code" />
            </a>
          </nav>
        </div>
      </header>

      <main id="top">
        <section className="hero container" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow">FROM A TEXT MESSAGE TO A BETTER RECORD</p>
            <h1 id="hero-title">
              From the field,
              <br />
              <em>into focus.</em>
            </h1>
            <p className="hero-description">
              A simple text can tell a bigger story. Agcess turns agricultural
              field notes into structured data for dashboards and reports.
            </p>
            <a className="button primary" href="#demo">
              Explore the demo
            </a>
            <span className="hero-footnote">
              A restoration of the original 2022 team project.
            </span>
          </div>
          <FieldIllustration />
        </section>

        <div className="workflow-strip">
          <div className="container workflow-inner">
            <p>THE IDEA IS SIMPLE</p>
            <span>
              <Icon name="message" />
              Capture a field note
            </span>
            <span className="workflow-line" />
            <span>
              <Icon name="code" />
              Make it structured
            </span>
            <span className="workflow-line" />
            <span>
              <Icon name="grid" />
              See the bigger picture
            </span>
          </div>
        </div>

        <section
          id="demo"
          className="demo-section container"
          aria-labelledby="demo-title"
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow">TRY IT FOR YOURSELF</p>
              <h2 id="demo-title">Your field notebook.</h2>
            </div>
            <div className="demo-label">
              Interactive simulation<span>Fictional data · browser only</span>
            </div>
          </div>
          <div className="workspace">
            <aside className="composer" aria-label="Message simulator">
              <div className="panel-title">
                <span className="icon-tile">
                  <Icon name="message" />
                </span>
                <div>
                  <h3>Start with a text.</h3>
                  <p>No phone needed.</p>
                </div>
              </div>
              <form onSubmit={parse}>
                <fieldset className="sample-picker">
                  <legend>Load an example</legend>
                  <div>
                    {SAMPLES.map((sample) => (
                      <button
                        key={sample.label}
                        type="button"
                        className={
                          message === sample.text ? "sample active" : "sample"
                        }
                        onClick={() => updateMessage(sample.text)}
                      >
                        {sample.label}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <div className="label-row">
                  <label htmlFor="message">Your message</label>
                  <span>
                    {message.length}/{MAX_MESSAGE_LENGTH}
                  </span>
                </div>
                <textarea
                  ref={messageRef}
                  id="message"
                  value={message}
                  maxLength={MAX_MESSAGE_LENGTH}
                  rows={5}
                  aria-describedby={
                    error ? "format-help message-error" : "format-help"
                  }
                  aria-invalid={Boolean(error)}
                  onChange={(event) => updateMessage(event.target.value)}
                />
                <p className="format-help" id="format-help">
                  <code>Field - task - people - hours</code>
                  <span>
                    One record per line. Try pruning, harvesting, irrigation,
                    planting, or scouting.
                  </span>
                </p>
                {error && (
                  <div
                    className="error-message"
                    id="message-error"
                    role="alert"
                  >
                    <strong>
                      {error.line
                        ? `Check line ${error.line}`
                        : "Check your message"}
                    </strong>
                    {error.message}
                  </div>
                )}
                <button className="button primary full-width" type="submit">
                  Parse message
                </button>
              </form>
              <div className="preview-section">
                <div className="preview-heading">
                  <h4>Structured output</h4>
                  {parsed.length > 0 && (
                    <span>
                      {parsed.length}{" "}
                      {parsed.length === 1 ? "record" : "records"}
                    </span>
                  )}
                </div>
                {parsed.length ? (
                  <>
                    <RecordPreview records={parsed} />
                    <button
                      className="button add-button full-width"
                      onClick={addRecords}
                    >
                      Add {parsed.length}{" "}
                      {parsed.length === 1 ? "record" : "records"} to dashboard
                    </button>
                  </>
                ) : (
                  <div className="preview-empty">
                    <Icon name="grid" />
                    <p>
                      Your parsed fields will appear here.
                      <br />
                      Nothing is added until you choose.
                    </p>
                  </div>
                )}
              </div>
              <p className="privacy-note">
                This is a simulation. No SMS is sent. Your entries stay in this
                tab and disappear when you reload.
              </p>
            </aside>

            <div className="dashboard">
              <div className="dashboard-heading">
                <div>
                  <h3>Operations overview</h3>
                  <p>Fictional week · May 18–22, 2026</p>
                </div>
                <button
                  ref={resetButtonRef}
                  className="text-button"
                  onClick={() => setResetOpen(true)}
                >
                  <Icon name="reset" />
                  Reset demo
                </button>
              </div>
              <div className="stats-grid">
                <div className="stat">
                  <span className="stat-label">
                    Field records
                    <Icon name="message" />
                  </span>
                  <strong data-testid="record-count">{summary.records}</strong>
                  <span>
                    {newCount
                      ? `${newCount} added in this session`
                      : "From the fictional sample week"}
                  </span>
                </div>
                <div className="stat">
                  <span className="stat-label">
                    Labor hours
                    <Icon name="clock" />
                  </span>
                  <strong data-testid="labor-hours">
                    {formatNumber(summary.laborHours)}
                    <small> hrs</small>
                  </strong>
                  <span>People × hours, summed</span>
                </div>
                <div className="stat">
                  <span className="stat-label">
                    Fields covered
                    <Icon name="grid" />
                  </span>
                  <strong>{summary.fields.toString().padStart(2, "0")}</strong>
                  <span>
                    {hasFilters
                      ? "In the filtered records"
                      : "Across the sample farm"}
                  </span>
                </div>
              </div>
              <div className="activity-panel">
                <div className="activity-title">
                  <h4>Where the time goes</h4>
                  <span>Labor hours by activity</span>
                </div>
                <div className="activity-bars">
                  {activities.length ? (
                    activities.map(({ task, hours }) => (
                      <div className="activity-row" key={task}>
                        <span className="capitalize">{task}</span>
                        <div className="bar-track">
                          <div
                            className={`bar-fill ${task}`}
                            style={{
                              width: `${(hours / activities[0].hours) * 100}%`,
                            }}
                          />
                        </div>
                        <strong>
                          {formatNumber(hours)}
                          <span> h</span>
                        </strong>
                      </div>
                    ))
                  ) : (
                    <p className="muted">No activities match these filters.</p>
                  )}
                </div>
              </div>
              <section
                className="records-panel"
                aria-labelledby="records-title"
              >
                <div className="records-heading">
                  <h4 id="records-title">
                    Field records <span>{visible.length}</span>
                  </h4>
                  <button
                    className="text-button"
                    onClick={exportCsv}
                    disabled={!visible.length}
                  >
                    <Icon name="download" />
                    Export CSV
                  </button>
                </div>
                <div className="filter-row">
                  <div className="search-box">
                    <Icon name="search" />
                    <label className="sr-only" htmlFor="record-search">
                      Search records
                    </label>
                    <input
                      id="record-search"
                      placeholder="Search field or activity"
                      value={filters.query}
                      onChange={(e) =>
                        setFilters({ ...filters, query: e.target.value })
                      }
                    />
                  </div>
                  <div className="select-wrap">
                    <label className="sr-only" htmlFor="field-filter">
                      Filter by field
                    </label>
                    <select
                      id="field-filter"
                      value={filters.field}
                      onChange={(e) =>
                        setFilters({ ...filters, field: e.target.value })
                      }
                    >
                      <option value="">All fields</option>
                      {fields.map((field) => (
                        <option key={field}>{field}</option>
                      ))}
                    </select>
                  </div>
                  <div className="select-wrap">
                    <label className="sr-only" htmlFor="task-filter">
                      Filter by activity
                    </label>
                    <select
                      id="task-filter"
                      value={filters.task}
                      onChange={(e) =>
                        setFilters({ ...filters, task: e.target.value })
                      }
                    >
                      <option value="">All activities</option>
                      {TASKS.map((task) => (
                        <option value={task} key={task}>
                          {task[0].toUpperCase() + task.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {hasFilters && (
                  <div className="filter-status">
                    <span>
                      Showing {visible.length} of {records.length} records.
                      Summaries follow your filters.
                    </span>
                    <button
                      onClick={() =>
                        setFilters({ query: "", field: "", task: "" })
                      }
                    >
                      Clear filters
                    </button>
                  </div>
                )}
                <div
                  className="table-scroll"
                  role="region"
                  aria-label="Field records table"
                  tabIndex={0}
                >
                  <table>
                    <caption className="sr-only">
                      Fictional agricultural field records. Hours are per
                      person.
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">Date</th>
                        <th scope="col">Field</th>
                        <th scope="col">Activity</th>
                        <th scope="col" className="numeric">
                          People
                        </th>
                        <th scope="col" className="numeric">
                          Hours
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {visible.map((record) => (
                        <tr
                          key={record.id}
                          className={record.added ? "new-record" : ""}
                        >
                          <td>{formatDate(record.date)}</td>
                          <td>
                            <strong>{record.field}</strong>
                            {record.added && (
                              <span className="new-label">New</span>
                            )}
                          </td>
                          <td>
                            <span className={`activity-tag ${record.task}`}>
                              {record.task}
                            </span>
                          </td>
                          <td className="numeric">{record.people}</td>
                          <td className="numeric">{record.hours}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!visible.length && (
                  <div className="empty-table">
                    <Icon name="search" />
                    <h4>No matching records</h4>
                    <p>Try another field or activity, or clear your filters.</p>
                    <button
                      className="button secondary"
                      onClick={() =>
                        setFilters({ query: "", field: "", task: "" })
                      }
                    >
                      Clear filters
                    </button>
                  </div>
                )}
                <div className="table-footer">
                  <span>
                    {visible.length} fictional{" "}
                    {visible.length === 1 ? "record" : "records"}
                  </span>
                  <span>New entries use May 22, the sample day's date.</span>
                </div>
              </section>
            </div>
          </div>
          <div
            className="live-status"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {notice && (
              <>
                <Icon name="check" />
                {notice}
              </>
            )}
          </div>
        </section>

        <section id="story" className="story-section">
          <div className="container story-grid">
            <div>
              <p className="eyebrow">THE ORIGINAL PROJECT</p>
              <h2>
                Built around a familiar
                <br />
                <em>way to communicate.</em>
              </h2>
              <p>
                The starting point was a field text. Agcess explored how
                structured SMS could make agricultural recordkeeping easier to
                capture, organize, and review.
              </p>
              <p>
                The 2022 team project connected message parsing with storage,
                dashboards, and reporting. This restoration makes one workflow
                tangible, using fictional data and an independent browser
                simulation.
              </p>
              <p className="contribution">
                Built as a team project. Somil Aggarwal's work included much of
                the SMS functionality and dashboard.
              </p>
            </div>
            <div className="architecture">
              <h3>From message to insight</h3>
              <div className="architecture-step">
                <span>Input</span>
                <strong>SMS & field messages</strong>
                <p>
                  Twilio received texts; Flask routed them to the right parser.
                </p>
              </div>
              <div className="architecture-step">
                <span>Structure</span>
                <strong>Python & PostgreSQL</strong>
                <p>
                  Workflow-specific parsing turned message contents into
                  records.
                </p>
              </div>
              <div className="architecture-step">
                <span>Review</span>
                <strong>Dashboards & reports</strong>
                <p>
                  React and earlier Dash interfaces, plus an Airtable-based
                  reporting path.
                </p>
              </div>
              <div className="architecture-note">
                In this demo, parsing and records live in your browser. The
                repository also includes standalone Python parsers.
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="container site-footer">
        <a className="brand" href="#top">
          <span className="brand-mark">
            <Icon name="leaf" />
          </span>
          agcess
        </a>
        <p>Agricultural field data, captured through SMS.</p>
        <a href={SOURCE}>Explore the code</a>
      </footer>

      <dialog
        ref={resetDialogRef}
        className="modal-backdrop"
        aria-labelledby="reset-title"
        aria-describedby="reset-description"
        onCancel={(event) => {
          event.preventDefault();
          closeReset();
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeReset();
        }}
      >
        <div className="reset-dialog">
          <span className="icon-tile">
            <Icon name="reset" />
          </span>
          <h3 id="reset-title">Start with a clean notebook?</h3>
          <p id="reset-description">
            This removes records you added in this tab and restores the eight
            fictional examples.
          </p>
          <div className="dialog-actions">
            <button
              ref={cancelResetRef}
              className="button secondary"
              onClick={closeReset}
            >
              Keep my records
            </button>
            <button className="button primary" onClick={reset}>
              Reset notebook
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
