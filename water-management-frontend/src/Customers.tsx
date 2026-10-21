import { useCallback, useEffect, useState, type FormEvent } from "react";
import "./Customers.css";
import CustomerReport from "./CustomerReport";

type Customer = {
  id: number;
  fullName: string;
  phone: string;
  address: string;
  zone?: string;
  membershipId?: string;
  category?: string;
  customerTitle?: string;
  nicNumber?: string;
  meterSerialNumber?: string;
  accountNumber?: string;
  createdAt?: string;
};

const API_URL = "http://localhost:8080/api/customers";

function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [reportCustomerId, setReportCustomerId] = useState<number | null>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [zone, setZone] = useState("");
  const [membershipId, setMembershipId] = useState("");
  const [category, setCategory] = useState("Residential");
  const [customerTitle, setCustomerTitle] = useState("Mr");
  const [nicNumber, setNicNumber] = useState("");
  const [meterSerialNumber, setMeterSerialNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error("Could not load customers.");

      const data: Customer[] = await response.json();
      setCustomers(data);
    } catch {
      setError(
        "Could not connect to the server. Check that Spring Boot is running."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  function resetForm() {
    setEditingId(null);
    setFullName("");
    setPhone("");
    setAddress("");
    setZone("");
    setMembershipId("");
    setCategory("Residential");
    setCustomerTitle("Mr");
    setNicNumber("");
    setMeterSerialNumber("");
    setAccountNumber("");
    setError("");
  }

  function openAddForm() {
    resetForm();
    setNotice("");
    setShowForm(true);
  }

  function openEditForm(customer: Customer) {
    setEditingId(customer.id);
    setFullName(customer.fullName || "");
    setPhone(customer.phone || "");
    setAddress(customer.address || "");
    setZone(customer.zone || "");
    setMembershipId(customer.membershipId || "");
    setCategory(customer.category || "Residential");
    setCustomerTitle(customer.customerTitle || "Mr");
    setNicNumber(customer.nicNumber || "");
    setMeterSerialNumber(customer.meterSerialNumber || "");
    setAccountNumber(customer.accountNumber || "");
    setError("");
    setNotice("");
    setShowForm(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    const payload = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      zone: zone.trim(),
      membershipId: membershipId.trim(),
      category,
      customerTitle,
      nicNumber: nicNumber.trim(),
      meterSerialNumber: meterSerialNumber.trim(),
      accountNumber: accountNumber.trim(),
    };

    try {
      const response = await fetch(
        editingId === null ? API_URL : `${API_URL}/${editingId}`,
        {
          method: editingId === null ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const message = await response.text();
        throw new Error(
          message.includes("Phone number already exists")
            ? "This phone number is already registered."
            : message.includes("Full name is required")
              ? "Please enter the customer's full name."
              : message.includes("Phone is required")
                ? "Please enter a phone number."
                : message.includes("Membership ID")
                  ? "This Membership ID may already be registered."
                  : message.includes("Account Number")
                    ? "This Account Number may already be registered."
                    : `Unable to save customer (HTTP ${response.status}).`
        );
      }

      setShowForm(false);
      setNotice(
        editingId === null
          ? "Customer registered successfully."
          : "Customer details updated successfully."
      );
      await loadCustomers();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(customer: Customer) {
    const confirmed = window.confirm(
      `Delete customer "${customer.fullName}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    setError("");
    setNotice("");

    try {
      const response = await fetch(`${API_URL}/${customer.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(`Unable to delete customer (HTTP ${response.status}).`);
      }

      setNotice("Customer deleted successfully.");
      await loadCustomers();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not delete customer."
      );
    }
  }

  const filteredCustomers = customers.filter((customer) => {
    const term = search.toLowerCase();
    return (
      customer.fullName?.toLowerCase().includes(term) ||
      customer.phone?.toLowerCase().includes(term) ||
      customer.address?.toLowerCase().includes(term) ||
      customer.zone?.toLowerCase().includes(term) ||
      customer.membershipId?.toLowerCase().includes(term) ||
      customer.category?.toLowerCase().includes(term) ||
      customer.nicNumber?.toLowerCase().includes(term) ||
      customer.meterSerialNumber?.toLowerCase().includes(term) ||
      customer.accountNumber?.toLowerCase().includes(term) ||
      String(customer.id).includes(term)
    );
  });

  if (reportCustomerId !== null) {
    return <CustomerReport customerId={reportCustomerId} onBack={() => setReportCustomerId(null)} />;
  }

  return (
    <div className="customers-page">
      <div className="customers-heading">
        <div>
          <h2>Customer Management</h2>
          <p>Manage customer records and registration details.</p>
        </div>
        <button className="customer-primary-button" onClick={openAddForm}>
          + Add Customer
        </button>
      </div>

      {notice && (
        <div className="customer-success" role="status">
          {notice}
          <button type="button" onClick={() => setNotice("")} aria-label="Dismiss message">
            ×
          </button>
        </div>
      )}

      <div className="customer-summary">
        <div className="customer-summary-icon">♙</div>
        <div>
          <span>Total Registered Customers</span>
          <strong>{loading ? "..." : customers.length}</strong>
        </div>
      </div>

      <section className="customer-list-panel">
        <div className="customer-list-toolbar">
          <div>
            <h3>All Customers</h3>
            <p>Customer records from your database</p>
          </div>
          <div className="customer-search-wrap">
            <span>⌕</span>
            <input
              type="search"
              aria-label="Search customers"
              placeholder="Search name, Membership ID, phone, account, zone..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        {error && <div className="customer-error" role="alert">{error}</div>}

        {loading ? (
          <p className="customer-message">Loading customers...</p>
        ) : filteredCustomers.length === 0 ? (
          <p className="customer-message">
            {search
              ? "No customers match your search."
              : "No customers registered yet. Click Add Customer to begin."}
          </p>
        ) : (
          <div className="customer-table-scroll">
            <table className="management-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Membership ID</th>
                  <th>Category</th>
                  <th>Phone</th>
                  <th>Zone</th>
                  <th>Account Number</th>
                  <th>Address</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td>#{customer.id}</td>
                    <td>
                      <div className="management-customer">
                        <span className="management-avatar">
                          {customer.fullName?.charAt(0)?.toUpperCase() || "C"}
                        </span>
                        <strong>
                          {customer.customerTitle ? `${customer.customerTitle} ` : ""}
                          {customer.fullName}
                        </strong>
                      </div>
                    </td>
                    <td>{customer.membershipId || "—"}</td>
                    <td>{customer.category || "—"}</td>
                    <td>{customer.phone}</td>
                    <td>{customer.zone || "—"}</td>
                    <td>{customer.accountNumber || "—"}</td>
                    <td>{customer.address || "—"}</td>
                    <td>
                      <div className="customer-actions">
                        <button
                          type="button"
                          className="view-customer-report-button"
                          onClick={() => setReportCustomerId(customer.id)}
                        >
                          View Report
                        </button>
                        <button
                          type="button"
                          className="edit-customer-button"
                          onClick={() => openEditForm(customer)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="delete-customer-button"
                          onClick={() => void handleDelete(customer)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="customer-list-footer">
          Showing {filteredCustomers.length} of {customers.length} customers
          <button
            type="button"
            className="customer-refresh-button"
            onClick={() => void loadCustomers()}
            disabled={loading}
          >
            ↻ Refresh
          </button>
        </div>
      </section>

      {showForm && (
        <div
          className="customer-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) setShowForm(false);
          }}
        >
          <section
            className="customer-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="customer-form-title"
          >
            <div className="customer-modal-heading">
              <div>
                <h3 id="customer-form-title">
                  {editingId === null ? "Add New Customer" : "Edit Customer"}
                </h3>
                <p>Fields marked with * are required.</p>
              </div>
              <button
                className="customer-close-button"
                type="button"
                aria-label="Close form"
                onClick={() => !saving && setShowForm(false)}
                disabled={saving}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="customer-form-grid">
                <label htmlFor="customer-zone">
                  Zone
                  <input
                    id="customer-zone"
                    value={zone}
                    onChange={(event) => setZone(event.target.value)}
                    placeholder="Enter zone"
                    maxLength={100}
                  />
                </label>

                <label htmlFor="customer-membership">
                  Membership ID
                  <input
                    id="customer-membership"
                    value={membershipId}
                    onChange={(event) => setMembershipId(event.target.value)}
                    placeholder="Enter membership ID"
                    maxLength={50}
                  />
                </label>

                <label htmlFor="customer-category">
                  Category *
                  <select
                    id="customer-category"
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    required
                  >
                    <option value="Residential">Residential</option>
                    <option value="Business">Business</option>
                    <option value="Concession">Concession</option>
                  </select>
                </label>

                <label htmlFor="customer-title">
                  Customer Title
                  <select
                    id="customer-title"
                    value={customerTitle}
                    onChange={(event) => setCustomerTitle(event.target.value)}
                  >
                    <option value="Mr">Mr</option>
                    <option value="Mrs">Mrs</option>
                    <option value="Ms">Ms</option>
                    <option value="Miss">Miss</option>
                    <option value="Dr">Dr</option>
                    <option value="Other">Other</option>
                  </select>
                </label>

                <label htmlFor="customer-fullname">
                  Customer Name *
                  <input
                    id="customer-fullname"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="Enter full name"
                    required
                    maxLength={150}
                  />
                </label>

                <label htmlFor="customer-phone">
                  Phone Number *
                  <input
                    id="customer-phone"
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="e.g. 0771234567"
                    required
                    maxLength={20}
                  />
                </label>

                <label htmlFor="customer-nic">
                  NIC Number
                  <input
                    id="customer-nic"
                    value={nicNumber}
                    onChange={(event) => setNicNumber(event.target.value)}
                    placeholder="Enter NIC number"
                    maxLength={20}
                  />
                </label>

                <label htmlFor="customer-meter-serial">
                  Meter Serial Number
                  <input
                    id="customer-meter-serial"
                    value={meterSerialNumber}
                    onChange={(event) => setMeterSerialNumber(event.target.value)}
                    placeholder="Enter meter serial number"
                    maxLength={100}
                  />
                </label>

                <label htmlFor="customer-account">
                  Account Number
                  <input
                    id="customer-account"
                    value={accountNumber}
                    onChange={(event) => setAccountNumber(event.target.value)}
                    placeholder="Enter account number"
                    maxLength={50}
                  />
                </label>

                <label htmlFor="customer-address" className="customer-form-full-width">
                  Address
                  <textarea
                    id="customer-address"
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    placeholder="Enter residential address"
                    rows={3}
                    maxLength={255}
                  />
                </label>
              </div>

              {error && <div className="customer-error" role="alert">{error}</div>}

              <div className="customer-form-actions">
                <button
                  type="button"
                  className="customer-cancel-button"
                  onClick={() => setShowForm(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="customer-primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingId === null
                      ? "Save Customer"
                      : "Update Customer"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default Customers;
