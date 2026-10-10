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

if (platform === "android") {
  // Capacitor only connects the website to the app's phone features (bus GPS in the background,
  // opening files and printing) on the start address, nesticampus.com. Schools run on their own
  // sub-address (e.g. qis.nesticampus.com), so connect those too.
  const gradle = "android/app/build.gradle";
  let g = readFileSync(gradle, "utf8");
  if (!g.includes("androidx.webkit:webkit")) {
    g = g.replace("implementation project(':capacitor-android')", "implementation project(':capacitor-android')\n    implementation \"androidx.webkit:webkit:$androidxWebkitVersion\"");
    writeFileSync(gradle, g);
  }
  writeFileSync("android/app/src/main/java/com/nesticampus/app/MainActivity.java", `package com.nesticampus.app;

import android.os.Bundle;
import android.util.Log;
import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.JSExport;
import com.getcapacitor.PluginHandle;
import java.lang.reflect.Field;
import java.util.Collection;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        connectSchoolAddresses();
    }

    /** Inject Capacitor's bridge on every school sub-address, not only the start address. */
    @SuppressWarnings("unchecked")
    private void connectSchoolAddresses() {
        try {
            if (!WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)) return;
            Bridge bridge = getBridge();
            if (bridge == null || bridge.getWebView() == null) return;
            Field f = Bridge.class.getDeclaredField("plugins");
            f.setAccessible(true);
            Collection<PluginHandle> plugins = ((Map<String, PluginHandle>) f.get(bridge)).values();
            String script =
                JSExport.getGlobalJS(this, false, false) + "\\n\\n" +
                "window.WEBVIEW_SERVER_URL = 'https://nesticampus.com';\\n\\n" +
                JSExport.getBridgeJS(this) + "\\n\\n" +
                JSExport.getPluginJS(plugins) + "\\n\\n" +
                JSExport.getCordovaJS(this) + "\\n\\n" +
                JSExport.getCordovaPluginsFileJS(this) + "\\n\\n" +
                JSExport.getCordovaPluginJS(this);
            Set<String> origins = new HashSet<>();
            origins.add("https://*.nesticampus.com");
            WebViewCompat.addDocumentStartJavaScript(bridge.getWebView(), script, origins);
        } catch (Exception e) {
            Log.w("NESTI", "Could not connect school addresses", e);
        }
    }
}
`);
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
