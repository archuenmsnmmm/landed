import type { MetadataRoute } from "next";
import { LEGAL_ROUTES, SUPPORT_ROUTES } from "@/content/legal/config";
import { LANDED_MARKETING_ORIGIN } from "@/lib/landed-urls";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? LANDED_MARKETING_ORIGIN;

const routes = [
  "",
  "/pricing",
  "/download",
  "/app",
  "/contact",
  SUPPORT_ROUTES.helpCenter,
  LEGAL_ROUTES.terms,
  LEGAL_ROUTES.privacy,
  LEGAL_ROUTES.acceptableUse,
  LEGAL_ROUTES.cookies,
  LEGAL_ROUTES.subprocessors,
  LEGAL_ROUTES.dpa,
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return routes.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified,
    changeFrequency: path === "" || path === "/pricing" ? "weekly" : "monthly",
    priority: path === "" ? 1 : path === "/download" || path === "/pricing" ? 0.9 : 0.6,
  }));
}
