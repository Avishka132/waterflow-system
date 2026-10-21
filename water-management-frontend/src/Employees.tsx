import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import "./Employees.css";

type Employee = {
  id: number;
  fullName: string;
  employeeCode: string;
  phone: string;
  email: string;
  role: string;
  department: string;
  address: string;
  status: string;
  joinedDate: string;
};

type EmployeeForm = Omit<Employee, "id">;
const API_URL = "http://localhost:8080/api/employees";
const emptyForm: EmployeeForm = {
  fullName: "", employeeCode: "", phone: "", email: "", role: "Meter Reader",
  department: "Field Operations", address: "", status: "Active", joinedDate: new Date().toISOString().slice(0, 10),
};

async function responseError(response: Response) {
  const body = await response.text();
  if (!response.ok) {
    try {
      const parsed = JSON.parse(body);
      throw new Error(parsed.message || parsed.detail || body || "Request failed");
    } catch (error) {
      if (error instanceof Error && error.message !== "Unexpected end of JSON input") throw error;
      throw new Error(body || `Request failed (${response.status})`);
    }
  }
  return body;
}

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [form, setForm] = useState<EmployeeForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(API_URL);
      const body = await responseError(response);
      setEmployees(body ? JSON.parse(body) as Employee[] : []);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load employees. Check the backend.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void loadEmployees(); }, [loadEmployees]);

  const filteredEmployees = useMemo(() => employees.filter((employee) => {
    const term = search.toLowerCase().trim();
    const matchesSearch = !term || [employee.fullName, employee.employeeCode, employee.phone, employee.email, employee.role, employee.department]
      .some((value) => (value || "").toLowerCase().includes(term));
    return matchesSearch && (statusFilter === "All" || employee.status === statusFilter);
  }), [employees, search, statusFilter]);

  const resetForm = () => { setForm(emptyForm); setEditingId(null); setShowForm(false); };
  const updateField = (field: keyof EmployeeForm, value: string) => setForm((current) => ({ ...current, [field]: value }));

  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    try {
      const response = await fetch(editingId === null ? API_URL : `${API_URL}/${editingId}`, {
        method: editingId === null ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, email: form.email || null, department: form.department || null, address: form.address || null, joinedDate: form.joinedDate || null }),
      });
      await responseError(response);
      await loadEmployees();
      setNotice(editingId === null ? "Employee added successfully." : "Employee details updated successfully.");
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save employee.");
    } finally { setSaving(false); }
  };

  const startEdit = (employee: Employee) => {
    setForm({ fullName: employee.fullName || "", employeeCode: employee.employeeCode || "", phone: employee.phone || "", email: employee.email || "", role: employee.role || "Meter Reader", department: employee.department || "", address: employee.address || "", status: employee.status || "Active", joinedDate: employee.joinedDate || "" });
    setEditingId(employee.id); setShowForm(true); setNotice(""); setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteEmployee = async (employee: Employee) => {
    if (!window.confirm(`Delete ${employee.fullName} (${employee.employeeCode})? This cannot be undone.`)) return;
    setError(""); setNotice("");
    try {
      const response = await fetch(`${API_URL}/${employee.id}`, { method: "DELETE" });
      await responseError(response);
      setEmployees((current) => current.filter((item) => item.id !== employee.id));
      setNotice("Employee deleted successfully.");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not delete employee."); }
  };

  return <div className="employees-page">
    <div className="employees-heading-row">
      <div><div className="employees-eyebrow">WATER MANAGEMENT / TEAM</div><h2>Employee Management</h2><p>Manage staff records, roles and employment status.</p></div>
      <button className="employee-primary-btn" onClick={() => { resetForm(); setShowForm(true); setError(""); setNotice(""); }}>＋ Add Employee</button>
    </div>

    {notice && <div className="employee-alert success" role="status"><span>{notice}</span><button onClick={() => setNotice("")} aria-label="Dismiss message">×</button></div>}
    {error && <div className="employee-alert error" role="alert"><span>{error}</span><button onClick={() => setError("")} aria-label="Dismiss error">×</button></div>}

    <div className="employee-summary-grid">
      <article className="employee-summary-card"><span className="employee-summary-icon">♙</span><div><span>Total employees</span><strong>{employees.length}</strong></div></article>
      <article className="employee-summary-card"><span className="employee-summary-icon green">✓</span><div><span>Active employees</span><strong>{employees.filter((e) => e.status === "Active").length}</strong></div></article>
      <article className="employee-summary-card"><span className="employee-summary-icon amber">Ⅱ</span><div><span>Inactive employees</span><strong>{employees.filter((e) => e.status === "Inactive").length}</strong></div></article>
    </div>

    {showForm && <section className="employee-panel employee-form-panel">
      <div className="employee-panel-heading"><div><h3>{editingId === null ? "Add new employee" : "Edit employee"}</h3><p>Fields marked with * are required.</p></div><button className="employee-close-btn" onClick={resetForm} aria-label="Close form">×</button></div>
      <form onSubmit={submitForm}>
        <div className="employee-form-grid">
          <label>Full name *<input required maxLength={120} value={form.fullName} onChange={(e) => updateField("fullName", e.target.value)} placeholder="Enter full name" /></label>
          <label>Employee ID *<input required maxLength={30} value={form.employeeCode} onChange={(e) => updateField("employeeCode", e.target.value)} placeholder="e.g. EMP-001" /></label>
          <label>Phone number *<input required maxLength={30} value={form.phone} onChange={(e) => updateField("phone", e.target.value)} placeholder="Enter phone number" /></label>
          <label>Email address<input type="email" maxLength={150} value={form.email} onChange={(e) => updateField("email", e.target.value)} placeholder="name@example.com" /></label>
          <label>Job role *<select required value={form.role} onChange={(e) => updateField("role", e.target.value)}><option>Meter Reader</option><option>Field Officer</option><option>Technician</option><option>Customer Service Officer</option><option>Billing Officer</option><option>Cashier</option><option>Supervisor</option><option>Administrator</option><option>Other</option></select></label>
          <label>Department<input maxLength={80} value={form.department} onChange={(e) => updateField("department", e.target.value)} placeholder="e.g. Field Operations" /></label>
          <label>Joining date<input type="date" value={form.joinedDate} onChange={(e) => updateField("joinedDate", e.target.value)} /></label>
          <label>Status<select value={form.status} onChange={(e) => updateField("status", e.target.value)}><option>Active</option><option>Inactive</option></select></label>
          <label className="employee-full-width">Address<textarea rows={2} maxLength={255} value={form.address} onChange={(e) => updateField("address", e.target.value)} placeholder="Enter employee address" /></label>
        </div>
        <div className="employee-form-actions"><button type="button" className="employee-secondary-btn" onClick={resetForm}>Cancel</button><button type="submit" className="employee-primary-btn" disabled={saving}>{saving ? "Saving…" : editingId === null ? "Save Employee" : "Update Employee"}</button></div>
      </form>
    </section>}

    <section className="employee-panel">
      <div className="employee-list-heading"><div><h3>Employees</h3><p>{filteredEmployees.length} staff record{filteredEmployees.length === 1 ? "" : "s"}</p></div><button className="employee-secondary-btn" onClick={() => void loadEmployees()} disabled={loading}>↻ Refresh</button></div>
      <div className="employee-filters"><input aria-label="Search employees" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, ID, phone, role…"/><select aria-label="Filter by status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option>All</option><option>Active</option><option>Inactive</option></select></div>
      {loading ? <div className="employee-empty">Loading employee records…</div> : filteredEmployees.length === 0 ? <div className="employee-empty"><span>♙</span><strong>{employees.length ? "No matching employees" : "No employees added yet"}</strong><p>{employees.length ? "Try another search or status filter." : "Use Add Employee to create your first employee record."}</p></div> :
        <div className="employee-table-scroll"><table className="employee-table"><thead><tr><th>Employee</th><th>Employee ID</th><th>Contact</th><th>Role / Department</th><th>Joined</th><th>Status</th><th>Actions</th></tr></thead><tbody>{filteredEmployees.map((employee) => <tr key={employee.id}>
          <td><div className="employee-person"><span className="employee-avatar">{employee.fullName?.charAt(0)?.toUpperCase() || "E"}</span><span><strong>{employee.fullName}</strong><small>{employee.email || "No email added"}</small></span></div></td>
          <td><span className="employee-code">{employee.employeeCode}</span></td><td>{employee.phone}<small className="employee-subtext">{employee.address || "Address not added"}</small></td>
          <td><strong>{employee.role}</strong><small className="employee-subtext">{employee.department || "No department"}</small></td><td>{employee.joinedDate || "—"}</td>
          <td><span className={`employee-status ${employee.status === "Active" ? "active" : "inactive"}`}>{employee.status || "Active"}</span></td>
          <td><div className="employee-row-actions"><button onClick={() => startEdit(employee)} aria-label={`Edit ${employee.fullName}`}>Edit</button><button className="delete" onClick={() => void deleteEmployee(employee)} aria-label={`Delete ${employee.fullName}`}>Delete</button></div></td>
        </tr>)}</tbody></table></div>}
    </section>
  </div>;
}
