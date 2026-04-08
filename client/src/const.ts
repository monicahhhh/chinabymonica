export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Returns the admin login page URL, with an optional returnPath query param.
export const getLoginUrl = (returnPath?: string) => {
  const url = new URL("/admin/login", window.location.origin);
  if (returnPath) url.searchParams.set("returnPath", returnPath);
  return url.toString();
};
