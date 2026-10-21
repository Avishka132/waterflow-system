# WaterFlow fixes and run guide

## Fixes included
- Removed an extra closing brace in `src/Settings.tsx` that could prevent the frontend from compiling/rendering.
- Connected Settings to the shared `SettingsProvider` so language, appearance, date format, and notification preference use one shared state across the app.
- Made settings storage read both older raw localStorage values and JSON values, avoiding fallback to defaults after reload.
- Applied the selected date format to the app header date.
- Added Sinhala and Tamil translations for the main navigation and page title labels.
- Replaced starter Vite global CSS that constrained the app width and centered all content; added shared dark-theme styles.

## Run on Windows
1. Start MySQL and verify `src/main/resources/application.properties`.
2. Open a terminal in the project root (`water-management`) and run `.mvnw.cmd spring-boot:run` (replace the displayed control character in this file with a backslash if copied; actual command is `./mvnw.cmd spring-boot:run` in PowerShell).
3. Open another terminal in `water-management-frontend`. Run `npm install` if dependencies are missing, then `npm run dev`.
4. Open the local URL printed by Vite, usually `http://localhost:5173`.

## Important limitations
- Payment records currently update the bill status to PAID; they do not create a separate payment transaction table.
- Billing rate preferences are stored in the browser but are not yet sent to the backend bill-calculation endpoint.
- The Employees page still uses the existing placeholder because the project does not include an employee backend/API.
- Frontend TypeScript check completed successfully (`tsc -b`). A full Vite production build could not be verified in this environment because the uploaded `node_modules` is missing the platform-specific Rolldown native binding. On your Windows PC, run `npm install` then `npm run build`.
