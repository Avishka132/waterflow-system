
import { useEffect, useState } from "react";
import { useAppSettings, type AppLanguage, type AppAppearance } from "./SettingsContext";
import "./Settings.css";


const translations = {
  en: {
    title: "Settings",
    subtitle: "Customize your WaterFlow experience.",
    appearance: "Appearance",
    appearanceDesc: "Choose how WaterFlow looks.",
    light: "Light",
    dark: "Dark",
    system: "System default",
    language: "Language",
    languageDesc: "Choose your preferred language.",
    preferences: "General Preferences",
    dateFormat: "Date format",
    currency: "Currency",
    notifications: "Notifications",
    notificationsDesc: "Show system and billing notifications.",
    billing: "Water Billing Rates",
    billingDesc: "Rates shown here are configurable preferences.",
    residential: "Residential",
    business: "Business",
    concession: "Concession",
    perUnit: "LKR per unit",
    systemDefault: "System default",
    backend: "Backend API",
    connected: "Connected",
    disconnected: "Not reachable",
    reset: "Reset Settings",
    resetDesc: "Restore the default appearance and language.",
    save: "Save Settings",
    saved: "Settings saved successfully.",
    resetConfirm: "Reset appearance, language and preferences?",
    note: "Billing rate changes are not applied to bill generation yet.",
    english: "English",
    sinhala: "සිංහල",
    tamil: "தமிழ்",
  },
  si: {
    title: "සැකසුම්",
    subtitle: "ඔබට අවශ්‍ය ආකාරයට WaterFlow සකස් කරන්න.",
    appearance: "පෙනුම",
    appearanceDesc: "පද්ධතියේ පෙනුම තෝරන්න.",
    light: "ලා පැහැති",
    dark: "අඳුරු",
    system: "පද්ධතිය අනුව",
    language: "භාෂාව",
    languageDesc: "ඔබ කැමති භාෂාව තෝරන්න.",
    preferences: "සාමාන්‍ය සැකසුම්",
    dateFormat: "දිනය පෙන්වන ආකාරය",
    currency: "මුදල් ඒකකය",
    notifications: "දැනුම්දීම්",
    notificationsDesc: "පද්ධති සහ බිල්පත් දැනුම්දීම් පෙන්වන්න.",
    billing: "ජල බිල්පත් ගාස්තු",
    billingDesc: "මෙහි පෙන්වන ගාස්තු සැකසුම් පමණි.",
    residential: "ගෘහස්ථ",
    business: "ව්‍යාපාරික",
    concession: "සහනදායී",
    perUnit: "ඒකකයකට රුපියල්",
    systemDefault: "පද්ධති තත්ත්වය",
    backend: "Backend API",
    connected: "සම්බන්ධ වී ඇත",
    disconnected: "සම්බන්ධ කළ නොහැක",
    reset: "සැකසුම් නැවත සකසන්න",
    resetDesc: "පෙරනිමි පෙනුම සහ භාෂාවට නැවත යන්න.",
    save: "සැකසුම් සුරකින්න",
    saved: "සැකසුම් සාර්ථකව සුරැකුණා.",
    resetConfirm: "පෙනුම, භාෂාව සහ සැකසුම් නැවත සකසන්නද?",
    note: "ගාස්තු වෙනස්කම් තවම බිල්පත් ගණනයට යොදා නැත.",
    english: "English",
    sinhala: "සිංහල",
    tamil: "தமிழ்",
  },
  ta: {
    title: "அமைப்புகள்",
    subtitle: "உங்கள் WaterFlow அனுபவத்தைத் தனிப்பயனாக்குங்கள்.",
    appearance: "தோற்றம்",
    appearanceDesc: "பயன்பாட்டின் தோற்றத்தைத் தேர்ந்தெடுக்கவும்.",
    light: "ஒளி",
    dark: "இருள்",
    system: "கணினி இயல்புநிலை",
    language: "மொழி",
    languageDesc: "விருப்பமான மொழியைத் தேர்ந்தெடுக்கவும்.",
    preferences: "பொது விருப்பங்கள்",
    dateFormat: "தேதி வடிவம்",
    currency: "நாணயம்",
    notifications: "அறிவிப்புகள்",
    notificationsDesc: "கணினி மற்றும் கட்டண அறிவிப்புகளைக் காட்டவும்.",
    billing: "நீர் கட்டண விகிதங்கள்",
    billingDesc: "இங்கு காட்டப்படும் விகிதங்கள் அமைப்புகள் மட்டுமே.",
    residential: "குடியிருப்பு",
    business: "வணிகம்",
    concession: "சலுகை",
    perUnit: "ஒரு அலகிற்கு LKR",
    systemDefault: "கணினி நிலை",
    backend: "Backend API",
    connected: "இணைக்கப்பட்டுள்ளது",
    disconnected: "அணுக முடியவில்லை",
    reset: "அமைப்புகளை மீட்டமை",
    resetDesc: "இயல்புநிலை தோற்றம் மற்றும் மொழியை மீட்டமைக்கவும்.",
    save: "அமைப்புகளைச் சேமி",
    saved: "அமைப்புகள் வெற்றிகரமாகச் சேமிக்கப்பட்டன.",
    resetConfirm: "தோற்றம், மொழி மற்றும் விருப்பங்களை மீட்டமைக்கவா?",
    note: "கட்டண விகித மாற்றங்கள் இன்னும் பில் கணக்கீட்டில் பயன்படுத்தப்படவில்லை.",
    english: "English",
    sinhala: "සිංහල",
    tamil: "தமிழ்",
  },
};

export default function Settings() {
  const { language, setLanguage, appearance, setAppearance, dateFormat, setDateFormat, notifications, setNotifications } = useAppSettings();

  const [residentialRate, setResidentialRate] = useState(
    () => localStorage.getItem("wf-rate-residential") || "23"
  );

  const [businessRate, setBusinessRate] = useState(
    () => localStorage.getItem("wf-rate-business") || "25"
  );

  const [concessionRate, setConcessionRate] = useState(
    () => localStorage.getItem("wf-rate-concession") || "15"
  );

  const [backendStatus, setBackendStatus] = useState("checking");
  const [message, setMessage] = useState("");

  const t = translations[language];




useEffect(() => {
  let active = true;

  fetch("http://localhost:8080/api/customers")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Backend unavailable");
      }

      if (active) {
        setBackendStatus("connected");
      }
    })
    .catch(() => {
      if (active) {
        setBackendStatus("disconnected");
      }
    });

  fetch("http://localhost:8080/api/billing-settings")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Could not load billing settings");
      }

      return response.json();
    })
    .then((settings) => {
      if (active) {
        setResidentialRate(String(settings.residentialRate));
        setBusinessRate(String(settings.businessRate));
        setConcessionRate(String(settings.concessionRate));
      }
    })
    .catch((error) => {
      console.error("Failed to load billing settings:", error);
    });

  return () => {
    active = false;
  };
}, []);



const saveSettings = async () => {
console.log("Saving billing rates:", {
  residentialRate,
  businessRate,
  concessionRate,
});
  const rates = [
    residentialRate,
    businessRate,
    concessionRate,
  ];
  console.log("Save Settings button clicked");

{message && (
  <div className="settings-success-message">
    ✓ {message}
  </div>
)}

  if (
    rates.some(
      (rate) =>
        rate.trim() === "" ||
        !Number.isFinite(Number(rate)) ||
        Number(rate) < 0
    )
  ) {
    setMessage("Please enter valid non-negative billing rates.");
    return;
  }

  try {
    const response = await fetch(
      "http://localhost:8080/api/billing-settings",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          residentialRate: Number(residentialRate),
          businessRate: Number(businessRate),
          concessionRate: Number(concessionRate),
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to save billing rates");
    }
    console.log("Save API response:", response.status);
    const savedSettings = await response.json();
    setMessage("Settings saved successfully!");
    setResidentialRate(String(savedSettings.residentialRate));
    setBusinessRate(String(savedSettings.businessRate));
    setConcessionRate(String(savedSettings.concessionRate));

    localStorage.setItem(
      "wf-rate-residential",
      String(savedSettings.residentialRate)
    );
    localStorage.setItem(
      "wf-rate-business",
      String(savedSettings.businessRate)
    );
    localStorage.setItem(
      "wf-rate-concession",
      String(savedSettings.concessionRate)
    );

{message && (
  <p style={{ color: "green", marginTop: "12px" }}>
    ✓ {message}
  </p>
)}
    setMessage(t.saved);
    } catch (error) {
      console.error("Failed to save settings:", error);
      setMessage("Failed to save settings. Please try again.");
    }
};


  const resetSettings = () => {
    if (!window.confirm(t.resetConfirm)) return;


    localStorage.removeItem("wf-rate-residential");
    localStorage.removeItem("wf-rate-business");
    localStorage.removeItem("wf-rate-concession");

    setLanguage("en");
    setAppearance("light");
    setDateFormat("YYYY-MM-DD");
    setNotifications(true);

    setResidentialRate("23");
    setBusinessRate("25");
    setConcessionRate("15");

    setMessage("Settings restored to defaults.");
  };

  return (
    <main className="settings-page">
      <header className="settings-heading">
        <div>
          <span className="settings-eyebrow">WATER MANAGEMENT / ADMIN</span>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </div>
      </header>

      {message && (
        <div className="settings-message" role="status">
          {message}
          <button type="button" onClick={() => setMessage("")}>
            ×
          </button>
        </div>
      )}

      <section className="settings-card">
        <div className="settings-card-heading">
          <span className="settings-icon">◐</span>
          <div>
            <h2>{t.appearance}</h2>
            <p>{t.appearanceDesc}</p>
          </div>
        </div>

        <div className="appearance-options">
          {(
            [
              ["light", "☀", t.light],
              ["dark", "☾", t.dark],
              ["system", "▣", t.system],
            ] as [AppAppearance, string, string][]
          ).map(([value, icon, label]) => (
            <button
              type="button"
              key={value}
              className={`appearance-option ${
                appearance === value ? "selected" : ""
              }`}
              onClick={() => {
                setAppearance(value);
                setMessage("");
              }}
              aria-pressed={appearance === value}
            >
              <span className="appearance-symbol">{icon}</span>
              <span>{label}</span>
              {appearance === value && <span className="selected-check">✓</span>}
            </button>
          ))}
        </div>
      </section>

      <section className="settings-card">
        <div className="settings-card-heading">
          <span className="settings-icon">文</span>
          <div>
            <h2>{t.language}</h2>
            <p>{t.languageDesc}</p>
          </div>
        </div>

        <div className="settings-field">
          <label htmlFor="settings-language">{t.language}</label>
          <select
            id="settings-language"
            value={language}
            onChange={(event) => {
              setLanguage(event.target.value as AppLanguage);
              setMessage("");
            }}
          >
            <option value="en">{t.english}</option>
            <option value="si">{t.sinhala}</option>
            <option value="ta">{t.tamil}</option>
          </select>
        </div>
      </section>

      <section className="settings-card">
        <div className="settings-card-heading">
          <span className="settings-icon">⚙</span>
          <div>
            <h2>{t.preferences}</h2>
            <p>Configure your preferred application options.</p>
          </div>
        </div>

        <div className="settings-preferences-grid">
          <div className="settings-field">
            <label htmlFor="settings-date">{t.dateFormat}</label>
            <select
              id="settings-date"
              value={dateFormat}
              onChange={(event) => setDateFormat(event.target.value)}
            >
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            </select>
          </div>

          <div className="settings-field">
            <label htmlFor="settings-currency">{t.currency}</label>
            <select id="settings-currency" defaultValue="LKR" disabled>
              <option value="LKR">LKR — Sri Lankan Rupee</option>
            </select>
          </div>
        </div>

        <div className="settings-toggle-row">
          <div>
            <strong>{t.notifications}</strong>
            <p>{t.notificationsDesc}</p>
          </div>

          <label className="settings-switch">
            <input
              type="checkbox"
              checked={notifications}
              onChange={(event) => setNotifications(event.target.checked)}
            />
            <span className="settings-switch-track" />
          </label>
        </div>
      </section>

      <section className="settings-card">
        <div className="settings-card-heading">
          <span className="settings-icon">LKR</span>
          <div>
            <h2>{t.billing}</h2>
            <p>{t.billingDesc}</p>
          </div>
        </div>

        <div className="settings-rates-grid">
          <div className="settings-field">
            <label htmlFor="residential-rate">{t.residential}</label>
            <div className="settings-rate-input">
              <span>LKR</span>
              <input
                id="residential-rate"
                type="number"
                min="0"
                step="0.01"
                value={residentialRate}
                onChange={(event) => setResidentialRate(event.target.value)}
              />
            </div>
            <small>{t.perUnit}</small>
          </div>

          <div className="settings-field">
            <label htmlFor="business-rate">{t.business}</label>
            <div className="settings-rate-input">
              <span>LKR</span>
              <input
                id="business-rate"
                type="number"
                min="0"
                step="0.01"
                value={businessRate}
                onChange={(event) => setBusinessRate(event.target.value)}
              />
            </div>
            <small>{t.perUnit}</small>
          </div>

          <div className="settings-field">
            <label htmlFor="concession-rate">{t.concession}</label>
            <div className="settings-rate-input">
              <span>LKR</span>
              <input
                id="concession-rate"
                type="number"
                min="0"
                step="0.01"
                value={concessionRate}
                onChange={(event) => setConcessionRate(event.target.value)}
              />
            </div>
            <small>{t.perUnit}</small>
          </div>
        </div>

      </section>

      <section className="settings-card">
        <div className="settings-card-heading">
          <span className="settings-icon">●</span>
          <div>
            <h2>{t.system}</h2>
            <p>Check the connection between WaterFlow and its backend.</p>
          </div>
        </div>

        <div className="settings-system-row">
          <div className="settings-system-indicator">
            <span
              className={`system-dot ${
                backendStatus === "connected"
                  ? "online"
                  : backendStatus === "disconnected"
                    ? "offline"
                    : ""
              }`}
            />
            <div>
              <strong>{t.backend}</strong>
              <p>http://localhost:8080</p>
            </div>
          </div>

          <span
            className={`settings-connection-status ${backendStatus}`}
          >
            {backendStatus === "checking"
              ? "Checking..."
              : backendStatus === "connected"
                ? t.connected
                : t.disconnected}
          </span>
        </div>
      </section>

      <footer className="settings-actions">
{message && (
  <div className="settings-success-message" role="status">
    <span>{message}</span>
    <button
      type="button"
      onClick={() => setMessage("")}
      aria-label="Close message"
    >
      ×
    </button>
  </div>
)}

        <button
          type="button"
          className="settings-reset-button"
          onClick={resetSettings}
        >
          {t.reset}
        </button>

        <button
          type="button"
          className="settings-save-button"
          onClick={saveSettings}
        >
          ✓ {t.save}
        </button>
      </footer>
    </main>
  );
}
