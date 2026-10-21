
import { useEffect, useMemo, useState } from "react";
import "./Reports.css";

type Customer = {
  id: number;
  fullName: string;
  phone: string;
  address: string;
};

type Connection = {
  id: number;
  connectionNumber: string;
  connectionType: string;
  status: string;
  customer?: {
    id: number;
    fullName: string;
  };
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
    customer?: {
      id: number;
      fullName: string;
    };
  };
};

type Bill = {
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

const API_URL = "http://localhost:8080/api";

export default function Reports() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [readings, setReadings] = useState<MeterReading[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [monthFilter, setMonthFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [activeReport, setActiveReport] = useState("billing");

  const loadReports = async () => {
    setLoading(true);
    setError("");

    try {
      const endpoints = [
        `${API_URL}/customers`,
        `${API_URL}/connections`,
        `${API_URL}/meter-readings`,
        `${API_URL}/bills`,
      ];

      const responses = await Promise.all(
        endpoints.map((url) => fetch(url))
      );

      const failedResponse = responses.find((response) => !response.ok);

      if (failedResponse) {
        throw new Error(
          `Unable to load report data (HTTP ${failedResponse.status}).`
        );
      }

      const [customerData, connectionData, readingData, billData] =
        await Promise.all(
          responses.map((response) => response.json())
        );

      setCustomers(customerData);
      setConnections(connectionData);
      setReadings(readingData);
      setBills(billData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load report data. Check the backend."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReports();
  }, []);

  const totalBilled = bills.reduce(
    (sum, bill) => sum + Number(bill.amount || 0),
    0
  );

  const paidBills = bills.filter((bill) => bill.status === "PAID");

  const unpaidBills = bills.filter((bill) => bill.status !== "PAID");

  const paidAmount = paidBills.reduce(
    (sum, bill) => sum + Number(bill.amount || 0),
    0
  );

  const outstandingAmount = unpaidBills.reduce(
    (sum, bill) => sum + Number(bill.amount || 0),
    0
  );

  const availableMonths = Array.from(
    new Set(bills.map((bill) => bill.billingMonth).filter(Boolean))
  ).sort().reverse();

  const customerIdForConnection = (connectionId: number) =>
    connections.find((connection) => connection.id === connectionId)?.customer?.id;

  const filteredBills = useMemo(() => {
    const query = search.trim().toLowerCase();

    return bills.filter((bill) => {
      const matchesSearch =
        !query ||
        bill.billNumber?.toLowerCase().includes(query) ||
        bill.customerName?.toLowerCase().includes(query) ||
        String(customerIdForConnection(bill.connectionId) ?? "").includes(query) ||
        String(bill.connectionId).includes(query);

      const matchesMonth =
        monthFilter === "ALL" || bill.billingMonth === monthFilter;

      const matchesStatus =
        statusFilter === "ALL" || bill.status === statusFilter;

      return matchesSearch && matchesMonth && matchesStatus;
    });
  }, [bills, search, monthFilter, statusFilter]);

  const filteredReadings = useMemo(() => {
    const query = search.trim().toLowerCase();

    return readings.filter((reading) => {
      const connectionNumber =
        reading.waterConnection?.connectionNumber || "";

      const customerName =
        reading.waterConnection?.customer?.fullName || "";
      const customerId = reading.waterConnection?.customer?.id;

      return (
        !query ||
        connectionNumber.toLowerCase().includes(query) ||
        customerName.toLowerCase().includes(query) ||
        String(customerId ?? "").includes(query) ||
        String(reading.id).includes(query)
      );
    });
  }, [readings, search]);

  const exportCSV = () => {
    let headers: string[];
    let rows: (string | number)[][];

    if (activeReport === "billing") {
      headers = [
        "Bill Number",
        "Customer ID",
        "Customer",
        "Connection ID",
        "Billing Month",
        "Units Used",
        "Rate Per Unit",
        "Amount LKR",
        "Bill Date",
        "Due Date",
        "Status",
      ];

      rows = filteredBills.map((bill) => [
        bill.billNumber,
        customerIdForConnection(bill.connectionId) ?? "",
        bill.customerName,
        bill.connectionId,
        bill.billingMonth,
        bill.unitsUsed,
        bill.ratePerUnit,
        bill.amount,
        bill.billDate,
        bill.dueDate,
        bill.status,
      ]);
    } else {
      headers = [
        "Reading ID",
        "Connection Number",
        "Customer ID",
        "Customer",
        "Previous Reading",
        "Current Reading",
        "Units Consumed",
        "Reading Date",
      ];

      rows = filteredReadings.map((reading) => [
        reading.id,
        reading.waterConnection?.connectionNumber || "",
        reading.waterConnection?.customer?.id ?? "",
        reading.waterConnection?.customer?.fullName || "",
        reading.previousReading,
        reading.currentReading,
        reading.unitsConsumed,
        reading.readingDate,
      ]);
    }

    const escapeCSV = (value: string | number) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csvContent = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) => row.map(escapeCSV).join(",")),
    ].join("\r\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download =
      activeReport === "billing"
        ? "waterflow-billing-report.csv"
        : "waterflow-meter-readings-report.csv";

    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="reports-page">
      <header className="reports-header">
        <div>
          <span className="reports-eyebrow">WATER MANAGEMENT / ADMIN</span>
          <h1>Reports & Analytics</h1>
          <p>Monitor water usage, billing and collection performance.</p>
        </div>

        <button
          type="button"
          className="reports-refresh"
          onClick={loadReports}
          disabled={loading}
        >
          ↻ {loading ? "Loading..." : "Refresh"}
        </button>
      </header>

      {error && (
        <div className="reports-error" role="alert">
          {error}
          <button type="button" onClick={loadReports}>
            Retry
          </button>
        </div>
      )}

      <section className="reports-stats">
        <article className="report-stat-card">
          <div className="report-stat-icon blue">♙</div>
          <div>
            <p>Total Customers</p>
            <h2>{loading ? "—" : customers.length}</h2>
          </div>
        </article>

        <article className="report-stat-card">
          <div className="report-stat-icon green">▤</div>
          <div>
            <p>Water Connections</p>
            <h2>{loading ? "—" : connections.length}</h2>
          </div>
        </article>

        <article className="report-stat-card">
          <div className="report-stat-icon purple">◉</div>
          <div>
            <p>Meter Readings</p>
            <h2>{loading ? "—" : readings.length}</h2>
          </div>
        </article>

        <article className="report-stat-card">
          <div className="report-stat-icon orange">LKR</div>
          <div>
            <p>Total Billed</p>
            <h2>
              {loading ? "—" : totalBilled.toLocaleString("en-LK", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </h2>
          </div>
        </article>
      </section>

      <section className="reports-collection">
        <div className="reports-section-heading">
          <div>
            <h2>Billing Overview</h2>
            <p>Summary based on generated bills.</p>
          </div>
        </div>

        <div className="reports-collection-grid">
          <article className="collection-card">
            <span>Total Bills</span>
            <strong>{loading ? "—" : bills.length}</strong>
            <small>All generated bills</small>
          </article>

          <article className="collection-card">
            <span>Paid Bills</span>
            <strong>{loading ? "—" : paidBills.length}</strong>
            <small className="report-positive">Successfully marked paid</small>
          </article>

          <article className="collection-card">
            <span>Paid Amount</span>
            <strong>
              LKR {loading ? "—" : paidAmount.toLocaleString("en-LK", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </strong>
            <small className="report-positive">Collected amount</small>
          </article>

          <article className="collection-card">
            <span>Outstanding Amount</span>
            <strong>
              LKR {loading ? "—" : outstandingAmount.toLocaleString("en-LK", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </strong>
            <small className="report-negative">Bills not marked paid</small>
          </article>
        </div>
      </section>

      <section className="reports-data-panel">
        <div className="reports-section-heading">
          <div>
            <h2>Detailed Reports</h2>
            <p>Search, filter and export report data.</p>
          </div>

          <button
            type="button"
            className="reports-export"
            onClick={exportCSV}
            disabled={loading}
          >
            ↓ Export CSV
          </button>
        </div>

        <div className="reports-tabs">
          <button
            type="button"
            className={activeReport === "billing" ? "active" : ""}
            onClick={() => setActiveReport("billing")}
          >
            Billing Report
          </button>

          <button
            type="button"
            className={activeReport === "readings" ? "active" : ""}
            onClick={() => setActiveReport("readings")}
          >
            Meter Readings
          </button>
        </div>

        <div className="reports-filters">
          <input
            type="search"
            placeholder={
              activeReport === "billing"
                ? "Search bill number, customer or connection..."
                : "Search connection, customer or reading ID..."
            }
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          {activeReport === "billing" && (
            <>
              <select
                value={monthFilter}
                onChange={(event) => setMonthFilter(event.target.value)}
                aria-label="Filter billing month"
              >
                <option value="ALL">All Months</option>
                {availableMonths.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                aria-label="Filter payment status"
              >
                <option value="ALL">All Statuses</option>
                <option value="PAID">Paid</option>
                <option value="UNPAID">Unpaid</option>
              </select>
            </>
          )}
        </div>

        {loading ? (
          <p className="reports-empty">Loading report data...</p>
        ) : activeReport === "billing" ? (
          filteredBills.length === 0 ? (
            <p className="reports-empty">No bills match your filters.</p>
          ) : (
            <div className="reports-table-wrapper">
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>Bill No.</th>
                    <th>Customer ID</th>
                    <th>Customer</th>
                    <th>Month</th>
                    <th>Units</th>
                    <th>Amount (LKR)</th>
                    <th>Due Date</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredBills.map((bill) => (
                    <tr key={bill.id}>
                      <td>{bill.billNumber}</td>
                      <td><strong>#{customerIdForConnection(bill.connectionId) ?? "—"}</strong></td>
                      <td>{bill.customerName}</td>
                      <td>{bill.billingMonth}</td>
                      <td>{bill.unitsUsed}</td>
                      <td>{Number(bill.amount).toFixed(2)}</td>
                      <td>{bill.dueDate}</td>
                      <td>
                        <span
                          className={`reports-status ${
                            bill.status === "PAID" ? "paid" : "unpaid"
                          }`}
                        >
                          {bill.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : filteredReadings.length === 0 ? (
          <p className="reports-empty">No meter readings match your search.</p>
        ) : (
          <div className="reports-table-wrapper">
            <table className="reports-table">
              <thead>
                <tr>
                  <th>Reading ID</th>
                  <th>Connection</th>
                  <th>Customer</th>
                  <th>Previous</th>
                  <th>Current</th>
                  <th>Units Consumed</th>
                  <th>Reading Date</th>
                </tr>
              </thead>

              <tbody>
                {filteredReadings.map((reading) => (
                  <tr key={reading.id}>
                    <td>MR-{reading.id}</td>
                    <td>
                      {reading.waterConnection?.connectionNumber || "—"}
                    </td>
                    <td>
                      {reading.waterConnection?.customer?.fullName || "—"}
                    </td>
                    <td>{reading.previousReading}</td>
                    <td>{reading.currentReading}</td>
                    <td>{reading.unitsConsumed}</td>
                    <td>{reading.readingDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <footer className="reports-footer">
        Figures are calculated from the records currently returned by the API.
        Outstanding means bills not marked as paid.
      </footer>
    </div>
  );
}
