import { useEffect, useState } from "react";
import "./CustomerReport.css";

type Customer = {
  id: number; fullName: string; phone: string; address?: string; zone?: string;
  membershipId?: string; category?: string; customerTitle?: string; nicNumber?: string;
  meterSerialNumber?: string; accountNumber?: string; createdAt?: string;
};
type Connection = { id: number; connectionNumber: string; connectionType: string; installationDate?: string; status: string };
type Bill = { id: number; billNumber: string; connectionId: number; customerName: string; connectionType: string; billingMonth: string; previousReading: number; currentReading: number; unitsUsed: number; ratePerUnit: number; amount: number; billDate: string; dueDate: string; status: string };
type Payment = { id: number; billId: number; billNumber: string; paymentMethod: string; reference?: string; amount: number; paymentDate: string };
type ReportData = { customer: Customer; connections: Connection[]; bills: Bill[]; payments: Payment[]; totalBilled: number; totalPaid: number; outstanding: number; legacyPaidBillsWithoutPaymentDetails: string[] };

const API = "http://localhost:8080/api/customer-reports";
const money = (value: number) => `LKR ${Number(value || 0).toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const date = (value?: string) => value ? new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export default function CustomerReport({ customerId, onBack }: { customerId: number; onBack: () => void }) {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"billing" | "payments">("billing");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`${API}/${customerId}`)
      .then(async response => {
        if (!response.ok) throw new Error(await response.text() || "Unable to load customer report.");
        return response.json() as Promise<ReportData>;
      })
      .then(report => { if (!cancelled) { setData(report); setError(""); } })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : "Unable to load report."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [customerId]);



  if (loading) return <section className="customer-report-page"><button className="cr-back" onClick={onBack}>← Back to Customers</button><p className="cr-message">Loading full customer report…</p></section>;
  if (error || !data) return <section className="customer-report-page"><button className="cr-back" onClick={onBack}>← Back to Customers</button><div className="cr-error">{error || "Customer report not found."}</div></section>;

  const customer = data.customer;
  return (
    <div className="customer-report-page">
      <div className="cr-toolbar no-print">
        <button className="cr-back" onClick={onBack}>← Back to Customers</button>
        <div className="cr-actions"><button className="cr-secondary" onClick={() => window.print()}>Print / Save PDF</button></div>
      </div>
      <header className="cr-header">
        <div className="cr-brand"><div className="cr-logo">W</div><div><strong>WaterFlow</strong><span>Water Management System</span></div></div>
        <div className="cr-report-label"><span>CUSTOMER ACCOUNT</span><h1>Full Details Report</h1><p>Generated {new Date().toLocaleDateString("en-GB")}</p></div>
      </header>
      <section className="cr-customer-banner">
        <div className="cr-avatar">{customer.fullName?.charAt(0)?.toUpperCase() || "C"}</div>
        <div className="cr-person"><span>Customer #{customer.id}</span><h2>{customer.customerTitle ? `${customer.customerTitle} ` : ""}{customer.fullName}</h2><p>{customer.phone} · {customer.address || "No address saved"}</p></div>
        <span className={`cr-category ${customer.category?.toLowerCase() || "unknown"}`}>{customer.category || "Uncategorised"}</span>
      </section>
      <section className="cr-section">
        <div className="cr-section-heading"><div><h2>Customer Information</h2><p>Registered personal and account details</p></div></div>
        <div className="cr-info-grid">
          <Info label="Customer ID" value={`#${customer.id}`} /><Info label="Membership ID" value={customer.membershipId} /><Info label="Account Number" value={customer.accountNumber} /><Info label="NIC Number" value={customer.nicNumber} /><Info label="Phone Number" value={customer.phone} /><Info label="Customer Title" value={customer.customerTitle} /><Info label="Zone" value={customer.zone} /><Info label="Address" value={customer.address} /><Info label="Meter Serial Number" value={customer.meterSerialNumber} /><Info label="Category" value={customer.category} /><Info label="Registered Date" value={customer.createdAt ? date(customer.createdAt.slice(0, 10)) : undefined} />
        </div>
      </section>
      <section className="cr-section">
        <div className="cr-section-heading"><div><h2>Water Connections</h2><p>Connections linked to this customer</p></div><span className="cr-count">{data.connections.length} connection(s)</span></div>
        {data.connections.length ? <div className="cr-table-wrap"><table className="cr-table"><thead><tr><th>Connection No.</th><th>Type</th><th>Installation Date</th><th>Status</th></tr></thead><tbody>{data.connections.map(c => <tr key={c.id}><td>{c.connectionNumber}</td><td>{c.connectionType}</td><td>{date(c.installationDate)}</td><td><span className="cr-status">{c.status}</span></td></tr>)}</tbody></table></div> : <p className="cr-empty">No water connections are linked to this customer yet.</p>}
      </section>
      <section className="cr-summary-grid">
        <Summary label="Total Billed" value={money(data.totalBilled)} detail={`${data.bills.length} bill(s)`} />
        <Summary label="Total Paid" value={money(data.totalPaid)} detail="Based on paid bills / recorded payments" />
        <Summary label="Outstanding Balance" value={money(data.outstanding)} detail="Bills not marked as paid" warning={data.outstanding > 0} />
      </section>
      <section className="cr-section cr-history-section">
        <div className="cr-section-heading"><div><h2>Billing & Payment History</h2><p>Detailed records for this customer's account</p></div></div>
        <div className="cr-tabs no-print"><button className={activeTab === "billing" ? "active" : ""} onClick={() => setActiveTab("billing")}>Billing History ({data.bills.length})</button><button className={activeTab === "payments" ? "active" : ""} onClick={() => setActiveTab("payments")}>Payment History ({data.payments.length})</button></div>
        {activeTab === "billing" ? (
          data.bills.length ? <div className="cr-table-wrap"><table className="cr-table"><thead><tr><th>Bill No.</th><th>Period</th><th>Previous</th><th>Current</th><th>Units</th><th>Amount</th><th>Bill Date</th><th>Due Date</th><th>Status</th></tr></thead><tbody>{data.bills.map(b => <tr key={b.id}><td>{b.billNumber}</td><td>{b.billingMonth}</td><td>{b.previousReading}</td><td>{b.currentReading}</td><td>{b.unitsUsed}</td><td>{money(b.amount)}</td><td>{date(b.billDate)}</td><td>{date(b.dueDate)}</td><td><span className={`cr-status ${b.status.toLowerCase()}`}>{b.status}</span></td></tr>)}</tbody></table></div> : <p className="cr-empty">No bills found for this customer.</p>
        ) : (
          data.payments.length ? <div className="cr-table-wrap"><table className="cr-table"><thead><tr><th>Payment ID</th><th>Bill No.</th><th>Payment Date</th><th>Method</th><th>Reference</th><th>Amount</th></tr></thead><tbody>{data.payments.map(p => <tr key={p.id}><td>PAY-{p.id}</td><td>{p.billNumber}</td><td>{date(p.paymentDate?.slice(0, 10))}</td><td>{p.paymentMethod.replaceAll("_", " ")}</td><td>{p.reference || "—"}</td><td>{money(p.amount)}</td></tr>)}</tbody></table></div> : <p className="cr-empty">No detailed payment records found. Existing bills marked PAID before this update may not have saved payment method/reference information.</p>
        )}
        {data.legacyPaidBillsWithoutPaymentDetails.length > 0 && <p className="cr-note">Note: {data.legacyPaidBillsWithoutPaymentDetails.length} previously paid bill(s) have no saved payment method or reference because the old payment screen only changed bill status.</p>}
      </section>
      <footer className="cr-footer">WaterFlow · Customer account report · Please retain this report for your records.</footer>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | number | null }) { return <div className="cr-info"><span>{label}</span><strong>{value || "—"}</strong></div>; }
function Summary({ label, value, detail, warning = false }: { label: string; value: string; detail: string; warning?: boolean }) { return <article className={`cr-summary ${warning ? "warning" : ""}`}><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>; }
