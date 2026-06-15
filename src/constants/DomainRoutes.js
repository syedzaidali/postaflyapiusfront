// const APP_DOMAIN         = "http://localhost:8000";
const APP_DOMAIN         = "https://app.postafly.com";
const ADMIN_DOMAIN       = "https://admin.postafly.com";
const LOCAL_DOMAIN       = 'https://localhost:5173';
const LOCAL_ADMIN_DOMAIN = 'https://localhost:5173';

export const APP_ENV = import.meta.env.MODE || 'development'; 

export const ACTIVE_DOMAIN_APP = APP_ENV == 'development' ? LOCAL_DOMAIN : APP_DOMAIN;
export const ACTIVE_DOMAIN_ADMIN = APP_ENV == 'development' ? LOCAL_ADMIN_DOMAIN : ADMIN_DOMAIN; 

export const ADMIN_ROUTE_PREFIX = APP_ENV == 'development' ? "/admin" : "";

export const getFullUrl = (domain, path = "/") => `${domain}${path}`;
