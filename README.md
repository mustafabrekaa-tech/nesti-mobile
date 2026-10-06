# NESTI mobile apps (Android + iPhone)

One app, **NESTI**, for parents, staff, drivers and bus attendants. It opens nesticampus.com inside the
app, so every website update reaches the app instantly — no new app release needed.

What the app adds over the website:
- **Bus location keeps sharing with the phone locked** (drivers / attendants) — Android shows a
  "NESTI is sharing the bus location" notification while a route runs; iPhone shows the blue location pill.
- Home-screen icon and splash screen; opens straight into the person's school.

## Building
The `.github/workflows/build-apps.yml` file builds both apps on GitHub (free):
1. Create a repository on github.com and upload the files in this folder (about 15).
2. Open **Actions → Build NESTI apps → Run workflow**.
3. When it finishes, download **NESTI-android-test-apk** and install it on an Android phone.

Store releases need: a Google Play developer account (one-off $25) and an Apple Developer account
($99/year). Signing secrets are then added under the repository's **Settings → Secrets**.

App id: `com.nesticampus.app` · Start page: `https://nesticampus.com/app`
