# Bondage Club Tools

A web extension for the [Bondage Club](https://www.patreon.com/BondageProjects) game.

Available on the Chrome Web Store: https://chrome.google.com/webstore/detail/bondage-club-tools/pgigbkbcecbpgijnfhmpmkipgondpnpc

## Features
- Automatic logging of chat rooms, with a viewer to read the transcripts back.
- See where and when you met and talked with certain people.
- Read back on beep message exchanges with someone.
- Ability to send a desktop notification when a custom keyword is mentioned.
- Friends list in popup.
- Quick overview of the characters in the currently joined chat room (name, pronouns, ownership, and dominant level).
- Keeps track of people met in the game, when they were last online and allows you to keep notes with their profile.
- Also includes a picture of people's appearance, but this can use up a lot of disk space and make the extension slow. There is a button to clear these images in options.
- Optionally refresh the chat room list automatically, with a choice of how often this should happen. Disabled by default, can be enabled in options.

# Development

This project uses the following technologies, so prior knowledge of these is required if you want to contribute.

- [TypeScript](https://www.typescriptlang.org/)
- [RxJS](https://rxjs.dev/)
- [Angular](https://angular.io/)
- [Angular Material](https://material.angular.io/)
- [IndexedDB](https://developer.mozilla.org/en-US/docs/IndexedDB)
- [WebExtension API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)
- [Chrome Extension API](https://developer.chrome.com/docs/extensions/reference/)

## Components

The extension is divided into three main components:

- Log Viewer (also known as App)
- Options page
- Popup (which is shown when you click on the button in the toolbar)
- Content script
- Background script

### Log Viewer

The most important part of the extension, which provides a way to browse logs and look up information about a person.

This can be found in the `src/app` directory.

### Options page

A single page where a few options can be set, as well as data can be managed (export, import, clean up).

This component can be found in the `projects/options` directory.

### Popup

When the currently active tab in the browser is a logged in game session, this will show people in the current room and online friends.

If there is no active game tab, it will open the log viewer directly on the character selection screen.

This component can be found in the `projects/popup` directory.

### Content script

The content script is the bridge between the game and the extension. It listens to events from the Bondage Club server as well as user input and sends the data to the background script for further processing.

This is a very hacky solution but works well otherwise. TypeScript helps a lot to make sense of it all. It can be found in the `projects/content-script` directory.

### Background

The background script is an event based script which listens to events from the content script and processes them further. This includes storing data in the IndexedDB but also sending notifications if the user wants it to.

This can be found in the `projects/background` directory.

## Requirements

To develop locally you'll need:
- [NodeJS LTS](https://nodejs.org/en/), version 20. You can use [NVM](https://github.com/nvm-sh/nvm) (or [for Windows](https://github.com/coreybutler/nvm-windows)) to run specific NodeJS versions on your system (or use a dev container).
- Yarn, can be installed using `npm install -g yarn` after installing NodeJS. Note: this project uses Yarn Classic (v1.x).
- For coding I recommend [Visual Studio Code](https://code.visualstudio.com/).

I use a [Visual Studio Code Dev Container](https://code.visualstudio.com/docs/devcontainers/containers) to setup my environment quickly, there's a configuration inside the .devcontainer folder.

## Setup

1. Clone repository to a directory of your choice.
2. Open command prompt in the directory where you cloned the repository.
3. Execute `yarn` to install the dependencies (this can take a while).
4. After this you can build the project with `yarn build`.
5. This will build everything you need to run the extension locally in the `dist` directory.

## Using local build

### Chrome

1. Open the Extension Management page by navigating to `chrome://extensions`.
2. Enable Developer Mode by clicking the toggle switch next to **Developer mode**.
3. Click the **LOAD UNPACKED** button and select the extension directory.

See also [this page](https://developer.chrome.com/extensions/getstarted).

### Firefox

> [!WARNING]
> Currently unsupported (read: not working) as I focus on migrating the extension to Manifest V3 for Chrome.

1. Open Firefox
2. Enter `about:debugging` in the URL bar
3. Click "This Firefox"
4. Click "Load Temporary Add-on"
5. Open the extension's directory and select any file inside the extension, or select the packaged extension (.zip file).

See also [this page](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Temporary_Installation_in_Firefox).

# Releasing

Releases are published to the Chrome Web Store by the [Release workflow](.github/workflows/release.yml) when a version tag is pushed. The version comes from the tag; the manifest in the repository only holds the `0.0.0` placeholder for local builds.

1. Write the release notes in `release/notes/X.Y.Z.md`.
   - The **first line** is shown in the popup after updating, so keep it short and plain text.
   - The whole file (Markdown) becomes the GitHub release text.
   - The release fails if this file is missing.
2. Commit and push.
3. Tag and push the tag: `git tag vX.Y.Z && git push origin vX.Y.Z`.
4. The workflow builds, lints, tests, uploads the package to the Web Store, submits it for review and creates the GitHub release.

If the workflow fails after the upload, the Web Store won't accept the same version again: fix the problem and release the next patch version instead.

To build a release locally, set the version: `BCT_VERSION=X.Y.Z yarn build && yarn package`.

## One-time setup

The workflow logs in as a Google Cloud service account through Workload Identity Federation, so there are no keys or tokens to store or renew.

1. In the [Google Cloud console](https://console.cloud.google.com), pick or create a project, enable the **Chrome Web Store API** and create the service account (it needs no roles):
   ```sh
   PROJECT_ID=my-project
   gcloud services enable chromewebstore.googleapis.com --project "$PROJECT_ID"
   gcloud iam service-accounts create cws-publisher --project "$PROJECT_ID"
   SA_EMAIL="cws-publisher@$PROJECT_ID.iam.gserviceaccount.com"
   ```
2. In the [Developer Dashboard](https://chrome.google.com/webstore/devconsole) under **Account**, add `$SA_EMAIL` as service account (only one is allowed per publisher). Note the publisher ID under **Publisher > Settings**.
3. Let GitHub Actions of this repository act as the service account:
   ```sh
   gcloud iam workload-identity-pools create github --project "$PROJECT_ID" --location global
   gcloud iam workload-identity-pools providers create-oidc bclub-tools --project "$PROJECT_ID" --location global \
     --workload-identity-pool github \
     --issuer-uri "https://token.actions.githubusercontent.com" \
     --attribute-mapping "google.subject=assertion.sub,attribute.repository=assertion.repository" \
     --attribute-condition "assertion.repository == 'Dutchie322/bclub-tools'"
   POOL=$(gcloud iam workload-identity-pools describe github --project "$PROJECT_ID" --location global --format 'value(name)')
   for ROLE in roles/iam.workloadIdentityUser roles/iam.serviceAccountTokenCreator; do
     gcloud iam service-accounts add-iam-policy-binding "$SA_EMAIL" --project "$PROJECT_ID" --role "$ROLE" \
       --member "principalSet://iam.googleapis.com/$POOL/attribute.repository/Dutchie322/bclub-tools"
   done
   gcloud iam workload-identity-pools providers describe bclub-tools --project "$PROJECT_ID" --location global \
     --workload-identity-pool github --format 'value(name)'
   ```
4. In GitHub, go to **Settings > Environments**, create the environment `chrome-web-store` and add these **variables** (none of them is secret):
   - `GCP_WORKLOAD_IDENTITY_PROVIDER`: the provider name printed by the last command above
   - `CWS_SERVICE_ACCOUNT`: `$SA_EMAIL`
   - `CWS_PUBLISHER_ID`: the publisher ID from step 2

To test the upload locally without submitting for review (your own account needs the `roles/iam.serviceAccountTokenCreator` role on the service account):

```sh
BCT_VERSION=X.Y.Z yarn build && yarn package
CWS_PUBLISHER_ID=... \
CWS_ACCESS_TOKEN=$(gcloud auth print-access-token --impersonate-service-account "$SA_EMAIL" --scopes https://www.googleapis.com/auth/chromewebstore) \
  yarn publish:chrome --upload-only
```
