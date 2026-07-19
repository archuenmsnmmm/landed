import packageJson from "../../package.json";

export const APP_VERSION = packageJson.version;

/** Git tag for GitHub Releases (e.g. v0.1.0). */
export const DOWNLOAD_RELEASE_TAG = `v${APP_VERSION}`;
