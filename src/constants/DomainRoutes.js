const APP_DOMAIN         = (import.meta.env.VITE_APP_URL || "https://app.postafly.com").replace(/\/+$/, "");
const ADMIN_DOMAIN       = (import.meta.env.VITE_ADMIN_URL || APP_DOMAIN).replace(/\/+$/, "");
const LOCAL_DOMAIN       = "http://localhost:5173";
const LOCAL_ADMIN_DOMAIN = "http://localhost:5173";

export const APP_ENV = import.meta.env.MODE === "production" ? "production" : "development";

// npm run dev  -> .env.development (localhost)
// npm run build -> .env.production  (app.postafly.com)
export const ACTIVE_DOMAIN_APP = APP_ENV === "development" ? (import.meta.env.VITE_APP_URL || LOCAL_DOMAIN).replace(/\/+$/, "") : APP_DOMAIN;
export const ACTIVE_DOMAIN_ADMIN = ACTIVE_DOMAIN_APP;

export const ADMIN_ROUTE_PREFIX = "/admin";

export const getFullUrl = (domain, path = "/") => `${domain}${path}`;

export const isDevEnv = () => APP_ENV === "development";

export const isAdminHost = () => {
    if (typeof window === "undefined") return false;
    return window.location.pathname.startsWith("/admin");
};

export const getAdminDashboardPath = () => `${ADMIN_ROUTE_PREFIX}/dashboard`;

/** Keep super_admin on the same app host at /admin/... */
export const goToAdminHome = (navigate) => {
    if (navigate) {
        navigate(getAdminDashboardPath());
        return;
    }

    window.location.assign(getAdminDashboardPath());
};

export { APP_DOMAIN, ADMIN_DOMAIN, LOCAL_DOMAIN, LOCAL_ADMIN_DOMAIN };
