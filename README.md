# Bondage Club Tools

A web extension for the [Bondage Club](https://www.patreon.com/BondageProjects) game.

Available on the Chrome Web Store: https://chrome.google.com/webstore/detail/bondage-club-tools/pgigbkbcecbpgijnfhmpmkipgondpnpc

## Features
- Automatic logging of chat rooms, with a viewer to read the transcripts back.
- Optionally sending a desktop notification when someone beeps you.
- Optionally detecting when friends come online or go offline and sending a desktop notification when it happens.
- Ability to send a desktop notification when you or a keyword is mentioned.
- Up-to-date friends list in popup.
- Quick overview of the characters in the currently joined chat room (name, ownership, dominant level).
- Optionally show an FPS counter to help find performance issues within the game.
- Keeps track of people met in the game, when they were last online and allows one to keep notes on them.

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

- App
- Content script
- Background script

### App

The app contains the following parts of the extension:
- Log viewer
- Options page
- Popup (which is shown when you click on the button in the toolbar)

This is an Angular app with some fancy routing to separate the different components listed above. It uses Angular Material for easy to use interface building blocks.

This can be found in the `src/app` directory.

### Content script

The content script is the bridge between the game and the extension. It listens to events from the Bondage Club server as well as user input and sends the data to the background script for further processing.

This is a very hacky solution but works well otherwise. TypeScript helps a lot to make sense of it all. It can be found in the `projects/content-script` directory.

### Background

The background script is an event based script which listens to events from the content script and processes them further. This includes storing data in the IndexedDB but also sending notifications if the user wants it to.

This can be found in the `projects/background` directory.

## Requirements

To develop locally you'll need:
- [NodeJS LTS](https://nodejs.org/en/), if using Windows, be sure to install to Windows PATH.
- Yarn, can be installed using `npm install -g yarn` after installing NodeJS.
- For coding I recommend [Visual Studio Code](https://code.visualstudio.com/).

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

1. Open Firefox
2. Enter `about:debugging` in the URL bar
3. Click "This Firefox"
4. Click "Load Temporary Add-on"
5. Open the extension's directory and select any file inside the extension, or select the packaged extension (.zip file).

See also [this page](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Temporary_Installation_in_Firefox).
