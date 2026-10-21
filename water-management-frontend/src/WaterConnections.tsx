
import { useCallback, useEffect, useState, type FormEvent } from "react";
import "./WaterConnections.css";

type Customer = {
  id: number;
  fullName: string;
  phone: string;
  membershipId?: string;
};

type WaterConnection = {
  id: number;
  connectionNumber: string;
  customer: Customer;
  connectionType: string;
  installationDate: string;
  status: string;
};

const CONNECTIONS_API = "http://localhost:8080/api/connections";
const CUSTOMERS_API = "http://localhost:8080/api/customers";

function WaterConnections() {
  const [connections, setConnections] = useState<WaterConnection[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [connectionNumber, setConnectionNumber] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [connectionType, setConnectionType] = useState("RESIDENTIAL");
  const [installationDate, setInstallationDate] = useState(
    new Date().toLocaleDateString("en-CA")
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [connectionResponse, customerResponse] = await Promise.all([
        fetch(CONNECTIONS_API),
        fetch(CUSTOMERS_API),
      ]);

      if (!connectionResponse.ok || !customerResponse.ok) {
        throw new Error("Unable to load data from the server.");
      }

      const connectionData: WaterConnection[] =
        await connectionResponse.json();
      const customerData: Customer[] = await customerResponse.json();

      setConnections(connectionData);
      setCustomers(customerData);
    } catch {
      setError(
        "Could not load connections. Check that the backend is running and the API is available."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  function openForm() {
    setConnectionNumber("");
    setCustomerId("");
    setConnectionType("RESIDENTIAL");
    setInstallationDate(new Date().toLocaleDateString("en-CA"));
    setError("");
    setShowForm(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch(CONNECTIONS_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectionNumber: connectionNumber.trim(),
          customerId: Number(customerId),
          connectionType,
          installationDate,
        }),
      });

      if (!response.ok) {
        const message = await response.text();

        if (response.status === 409) {
          throw new Error("This connection number already exists.");
        }

        if (response.status === 404) {
          throw new Error("The selected customer was not found.");
        }

        throw new Error(
          `Unable to save connection (HTTP ${response.status}). ${message}`
        );
      }

      setShowForm(false);
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save connection."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(connection: WaterConnection) {
    const newStatus =
      connection.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    const confirmed = window.confirm(
      `Change ${connection.connectionNumber} status to ${newStatus}?`
    );

    if (!confirmed) return;

    setError("");

    try {
      const response = await fetch(
        `${CONNECTIONS_API}/${connection.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            connectionNumber: connection.connectionNumber,
            customerId: connection.customer.id,
            connectionType: connection.connectionType,
            installationDate: connection.installationDate,
            status: newStatus,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Unable to update status (HTTP ${response.status}).`);
      }

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not update status."
      );
    }
  }

  const filteredConnections = connections.filter((connection) => {
    const term = search.toLowerCase();

    return (
      connection.connectionNumber?.toLowerCase().includes(term) ||
      connection.customer?.fullName?.toLowerCase().includes(term) ||
      connection.customer?.phone?.toLowerCase().includes(term) ||
      customers.find((customer) => customer.id === connection.customer?.id)?.membershipId?.toLowerCase().includes(term) ||
      connection.connectionType?.toLowerCase().includes(term) ||
      connection.status?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="connections-page">
      <div className="connections-heading">
        <div>
          <h2>Water Connections</h2>
          <p>Register and manage customer water connections.</p>
        </div>

        <button
          className="connections-primary-button"
          onClick={openForm}
          disabled={customers.length === 0}
          title={
            customers.length === 0
              ? "Register a customer first"
              : "Register a water connection"
          }
        >
          + Add Connection
        </button>
      </div>

      <div className="connections-summary-grid">
        <div className="connections-summary-card">
          <div className="connections-summary-icon">▤</div>
          <div>
            <span>Total Connections</span>
            <strong>{loading ? "..." : connections.length}</strong>
          </div>
        </div>

        <div className="connections-summary-card">
          <div className="connections-summary-icon active-icon">✓</div>
          <div>
            <span>Active Connections</span>
            <strong>
              {loading
                ? "..."
                : connections.filter((item) => item.status === "ACTIVE").length}
            </strong>
          </div>
        </div>

        <div className="connections-summary-card">
          <div className="connections-summary-icon inactive-icon">○</div>
          <div>
            <span>Inactive Connections</span>
            <strong>
              {loading
                ? "..."
                : connections.filter((item) => item.status === "INACTIVE").length}
            </strong>
          </div>
        </div>
      </div>

      <section className="connections-panel">
        <div className="connections-toolbar">
          <div>
            <h3>All Water Connections</h3>
            <p>Records retrieved from your database</p>
          </div>

          <input
            className="connections-search"
            type="search"
            placeholder="Search connection, customer or Membership ID..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {error && <div className="connections-error">{error}</div>}

        {loading ? (
          <p className="connections-message">Loading connections...</p>
        ) : filteredConnections.length === 0 ? (
          <p className="connections-message">
            {search
              ? "No connections match your search."
              : "No water connections yet. Click Add Connection to register one."}
          </p>
        ) : (
          <div className="connections-table-wrap">
            <table className="connections-table">
              <thead>
                <tr>
                  <th>Connection No.</th>
                  <th>Customer</th>
                  <th>Membership ID</th>
                  <th>Phone</th>
                  <th>Type</th>
                  <th>Installation Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredConnections.map((connection) => (
                  <tr key={connection.id}>
                    <td>
                      <strong>{connection.connectionNumber}</strong>
                    </td>
                    <td>{connection.customer?.fullName ?? "Unknown"}</td>
                    <td>{customers.find((customer) => customer.id === connection.customer?.id)?.membershipId || "—"}</td>
                    <td>{connection.customer?.phone ?? "—"}</td>
                    <td>{connection.connectionType}</td>
                    <td>{connection.installationDate}</td>
                    <td>
                      <span
                        className={`connection-status ${
                          connection.status === "ACTIVE"
                            ? "status-active"
                            : "status-inactive"
                        }`}
                      >
                        {connection.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="connection-status-button"
                        onClick={() => void handleStatusChange(connection)}
                      >
                        Set {connection.status === "ACTIVE" ? "Inactive" : "Active"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="connections-footer">
          Showing {filteredConnections.length} of {connections.length} connections
          <button
            className="connection-refresh-button"
            onClick={() => void loadData()}
          >
            ↻ Refresh
          </button>
        </div>
      </section>

      {showForm && (
        <div className="connection-modal-backdrop">
          <section
            className="connection-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="connection-form-title"
          >
            <div className="connection-modal-heading">
              <div>
                <h3 id="connection-form-title">Register Water Connection</h3>
                <p>Enter the new connection details.</p>
              </div>
              <button
                type="button"
                className="connection-close-button"
                onClick={() => setShowForm(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <label htmlFor="connection-number">Connection Number *</label>
              <input
                id="connection-number"
                value={connectionNumber}
                onChange={(event) => setConnectionNumber(event.target.value)}
                placeholder="e.g. WC-0001"
                maxLength={30}
                required
              />

              <label htmlFor="connection-customer">Customer *</label>
              <select
                id="connection-customer"
                value={customerId}
                onChange={(event) => setCustomerId(event.target.value)}
                required
              >
                <option value="">Select a customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.fullName} — Membership: {customer.membershipId || "—"} — {customer.phone}
                  </option>
                ))}
              </select>

              <label htmlFor="connection-type">Connection Type *</label>
              <select
                id="connection-type"
                value={connectionType}
                onChange={(event) => setConnectionType(event.target.value)}
                required
              >
                <option value="RESIDENTIAL">Residential</option>
                <option value="COMMERCIAL">Commercial</option>
                <option value="INDUSTRIAL">Industrial</option>
              </select>

              <label htmlFor="installation-date">Installation Date *</label>
        <div className="connection-date-wrapper">
        <input
            id="installation-date"
            type="date"
            value={installationDate}
            onChange={(event) =>
            setInstallationDate(event.target.value)
            }
            required
        />

        <button
            type="button"
            className="connection-calendar-button"
            aria-label="Open installation date calendar"
            onClick={() => {
            const dateInput = document.getElementById(
                "installation-date"
            ) as HTMLInputElement | null;

            if (dateInput && typeof dateInput.showPicker === "function") {
                dateInput.showPicker();
            }
            }}
        >
            📅
        </button>
        </div>
              {error && <div className="connections-error">{error}</div>}

              <div className="connection-form-actions">
                <button
                  type="button"
                  className="connection-cancel-button"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="connections-primary-button"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Connection"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default WaterConnections;
