
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type AppLanguage = "en" | "si" | "ta";
export type AppAppearance = "light" | "dark" | "system";

type SettingsContextType = {
  language: AppLanguage;
  setLanguage: (value: AppLanguage) => void;
  appearance: AppAppearance;
  setAppearance: (value: AppAppearance) => void;
  dateFormat: string;
  setDateFormat: (value: string) => void;
  notifications: boolean;
  setNotifications: (value: boolean) => void;
  formatDate: (date: string | Date | null | undefined) => string;
};

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

function getStored<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    if (value === null) return fallback;
    try { return JSON.parse(value) as T; } catch { return value as T; }
  } catch {
    return fallback;
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<AppLanguage>(
    () => getStored("wf-language", "en")
  );

  const [appearance, setAppearance] = useState<AppAppearance>(
    () => getStored("wf-appearance", "light")
  );

  const [dateFormat, setDateFormat] = useState(
    () => getStored("wf-date-format", "YYYY-MM-DD")
  );

  const [notifications, setNotifications] = useState(
    () => getStored("wf-notifications", true)
  );

  useEffect(() => {
    localStorage.setItem("wf-language", JSON.stringify(language));
  }, [language]);

  useEffect(() => {
    localStorage.setItem("wf-appearance", JSON.stringify(appearance));

    const applyTheme = () => {
      const isDark =
        appearance === "dark" ||
        (appearance === "system" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);

      document.documentElement.dataset.theme = isDark ? "dark" : "light";
    };

    applyTheme();

    if (appearance !== "system") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", applyTheme);

    return () => media.removeEventListener("change", applyTheme);
  }, [appearance]);

  useEffect(() => {
    localStorage.setItem("wf-date-format", JSON.stringify(dateFormat));
  }, [dateFormat]);

  useEffect(() => {
    localStorage.setItem("wf-notifications", JSON.stringify(notifications));
  }, [notifications]);

  const formatDate = (
    value: string | Date | null | undefined
  ): string => {
    if (!value) return "—";

    const date = value instanceof Date ? value : new Date(`${value}`);

    if (Number.isNaN(date.getTime())) return String(value);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    switch (dateFormat) {
      case "DD/MM/YYYY":
        return `${day}/${month}/${year}`;
      case "MM/DD/YYYY":
        return `${month}/${day}/${year}`;
      default:
        return `${year}-${month}-${day}`;
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        language,
        setLanguage,
        appearance,
        setAppearance,
        dateFormat,
        setDateFormat,
        notifications,
        setNotifications,
        formatDate,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useAppSettings() {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error(
      "useAppSettings must be used inside SettingsProvider"
    );
  }

  return context;
}
