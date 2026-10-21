
import { useEffect, useState } from "react";
import "./App.css";
import Login from "./Login";
import Customers from "./Customers";
import WaterConnections from "./WaterConnections";
import MeterReadings from "./MeterReadings";
import Bill from "./Bill";
import Payments from "./Payments";
import Reports from "./Reports";
import Settings from "./Settings";
import Employees from "./Employees";
import { useAppSettings } from "./SettingsContext";


type Customer = {
  id: number;
  fullName: string;
  phone: string;
  address: string;
  createdAt?: string;
};

const API_URL = "http://localhost:8080/api/customers";

const menuItems = [
  { icon: "▦", label: "Dashboard" },
  { icon: "♙", label: "Employees" },
  { icon: "♧", label: "Customers" },
  { icon: "▤", label: "Water Connections" },
  { icon: "◉", label: "Meter Readings" },
  { icon: "▣", label: "Billing" },
  { icon: "＄", label: "Payments" },
  { icon: "▥", label: "Reports" },
  { icon: "⚙", label: "Settings" },
];

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function ConsumptionChart() {
  const values = [32, 45, 38, 65, 55, 78, 62, 72, 58, 85, 68, 76];
  const points = values
    .map((value, index) => `${42 + index * 47},${170 - value * 1.45}`)
    .join(" ");

    

  return (
    <div className="chart-wrap">
      <div className="chart-y-labels">
        <span>1000</span><span>750</span><span>500</span><span>250</span><span>0</span>
      </div>
      <svg className="line-chart" viewBox="0 0 570 190" role="img" aria-label="Illustrative monthly consumption chart">
        {[25, 60, 95, 130, 165].map((y) => (
          <line key={y} x1="25" y1={y} x2="560" y2={y} className="chart-grid" />
        ))}
        <polyline points={points} className="chart-line" />
        {values.map((value, index) => (
          <circle key={index} cx={42 + index * 47} cy={170 - value * 1.45} r="3.5" className="chart-dot" />
        ))}
      </svg>
      <div className="chart-months">
        {months.map((month) => <span key={month}>{month}</span>)}
      </div>
    </div>
  );
}

function BillingChart() {
  const billed = [42, 56, 48, 72, 84, 68];
  const collected = [30, 44, 38, 55, 61, 58];

  return (
    <div className="bar-chart">
      {billed.map((value, index) => (
        <div className="bar-group" key={months[index]}>
          <div className="bar-pair">
            <div className="bar billed-bar" style={{ height: `${value * 1.65}px` }} />
            <div className="bar collected-bar" style={{ height: `${collected[index] * 1.65}px` }} />
          </div>
          <span>{months[index]}</span>
        </div>
      ))}
    </div>
  );
}

function App() {
  const { language, formatDate } = useAppSettings();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    fetch(API_URL)
      .then((response) => {
        if (!response.ok) throw new Error("Could not load customers.");
        return response.json();
      })
      .then((data: Customer[]) => {
        setCustomers(data);
        setApiError("");
      })
      .catch(() => {
        setApiError("Unable to connect to the customer API. Check that the Spring Boot backend is running on port 8080.");
      })
      .finally(() => setLoading(false));
  }, []);

  const labels: Record<string, Record<string, string>> = {
    en: { Dashboard: "Dashboard", Employees: "Employees", Customers: "Customers", "Water Connections": "Water Connections", "Meter Readings": "Meter Readings", Billing: "Billing", Payments: "Payments", Reports: "Reports", Settings: "Settings" },
    si: { Dashboard: "උපකරණ පුවරුව", Employees: "සේවකයින්", Customers: "පාරිභෝගිකයින්", "Water Connections": "ජල සම්බන්ධතා", "Meter Readings": "මීටර් කියවීම්", Billing: "බිල්පත්", Payments: "ගෙවීම්", Reports: "වාර්තා", Settings: "සැකසුම්" },
    ta: { Dashboard: "டாஷ்போர்டு", Employees: "பணியாளர்கள்", Customers: "வாடிக்கையாளர்கள்", "Water Connections": "நீர் இணைப்புகள்", "Meter Readings": "மீட்டர் அளவீடுகள்", Billing: "கட்டணம்", Payments: "கொடுப்பனவுகள்", Reports: "அறிக்கைகள்", Settings: "அமைப்புகள்" },
  };
  const pageLabel = (label: string) => labels[language][label] || label;

  const totalCustomers = customers.length;
  const recentCustomers = [...customers].reverse().slice(0, 5);


if (!isLoggedIn) {
  return <Login onLogin={() => setIsLoggedIn(true)} />;
}
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">W</div>
          <div>
            <strong>WaterFlow</strong>
            <span>Water Management</span>
          </div>
        </div>

        <div className="sidebar-section">WORKSPACE</div>
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.label}
              className={`nav-item ${activeMenu === item.label ? "active" : ""}`}
              onClick={() => setActiveMenu(item.label)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{pageLabel(item.label)}</span>
              {item.label === "Dashboard" && <span className="active-indicator" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="status-dot" />
          <div><strong>System status</strong><span>WaterFlow Admin</span></div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div>
            <span className="eyebrow">WATER MANAGEMENT / ADMIN</span>
            <h1>{pageLabel(activeMenu)}</h1>
          </div>
          <div className="topbar-right">
            <div className="today-label">{formatDate(new Date())}</div>
            <div className="avatar">A</div>
          </div>
        </header>

        {activeMenu === "Dashboard" ? (
          <div className="dashboard-content">
            <div className="welcome-row">
              <div>
                <h2>Overview</h2>
                <p>Here’s what’s happening with your water services.</p>
              </div>
              <button className="refresh-button" onClick={() => window.location.reload()}>
                ↻ &nbsp; Refresh
              </button>
            </div>

            {apiError && <div className="error-banner">{apiError}</div>}

            <section className="stats-grid">
              <article className="stat-card">
                <div className="stat-top">
                  <div className="stat-icon blue-icon">♙</div>
                  <span className="stat-tag">CUSTOMERS</span>
                </div>
                <div className="stat-value">{loading ? "..." : totalCustomers.toLocaleString()}</div>
                <div className="stat-label">Registered customers</div>
                <div className="stat-foot"><span className="blue-text">●</span> Live database count</div>
              </article>

              <article className="stat-card">
                <div className="stat-top">
                  <div className="stat-icon cyan-icon">≋</div>
                  <span className="stat-tag">CONSUMPTION</span>
                </div>
                <div className="stat-value">— <small>m³</small></div>
                <div className="stat-label">Monthly water usage</div>
                <div className="stat-foot">Meter readings not connected yet</div>
              </article>

              <article className="stat-card">
                <div className="stat-top">
                  <div className="stat-icon purple-icon">▤</div>
                  <span className="stat-tag">BILLING</span>
                </div>
                <div className="stat-value">— <small>LKR</small></div>
                <div className="stat-label">Bills issued this month</div>
                <div className="stat-foot">Billing data not connected yet</div>
              </article>

              <article className="stat-card">
                <div className="stat-top">
                  <div className="stat-icon green-icon">＄</div>
                  <span className="stat-tag">COLLECTIONS</span>
                </div>
                <div className="stat-value">— <small>LKR</small></div>
                <div className="stat-label">Payments received</div>
                <div className="stat-foot">Payment data not connected yet</div>
              </article>
            </section>

            <section className="charts-grid">
              <article className="panel">
                <div className="panel-heading">
                  <div><h3>Water Consumption</h3><p>Monthly consumption trend</p></div>
                  <span className="chart-badge">12 months</span>
                </div>
                <div className="chart-legend"><span className="legend-blue" /> Consumption</div>
                <ConsumptionChart />
                <p className="demo-note">Illustrative chart only — connect meter readings to show real figures.</p>
              </article>

              <article className="panel">
                <div className="panel-heading">
                  <div><h3>Billing & Collections</h3><p>Monthly financial overview</p></div>
                  <span className="chart-badge">Last 6 months</span>
                </div>
                <div className="chart-legend">
                  <span className="legend-blue" /> Billed
                  <span className="legend-cyan" /> Collected
                </div>
                <BillingChart />
                <p className="demo-note">Illustrative chart only — real billing and payment records will be connected later.</p>
              </article>
            </section>

            <section className="panel recent-panel">
              <div className="panel-heading">
                <div><h3>Recent Customers</h3><p>Latest registered customer records</p></div>
                <button className="text-button" onClick={() => setActiveMenu("Customers")}>View customers →</button>
              </div>

              {loading ? (
                <p className="empty-message">Loading customers...</p>
              ) : recentCustomers.length === 0 ? (
                <p className="empty-message">No customers found. Add a customer to get started.</p>
              ) : (
                <div className="table-scroll">
                  <table className="customers-table">
                    <thead><tr><th>Customer</th><th>Phone</th><th>Address</th><th>Status</th></tr></thead>
                    <tbody>
                      {recentCustomers.map((customer) => (
                        <tr key={customer.id}>
                          <td><div className="customer-cell"><div className="customer-avatar">{customer.fullName?.charAt(0)?.toUpperCase() || "C"}</div><div><strong>{customer.fullName}</strong><span>Customer #{customer.id}</span></div></div></td>
                          <td>{customer.phone}</td>
                          <td>{customer.address}</td>
                          <td><span className="status-pill"><span /> Registered</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <footer className="footer">© {new Date().getFullYear()} WaterFlow · Water Management System</footer>
          </div>

           ): activeMenu === "Employees" ? (
        <Employees />

           ): activeMenu === "Customers" ? (    
        <Customers />

           ) :activeMenu === "Water Connections" ? (
        <WaterConnections />

           ): activeMenu === "Meter Readings" ? (
  <MeterReadings />

      ) : activeMenu === "Payments" ? (
      <Payments />
      
      ) : activeMenu === "Billing" ? (
      <Bill />

    ) : activeMenu === "Reports" ? (
      <Reports />

      ) : activeMenu === "Settings" ? (
      <Settings />

      ) : (

          <section className="placeholder-panel">
            <div className="placeholder-icon">✦</div>
            <h2>{activeMenu}</h2>
            <p>This section will be implemented in the next steps.</p>
            <button className="primary-button" onClick={() => setActiveMenu("Dashboard")}>← Back to Dashboard</button>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
