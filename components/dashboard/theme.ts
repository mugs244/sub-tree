// Shared by the dashboard's server layout (inline init script) and the
// client ThemeToggle. Kept out of the "use client" file so the server layout
// gets the real string, not a client reference.

export type DashTheme = "light" | "dark" | "system"
export const DASH_THEME_STORAGE_KEY = "st_dash_theme"

// Runs inline before the dashboard paints, so a dark-mode user never sees a
// white flash. Resolves "system" via prefers-color-scheme and writes the
// result to <html data-dash-mode>, which the .dash-root palette keys off.
export const DASH_THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${DASH_THEME_STORAGE_KEY}")||"system";var d=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.setAttribute("data-dash-mode",d?"dark":"light")}catch(e){}})()`
