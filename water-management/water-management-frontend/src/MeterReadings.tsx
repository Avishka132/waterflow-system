
import { useEffect, useState, type FormEvent } from "react";
import "./MeterReadings.css";

type WaterConnection = {
  id: number;
  connectionNumber: string;
  connectionType: string;
  customer: {
    id: number;
    fullName: string;
    phone: string;
  };
};

type MeterReading = {
  id: number;
  waterConnection: WaterConnection;
  previousReading: number;
  currentReading: number;
  unitsConsumed: number;
  readingDate: string;
};

const READINGS_API = "http://localhost:8080/api/meter-readings";
const CONNECTIONS_API = "http://localhost:8080/api/connections";

export default function MeterReadings() {
  const [readings, setReadings] = useState<MeterReading[]>([]);
  const [connections, setConnections] = useState<WaterConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [connectionId, setConnectionId] = useState("");
  const [previousReading, setPreviousReading] = useState("");
  const [currentReading, setCurrentReading] = useState("");
  const [readingDate, setReadingDate] = useState(
    new Date().toLocaleDateString("en-CA")
  );
  const [formError, setFormError] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [readingResponse, connectionResponse] = await Promise.all([
        fetch(READINGS_API),
        fetch(CONNECTIONS_API),
      ]);

      if (!readingResponse.ok || !connectionResponse.ok) {
        throw new Error("Unable to load data from the backend.");
      }

      const readingData: MeterReading[] = await readingResponse.json();
      const connectionData: WaterConnection[] =
        await connectionResponse.json();

      setReadings(readingData);
      setConnections(connectionData);
    } catch {
      setError("Could not load meter readings. Check that the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const previousValue = Number(previousReading);
  const currentValue = Number(currentReading);
  const previewUnits =
    previousReading !== "" && currentReading !== "" &&
    currentValue >= previousValue && previousValue >= 0
      ? currentValue - previousValue
      : null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    if (!connectionId || previousReading === "" ||
        currentReading === "" || !readingDate) {
      setFormError("Please complete all fields.");
      return;
    }

    if (previousValue < 0 || currentValue < previousValue) {
      setFormError("Current reading must be greater than or equal to previous reading.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(READINGS_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectionId: Number(connectionId),
          previousReading: previousValue,
          currentReading: currentValue,
          readingDate,
        }),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Could not save meter reading.");
      }

      setShowForm(false);
      setConnectionId("");
      setPreviousReading("");
      setCurrentReading("");
      setReadingDate(new Date().toLocaleDateString("en-CA"));
      await loadData();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Could not save meter reading."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="meter-page">
      <div className="meter-heading">
        <div>
          <h2>Meter Readings</h2>
          <p>Record and manage customer water meter readings.</p>
        </div>
        <button className="meter-primary-btn" onClick={() => {
          setFormError("");
          setShowForm(true);
        }}>
          + Add Reading
        </button>
      </div>

      <div className="meter-stats">
        <div className="meter-stat-card">
          <span>Total Readings</span>
          <strong>{readings.length}</strong>
        </div>
        <div className="meter-stat-card">
          <span>Total Units Recorded</span>
          <strong>
            {readings.reduce((sum, item) => sum + item.unitsConsumed, 0)}
          </strong>
        </div>
        <div className="meter-stat-card">
          <span>Available Connections</span>
          <strong>{connections.length}</strong>
        </div>
      </div>

      <section className="meter-table-card">
        <div className="meter-table-heading">
          <div>
            <h3>Reading History</h3>
            <p>Meter readings retrieved from your database.</p>
          </div>
          <button className="meter-secondary-btn" onClick={() => void loadData()}>
            Refresh
          </button>
        </div>

        <input
          type="search"
          className="meter-search"
          placeholder="Search customer ID, customer name or connection..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Search meter readings"
        />
        {error && <div className="meter-error">{error}</div>}
        {loading ? (
          <p className="meter-empty">Loading meter readings...</p>
        ) : readings.filter((item) => {
          const term = search.trim().toLowerCase();
          return !term ||
            String(item.waterConnection?.customer?.id ?? "").includes(term) ||
            (item.waterConnection?.customer?.fullName ?? "").toLowerCase().includes(term) ||
            (item.waterConnection?.connectionNumber ?? "").toLowerCase().includes(term);
        }).length === 0 ? (
          <p className="meter-empty">{search ? "No readings match your search." : "No readings yet. Select Add Reading to record one."}</p>
        ) : (
          <div className="meter-table-scroll">
            <table className="meter-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Connection</th>
                  <th>Customer ID</th>
                  <th>Customer</th>
                  <th>Previous</th>
                  <th>Current</th>
                  <th>Units Used</th>
                </tr>
              </thead>
              <tbody>
                {readings.filter((item) => {
                  const term = search.trim().toLowerCase();
                  return !term ||
                    String(item.waterConnection?.customer?.id ?? "").includes(term) ||
                    (item.waterConnection?.customer?.fullName ?? "").toLowerCase().includes(term) ||
                    (item.waterConnection?.connectionNumber ?? "").toLowerCase().includes(term);
                }).map((item) => (
                  <tr key={item.id}>
                    <td>{item.readingDate}</td>
                    <td>{item.waterConnection?.connectionNumber ?? "—"}</td>
                    <td><strong>#{item.waterConnection?.customer?.id ?? "—"}</strong></td>
                    <td>{item.waterConnection?.customer?.fullName ?? "—"}</td>
                    <td>{item.previousReading}</td>
                    <td>{item.currentReading}</td>
                    <td><strong>{item.unitsConsumed}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showForm && (
        <div className="meter-modal-overlay">
          <section className="meter-modal">
            <div className="meter-modal-heading">
              <h3>Add Meter Reading</h3>
              <button type="button" className="meter-close-btn"
                onClick={() => setShowForm(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <label>
                Water Connection
                <select value={connectionId}
                  onChange={(e) => setConnectionId(e.target.value)} required>
                  <option value="">Select a connection</option>
                  {connections.map((connection) => (
                    <option key={connection.id} value={connection.id}>
                      {connection.connectionNumber} — Customer #{connection.customer?.id ?? "—"} — {connection.customer?.fullName ?? "Customer"}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Previous Reading
                <input type="number" min="0" step="any" required
                  value={previousReading}
                  onChange={(e) => setPreviousReading(e.target.value)} />
              </label>

              <label>
                Current Reading
                <input type="number" min="0" step="any" required
                  value={currentReading}
                  onChange={(e) => setCurrentReading(e.target.value)} />
              </label>

              {previewUnits !== null && (
                <div className="meter-units-preview">
                  Units consumed: <strong>{previewUnits}</strong>
                </div>
              )}


                <div className="meter-date-wrapper">
                <input
                    type="date"
                    id="reading-date-input"
                    value={readingDate}
                    onChange={(e) => setReadingDate(e.target.value)}
                    required
                />

                <button
                    type="button"
                    className="meter-calendar-button"
                    aria-label="Open calendar"
                    onClick={() => {
                    const input = document.getElementById(
                        "reading-date-input"
                    ) as HTMLInputElement | null;

                    if (input && typeof input.showPicker === "function") {
                        input.showPicker();
                    }
                    }}
                >
                    📅
                </button>
                </div>

              {formError && <div className="meter-error">{formError}</div>}

              <div className="meter-form-actions">
                <button type="button" className="meter-secondary-btn"
                  onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="meter-primary-btn"
                  disabled={saving}>
                  {saving ? "Saving..." : "Save Reading"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
