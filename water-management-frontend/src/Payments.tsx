
import { useEffect, useState } from "react";
import "./Payments.css";

type Bill = {
  id: number;
  billNumber: string;
  customerName: string;
  connectionId: number;
  billingMonth: string;
  unitsUsed: number;
  amount: number;
  billDate: string;
  dueDate: string;
  status: string;
};

const API_URL = "http://localhost:8080/api";

type ConnectionLookup = { id: number; customer?: { membershipId?: string } };

export default function Payments() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [membershipByConnection, setMembershipByConnection] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [reference, setReference] = useState("");
  const [saving, setSaving] = useState(false);

  const loadBills = async () => {
    try {
      const response = await fetch(`${API_URL}/bills`);

      if (!response.ok) {
        throw new Error("Unable to load billing records.");
      }

      const data: Bill[] = await response.json();
      setBills(data);
      setError("");
    } catch {
      setError("Unable to load payments. Check that the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const loadMemberships = async () => {
    try {
      const response = await fetch(`${API_URL}/connections`);
      if (!response.ok) return;
      const connections: ConnectionLookup[] = await response.json();
      setMembershipByConnection(Object.fromEntries(
        connections.map((connection) => [connection.id, connection.customer?.membershipId || ""])
      ));
    } catch {
      // Payment listing remains available if lookup fails.
    }
  };

  useEffect(() => {
    void loadBills();
    void loadMemberships();
  }, []);

  const paidBills = bills.filter((bill) => bill.status === "PAID");
  const unpaidBills = bills.filter((bill) => bill.status !== "PAID");

  const paidAmount = paidBills.reduce(
    (sum, bill) => sum + Number(bill.amount || 0),
    0
  );

  const outstanding = unpaidBills.reduce(
    (sum, bill) => sum + Number(bill.amount || 0),
    0
  );

  const filteredBills = bills.filter((bill) => {
    const query = search.toLowerCase();

    const matchesSearch =
      bill.billNumber?.toLowerCase().includes(query) ||
      bill.customerName?.toLowerCase().includes(query) ||
      (membershipByConnection[bill.connectionId] || "").toLowerCase().includes(query) ||
      String(bill.connectionId).includes(query);

    const matchesStatus =
      statusFilter === "ALL" || bill.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Uses the existing billing status endpoint.
  // This updates the bill status; it does not create a separate payment record.
  const recordPayment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedBill) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billId: selectedBill.id,
          paymentMethod,
          reference: reference.trim() || null,
        }),
      });

      if (!response.ok) {
        const details = await response.text();
        throw new Error(details || "Unable to record payment.");
      }

      setMessage(
        `Payment saved for bill ${selectedBill.billNumber}. Method: ${paymentMethod}${
          reference.trim() ? `; Reference: ${reference.trim()}` : ""
        }.`
      );

      setSelectedBill(null);
      setReference("");
      await loadBills();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to record payment."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="payments-page">
      <header className="payments-header">
        <div>
          <h1>Payments</h1>
          <p>Manage bill payments and view payment status.</p>
        </div>

        <button
          type="button"
          className="payment-refresh"
          onClick={() => {
            setLoading(true);
            void loadBills();
          }}
        >
          ↻ Refresh
        </button>
      </header>

      {error && <div className="payment-alert error">{error}</div>}
      {message && <div className="payment-alert success">{message}</div>}

      <section className="payment-summary">
        <article className="payment-stat">
          <span className="payment-stat-icon blue">▤</span>
          <div>
            <p>Total Bills</p>
            <h2>{bills.length}</h2>
          </div>
        </article>

        <article className="payment-stat">
          <span className="payment-stat-icon green">✓</span>
          <div>
            <p>Paid Bills</p>
            <h2>{paidBills.length}</h2>
          </div>
        </article>

        <article className="payment-stat">
          <span className="payment-stat-icon purple">LKR</span>
          <div>
            <p>Paid Amount</p>
            <h2>LKR {paidAmount.toFixed(2)}</h2>
          </div>
        </article>

        <article className="payment-stat">
          <span className="payment-stat-icon red">!</span>
          <div>
            <p>Outstanding</p>
            <h2>LKR {outstanding.toFixed(2)}</h2>
          </div>
        </article>
      </section>

      <section className="payment-panel">
        <div className="payment-panel-header">
          <div>
            <h2>Payment Records</h2>
            <p>Payments are based on bills in the billing module.</p>
          </div>
        </div>

        <div className="payment-filters">
          <input
            type="search"
            placeholder="Search bill number, customer or Membership ID..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search payments"
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter payment status"
          >
            <option value="ALL">All Statuses</option>
            <option value="PAID">Paid</option>
            <option value="UNPAID">Unpaid</option>
          </select>
        </div>

        {loading ? (
          <p className="payment-empty">Loading payment records...</p>
        ) : filteredBills.length === 0 ? (
          <p className="payment-empty">
            No payment records found. Generate a bill in the Billing module first.
          </p>
        ) : (
          <div className="payment-table-wrapper">
            <table className="payment-table">
              <thead>
                <tr>
                  <th>Bill Number</th>
                  <th>Customer</th>
                  <th>Membership ID</th>
                  <th>Billing Month</th>
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
                    <td>{bill.customerName}</td>
                    <td>{membershipByConnection[bill.connectionId] || "—"}</td>
                    <td>{bill.billingMonth}</td>
                    <td>{Number(bill.amount).toFixed(2)}</td>
                    <td>{bill.dueDate}</td>
                    <td>
                      <span
                        className={`payment-status ${
                          bill.status === "PAID" ? "paid" : "unpaid"
                        }`}
                      >
                        {bill.status}
                      </span>
                    </td>
                    <td>
                      {bill.status !== "PAID" ? (
                        <button
                          type="button"
                          className="payment-record-button"
                          onClick={() => {
                            setSelectedBill(bill);
                            setError("");
                            setMessage("");
                          }}
                        >
                          Record Payment
                        </button>
                      ) : (
                        <span className="payment-complete">Paid ✓</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedBill && (
        <div
          className="payment-modal-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedBill(null);
            }
          }}
        >
          <section
            className="payment-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-modal-title"
          >
            <button
              type="button"
              className="payment-modal-close"
              aria-label="Close payment form"
              onClick={() => setSelectedBill(null)}
            >
              ×
            </button>

            <h2 id="payment-modal-title">Record Payment</h2>
            <p>Confirm the payment details for this bill.</p>

            <div className="payment-receipt-details">
              <div>
                <span>Bill Number</span>
                <strong>{selectedBill.billNumber}</strong>
              </div>
              <div>
                <span>Customer</span>
                <strong>{selectedBill.customerName}</strong><div>Membership ID: {membershipByConnection[selectedBill.connectionId] || "—"}</div>
              </div>
              <div>
                <span>Billing Month</span>
                <strong>{selectedBill.billingMonth}</strong>
              </div>
              <div>
                <span>Amount Due</span>
                <strong>
                  LKR {Number(selectedBill.amount).toFixed(2)}
                </strong>
              </div>
            </div>

            <form className="payment-form" onSubmit={recordPayment}>
              <label htmlFor="paymentMethod">Payment Method</label>
              <select
                id="paymentMethod"
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value)}
              >
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CARD">Card</option>
                <option value="ONLINE">Online Payment</option>
              </select>

              <label htmlFor="paymentReference">
                Reference Number (optional)
              </label>
              <input
                id="paymentReference"
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                placeholder="Enter receipt or transaction reference"
              />

              <p className="payment-note">
                Only confirm payment after the customer has actually paid.
              </p>

              <button
                type="submit"
                className="payment-confirm-button"
                disabled={saving}
              >
                {saving ? "Saving..." : "Confirm Payment"}
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
