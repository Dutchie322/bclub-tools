# Bondage Club Tools

A web extension for the [Bondage Club](https://www.patreon.com/BondageProjects) game.

Available on the Chrome Web Store: https://chrome.google.com/webstore/detail/bondage-club-tools/pgigbkbcecbpgijnfhmpmkipgondpnpc

## Features
- Automatic logging of chat rooms, with a viewer to read the transcripts back.
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
