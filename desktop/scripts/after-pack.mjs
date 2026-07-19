import path from "node:path";
import { installAppIcon } from "./build-icns.mjs";
import { signMacApp } from "./sign-mac-app.mjs";

export default async function afterPack(context) {
  if (context.electronPlatformName !== "darwin") return;

  const appName = `${context.packager.appInfo.productFilename}.app`;
  const appPath = path.join(context.appOutDir, appName);
  installAppIcon(appPath);

  // On release builds electron-builder signs with the Developer ID cert and
  // notarizes afterwards. Ad-hoc signing here would clobber that signature,
  // so only fall back to ad-hoc signing for unsigned local/CI builds.
  if (process.env.LANDED_RELEASE_SIGN === "1") {
    console.log("[landed] Release build — skipping ad-hoc sign (Developer ID + notarize handles it).");
    return;
  }

  signMacApp(appPath);
}
