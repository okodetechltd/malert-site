# MAlert website

The public site for the MAlert app: landing page, Android download, privacy
policy and account deletion page. Plain HTML and CSS.

**Live at https://malert.web.app** (Firebase Hosting, site `malert` in project
`m-alert-f5e67`). The site's files are in `public/`.

Deploy: `firebase deploy --only hosting` (from this folder).

The Android APK is served from `public/downloads/malert.apk` but is not
committed (see `.gitignore`). To publish a new version, build it in the app repo
(`flutter build apk --release`), copy it here, and update the version, size and
SHA-256 shown in the download section of `public/index.html`, then deploy.

The old GitHub Pages address (okodetechltd.github.io/malert-site) only holds
the small pages at the root of this repo, which forward each path to
malert.web.app. Keep `privacy.html` and `delete-account.html` file names stable:
the app and both stores link to them.
