// Creates the Android / iPhone projects on the build computer and applies NESTI's settings,
// so the repository only needs a handful of files.
import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const platform = process.argv[2]; // "android" | "ios"
const run = (c) => execSync(c, { stdio: "inherit" });

if (!existsSync(platform)) run(`npx cap add ${platform}`);
run(`npx capacitor-assets generate --${platform} --iconBackgroundColor "#ffffff" --splashBackgroundColor "#0E3B35"`);

if (platform === "android") {
  const strings = "android/app/src/main/res/values/strings.xml";
  let s = readFileSync(strings, "utf8");
  if (!s.includes("capacitor_background_geolocation_notification_channel_name")) {
    s = s.replace("</resources>", '    <string name="capacitor_background_geolocation_notification_channel_name">Bus location sharing</string>\n</resources>');
    writeFileSync(strings, s);
  }
  const gradle = "android/app/build.gradle";
  const version = JSON.parse(readFileSync("package.json", "utf8")).version;
  const code = Number(process.env.GITHUB_RUN_NUMBER || 1);
  writeFileSync(gradle, readFileSync(gradle, "utf8").replace(/versionCode \d+/, `versionCode ${code}`).replace(/versionName "[^"]*"/, `versionName "${version}"`));
}

if (platform === "ios") {
  const plist = "ios/App/App/Info.plist";
  let p = readFileSync(plist, "utf8");
  if (!p.includes("UIBackgroundModes")) {
    p = p.replace("<dict>\n", `<dict>
\t<key>NSLocationWhenInUseUsageDescription</key>
\t<string>NESTI uses your location to share the school bus position with families and the school while you run a route.</string>
\t<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
\t<string>NESTI keeps sharing the school bus position while the phone is locked, until the route ends.</string>
\t<key>UIBackgroundModes</key>
\t<array>
\t\t<string>location</string>
\t</array>
`);
    writeFileSync(plist, p);
  }
}
run(`npx cap sync ${platform}`);
