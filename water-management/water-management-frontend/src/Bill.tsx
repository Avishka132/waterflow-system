
import { useEffect, useRef, useState } from "react";
import "./Bill.css";

type BillRecord = {
  id: number;
  billNumber: string;
  connectionId: number;
  customerName: string;
  connectionType: string;
  billingMonth: string;
  previousReading: number;
  currentReading: number;
  unitsUsed: number;
  ratePerUnit: number;
  amount: number;
  billDate: string;
  dueDate: string;
  status: string;
};

type MeterReading = {
  id: number;
  previousReading: number;
  currentReading: number;
  unitsConsumed: number;
  readingDate: string;
  waterConnection: {
    id: number;
    connectionNumber: string;
    connectionType: string;
    customer?: {
      id: number;
      fullName: string;
    };
  };
};

type ConnectionLookup = { id: number; customer?: { id: number; fullName: string } };

const API_URL = "http://localhost:8080/api";

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
    </svg>
  );
}

export default function Bill() {
  const [bills, setBills] = useState<BillRecord[]>([]);
  const [readings, setReadings] = useState<MeterReading[]>([]);
  const [connections, setConnections] = useState<ConnectionLookup[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [meterReadingId, setMeterReadingId] = useState("");
  const [billingMonth, setBillingMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [dueDate, setDueDate] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const monthRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);

  const fetchBills = async () => {
    try {
      const response = await fetch(`${API_URL}/bills`);

      if (!response.ok) {
        throw new Error("Unable to load bills.");
      }

      const data: BillRecord[] = await response.json();
      setBills(data);
      setError("");
    } catch {
      setError("Unable to load bills. Check that the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const fetchReadings = async () => {
    try {
      const response = await fetch(`${API_URL}/meter-readings`);

      if (!response.ok) {
        throw new Error("Unable to load meter readings.");
      }

      const data: MeterReading[] = await response.json();
      setReadings(data);
    } catch {
      setError("Unable to load meter readings. Check the backend.");
    }
  };

  const fetchConnections = async () => {
    try {
      const response = await fetch(`${API_URL}/connections`);
      if (!response.ok) throw new Error("Unable to load customer connections.");
      const data: ConnectionLookup[] = await response.json();
      setConnections(data);
    } catch {
      setError("Unable to load customer IDs. Check the backend.");
    }
  };

  const refreshData = async () => {
    setLoading(true);
    await Promise.all([fetchBills(), fetchReadings(), fetchConnections()]);
  };

  useEffect(() => {
    void refreshData();
  }, []);

  const generateBill = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!meterReadingId || !billingMonth || !dueDate) {
      setError("Please complete all required fields.");
      return;
    }

    setGenerating(true);

    try {
      const response = await fetch(`${API_URL}/bills/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          meterReadingId: Number(meterReadingId),
          billingMonth,
          dueDate,
        }),
      });

      if (!response.ok) {
        const details = await response.text();
        throw new Error(details || "Unable to generate bill.");
      }

      await response.json();

      setMessage("Bill generated successfully.");
      setShowForm(false);
      setMeterReadingId("");
      await fetchBills();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to generate bill."
      );
    } finally {
      setGenerating(false);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/bills/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const details = await response.text();
        throw new Error(details || "Unable to update payment status.");
      }

      setMessage("Payment status updated successfully.");
      await fetchBills();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update payment status."
      );
    }
  };

  const totalBilled = bills.reduce(
    (total, bill) => total + Number(bill.amount || 0),
    0
  );

  const totalPaid = bills
    .filter((bill) => bill.status === "PAID")
    .reduce(
      (total, bill) => total + Number(bill.amount || 0),
      0
    );

  const totalOutstanding = bills
    .filter((bill) => bill.status !== "PAID")
    .reduce(
      (total, bill) => total + Number(bill.amount || 0),
      0
    );

  const filteredBills = bills.filter((bill) => {
    const query = search.toLowerCase();

    const matchesSearch =
      bill.billNumber?.toLowerCase().includes(query) ||
      bill.customerName?.toLowerCase().includes(query) ||
      String(connections.find((connection) => connection.id === bill.connectionId)?.customer?.id ?? "").includes(query) ||
      String(bill.connectionId).includes(query) ||
      bill.connectionType?.toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === "ALL" || bill.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const selectedReading = readings.find(
    (reading) => String(reading.id) === meterReadingId
  );

  const openPicker = (input: HTMLInputElement | null) => {
    if (!input) return;

    try {
      if ("showPicker" in HTMLInputElement.prototype) {
        input.showPicker();
      } else {
        input.focus();
      }
    } catch {
      input.focus();
    }
  };

  return (
    <div className="bill-page">
      <div className="bill-header">
        <div>
          <h1>Water Bills</h1>
          <p>Generate bills and manage customer payments.</p>
        </div>

        <div className="bill-header-actions">
          <button
            type="button"
            className="bill-primary-button"
            onClick={() => {
              setShowForm((current) => !current);
              setError("");
              setMessage("");
            }}
          >
            {showForm ? "Cancel" : "+ Generate Bill"}
          </button>

          <button
            type="button"
            className="bill-refresh-button"
            onClick={refreshData}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      <div className="bill-summary">
        <div className="bill-summary-card">
          <span className="bill-summary-icon blue">▤</span>
          <div>
            <span>Total Bills</span>
            <strong>{bills.length}</strong>
          </div>
        </div>

        <div className="bill-summary-card">
          <span className="bill-summary-icon green">＄</span>
          <div>
            <span>Total Billed</span>
            <strong>LKR {totalBilled.toFixed(2)}</strong>
          </div>
        </div>

        <div className="bill-summary-card">
          <span className="bill-summary-icon purple">✓</span>
          <div>
            <span>Paid Amount</span>
            <strong>LKR {totalPaid.toFixed(2)}</strong>
          </div>
        </div>

        <div className="bill-summary-card">
          <span className="bill-summary-icon red">◷</span>
          <div>
            <span>Outstanding</span>
            <strong>LKR {totalOutstanding.toFixed(2)}</strong>
          </div>
        </div>
      </div>

      {error && (
        <div className="bill-error" role="alert">
          {error}
        </div>
      )}

      {message && (
        <div className="bill-success" role="status">
          {message}
        </div>
      )}

      <div className={`bill-main-layout ${showForm ? "with-form" : ""}`}>
        <section className="bill-panel">
          <div className="bill-panel-heading">
            <div>
              <h2>Water Bills</h2>
              <p>View and manage customer bills.</p>
            </div>
          </div>

          <div className="bill-filters">
            <input
              type="search"
              placeholder="Search customer, bill number..."
              aria-label="Search bills"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            <select
              aria-label="Filter by payment status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="ALL">All Status</option>
              <option value="PAID">Paid</option>
              <option value="UNPAID">Unpaid</option>
            </select>
          </div>

          {loading ? (
            <p className="bill-empty">Loading bills...</p>
          ) : filteredBills.length === 0 ? (
            <p className="bill-empty">
              {bills.length === 0
                ? "No bills available. Generate your first bill."
                : "No bills match your search or filter."}
            </p>
          ) : (
            <div className="bill-table-wrapper">
              <table className="bill-table">
                <thead>
                  <tr>
                    <th>Bill No.</th>
                    <th>Customer ID</th>
                    <th>Customer</th>
                    <th>Connection</th>
                    <th>Month</th>
                    <th>Units</th>
                    <th>Amount (LKR)</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredBills.map((bill) => (
                    <tr key={bill.id}>
                      <td>{bill.billNumber}</td>
                      <td><strong>#{connections.find((connection) => connection.id === bill.connectionId)?.customer?.id ?? "—"}</strong></td>
                      <td>{bill.customerName}</td>
                      <td>{bill.connectionId}</td>
                      <td>{bill.billingMonth}</td>
                      <td>{bill.unitsUsed}</td>
                      <td>{Number(bill.amount).toFixed(2)}</td>
                      <td>{bill.dueDate}</td>
                      <td>
                        <span
                          className={`bill-status ${
                            bill.status === "PAID" ? "paid" : "unpaid"
                          }`}
                        >
                          {bill.status}
                        </span>
                      </td>
                      <td>

                <button
                  type="button"
                  className="bill-pay-button"
                  onClick={() =>
                    updateStatus(
                      bill.id,
                      bill.status === "PAID" ? "UNPAID" : "PAID"
                    )
                  }
                >
                  {bill.status === "PAID" ? "Mark as Unpaid" : "Mark as Paid"}
                </button>

                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {showForm && (
          <section className="bill-panel bill-form-panel">
            <h2>Generate New Bill</h2>
            <p>Select a meter reading and enter billing details.</p>

            <form className="bill-form" onSubmit={generateBill}>
              <label htmlFor="meterReadingId">Meter Reading *</label>

              <select
                id="meterReadingId"
                value={meterReadingId}
                onChange={(event) =>
                  setMeterReadingId(event.target.value)
                }
                required
              >
                <option value="">Select a meter reading</option>

                {readings.map((reading) => (
                  <option key={reading.id} value={reading.id}>
                    Reading #{reading.id} —{" "}
                    {reading.waterConnection?.connectionNumber || "Connection"}{" "}
                    — Customer #{reading.waterConnection?.customer?.id ?? "—"} — {reading.waterConnection?.customer?.fullName || "Customer"}
                    {" — "}
                    {reading.unitsConsumed} units
                  </option>
                ))}
              </select>

              {selectedReading && (
                <div className="bill-reading-preview">
                  <span>
                    Previous: {selectedReading.previousReading}
                  </span>
                  <span>
                    Current: {selectedReading.currentReading}
                  </span>
                  <span>
                    Units: {selectedReading.unitsConsumed}
                  </span>
                </div>
              )}

              <label htmlFor="billingMonth">Billing Month *</label>

              <div className="bill-date-field">
                <input
                  ref={monthRef}
                  id="billingMonth"
                  type="month"
                  value={billingMonth}
                  onChange={(event) =>
                    setBillingMonth(event.target.value)
                  }
                  required
                />

                <button
                  type="button"
                  className="bill-calendar-button"
                  aria-label="Choose billing month"
                  onClick={() => openPicker(monthRef.current)}
                >
                  <CalendarIcon />
                </button>
              </div>

              <label htmlFor="dueDate">Due Date *</label>

              <div className="bill-date-field">
                <input
                  ref={dateRef}
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                  required
                />

                <button
                  type="button"
                  className="bill-calendar-button"
                  aria-label="Choose due date"
                  onClick={() => openPicker(dateRef.current)}
                >
                  <CalendarIcon />
                </button>
              </div>

              {readings.length === 0 && (
                <p className="bill-form-note">
                  No meter readings available. Add a reading first.
                </p>
              )}

              <p className="bill-form-note">
                The bill amount is calculated by the backend using the
                selected reading and connection type rate.
              </p>

              <button
                type="submit"
                className="bill-primary-button bill-submit-button"
                disabled={generating || readings.length === 0}
              >
                {generating ? "Generating..." : "Generate Bill"}
              </button>
            </form>
          </section>
        )}
      </div>
    </div>
  );
}
