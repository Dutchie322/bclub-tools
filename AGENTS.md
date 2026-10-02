# AGENTS.md — Bondage Club Tools (bclub-tools)

Reference for coding agents. It captures how the project is put together and how it behaves today. Paths are relative to the repo root. Verify symbols before relying on them, because code changes faster than this file.

## 1. Overview

- A web extension for the browser game **Bondage Club** (chat rooms + avatars). Published on the Chrome Web Store (id `pgigbkbcecbpgijnfhmpmkipgondpnpc`).
- **Targets Chromium, Manifest V3.** A Firefox MV2 manifest is still generated, but Firefox is currently **unsupported / not working** (README).
- Features:
  - automatic chat-room logging plus a replay viewer
  - a database of people met, with user notes
  - "shared rooms" with a person
  - beep (DM) history
  - keyword desktop notifications
  - a popup listing the current room's characters and online friends
  - appearance snapshots (PNG)
  - optional auto-refresh of the chat-room search
- Data lives in **IndexedDB** (`bclub-tools` DB) and **`chrome.storage.local`** (settings plus per-tab session state).
- Game domains are listed in **3 places that must stay in sync**:
  - Domains: `bondageprojects.com`, `bondageprojects.elementfx.com`, `bondage-europe.com`, `bondageeurope.com`, `bondage-asia.com`.
  1. `projects/manifest/base-manifest.json`: `content_scripts.matches` and `web_accessible_resources.matches`
  2. `projects/manifest/chrome-additions.json` `host_permissions` and `projects/manifest/firefox-additions.json` `permissions`
  3. `models/web-extension/functions.ts` → `executeForAllGameTabs`

## 2. Repository layout

```
src/                     Log Viewer Angular app (angular project "log-viewer", root "")
  app/                   routes + components (see §7)
  app/shared/            services reused by options/popup too (Database, ChatLogs, Member, Export, Import)
  assets/                game CSVs (fetched at runtime), fonts, bclub-logo.png
projects/
  popup/                 Angular app: toolbar popup
  options/               Angular app: options page
  background/            plain TS → webpack → dist/background/main.js (MV3 service worker, type: module)
  content-script/        plain TS → webpack → dist/content-script/{main.js,hooks.js}
  fallback/              plain TS → webpack → dist/index.html + dist/main.js (legacy URL redirector)
  manifest/              base-manifest.json + {chrome,firefox}-additions.json + create-manifests.js
models/                  shared types + functions (barrel models/index.ts), used by EVERYTHING
release/                 create-package.js (zips), publish-chrome.js (Web Store upload), notes/<version>.md, firefox-updates.json, store text/screenshots
tools/update-externals.js  pulls game CSVs + Typedef.d.ts from upstream Bondage-College (gitgud.io)
tests/                   all unit specs, mirroring the source layout (see §3)
e2e/                     legacy Protractor scaffolding, unused
known-bugs.txt           short list of known issues
```

**Import resolution.** `tsconfig.json` sets `baseUrl: "./"`. That is why every project can `import ... from 'models'`, and why Angular apps can import `'src/app/shared/...'` and `'projects/content-script/src/...'`. Some files use relative paths (`'../../../models'`) instead, and both forms work.

## 3. Build, lint, test, release

- **Yarn Classic (v1).** Node 20 in CI/README, Node 22 in the devcontainer. `package.json` has `"type": "module"`, so the webpack configs and node scripts are ESM and use `import.meta.dirname`.
- There are two build pipelines:
  - **Angular CLI** (`@angular-devkit/build-angular:application`, Angular 19) for `log-viewer`, `popup`, `options` (see `angular.json`).
  - **webpack-cli + ts-loader** for `background`, `content-script`, `fallback`. They compile with the same TypeScript (~5.6) that Angular uses and extend the root `tsconfig.json`. Each has its own `tsconfig.json` and `webpack.config.js`, and all use `devtool: 'inline-source-map'`.
- `yarn build` (production) runs the 3 `ng build <proj> --aot --configuration production` builds **sequentially**, then runs `build:manifests`, `build:background`, `build:content-script`, `build:fallback` **in parallel** (npm-run-all). `yarn build-debug` is the dev equivalent (webpack `--mode=development`, ng default config).
- `projects/content-script/webpack.config.js` exports **two configs**: `main` (classic script, injected by the manifest) and `hooks` (ES module output, `library.type: 'module'`, loaded by dynamic `import()` in the page; see §4).
- `projects/manifest/create-manifests.js` deep-merges `base-manifest.json` + `<browser>-additions.json` + optional, **gitignored** `private-<browser>-additions.json`. The private Chrome file holds the extension `key`. It writes `dist/manifest.json` (Chrome) and `dist/manifests/manifest-{chrome,firefox}.json`.
- `dist/` layout: `background/`, `content-script/`, `log-viewer/`, `options/`, `popup/`, `index.html` + `main.js` (fallback), `manifest.json`, `manifests/`. **Load `dist/` unpacked** in `chrome://extensions`.
- `yarn package` (after build) runs `release/create-package.js`, which writes `dist/bclub-tools-{chrome,firefox}.zip` with the matching manifest.
- `yarn lint` runs `ng lint` for the 3 Angular projects.
  - The root `.eslintrc.json` ignores `projects/**/*`. `projects/popup` and `projects/options` re-include themselves through their own `.eslintrc.json`.
  - **background and content-script are not linted.**
  - Rules: `app` component/directive prefix, `@typescript-eslint/no-unused-vars` with `_` prefix allowed.
- `yarn test` runs Karma + Jasmine (ng-mocks, sinon-chrome) in a real Chrome, so IndexedDB, `OffscreenCanvas` etc. are the real thing.
  - All specs live in `tests/`, mirroring the source layout, and import the code under test through root-relative paths (`models/...`, `projects/popup/src/...`). Which test target runs them (its `include` globs are relative to the project's `sourceRoot`):
    - `log-viewer`: `tests/models/**` and `tests/src/**` (e.g. `tests/models/database/maintenance-functions.spec.ts`, which uses the real `bclub-tools` database in the test page's origin and stubs `chrome.storage.local` by hand)
    - `popup`: `tests/projects/popup/**` (`new-version-notification.component.spec.ts`)
    - `options` has no test target (it never had specs). Add one, modelled on popup's, when it does.
  - Both targets use the root `karma.conf.cjs`. It's `.cjs` because `"type": "module"` would make a `.js` config ESM. Without it, Angular's built-in config requires the uninstalled `karma-coverage`.
  - `tests/polyfills.ts` defines Node's `global`, which sinon (via sinon-chrome) needs. It's in popup's test `polyfills`.
  - Headless run: `yarn test:ci` (= `ng test --no-watch --no-progress --browsers=ChromeHeadlessCI`; `ng test <project> ...` for one project). Karma finds the browser through `CHROME_BIN`. The devcontainer (`.devcontainer/Dockerfile`) installs Debian's `chromium` and sets `CHROME_BIN=/usr/bin/chromium`. `ChromeHeadlessCI` adds `--no-sandbox`, which containers need.
- CI is `.github/workflows/node.js.yml` (the release workflow is described below). It runs on `master`, `feature/**`, and PRs to master: `yarn` → `yarn build` → `yarn lint` → `yarn package`, then uploads `dist` as an artifact.
- **TS settings:** `strict: false` (expect `!`, `any`, implicit nulls), `noImplicitReturns`, `noPropertyAccessFromIndexSignature`, `noImplicitOverride`, `isolatedModules`, ES2022, `moduleResolution: bundler`. Angular strict templates are on.
- **Style:** 2-space indent, single quotes, UTF-8, final newline (`.editorconfig`). Angular Material prebuilt theme `rose-red`. Component styles are SCSS.
- **Release** (tag-driven; human steps and one-time Google Cloud setup are in README "Releasing"):
  1. Write `release/notes/X.Y.Z.md`. Its first non-empty line is the popup's "New release" summary; the whole file becomes the GitHub release body.
  2. Push tag `vX.Y.Z`. `.github/workflows/release.yml` sets `BCT_VERSION=X.Y.Z` and runs build → lint → test:ci → package. It then authenticates as a service account through Workload Identity Federation (`google-github-actions/auth`; environment `chrome-web-store`, variables `GCP_WORKLOAD_IDENTITY_PROVIDER`, `CWS_SERVICE_ACCOUNT`, `CWS_PUBLISHER_ID`), runs `yarn publish:chrome` (`release/publish-chrome.js`: Web Store API v2 upload → poll `fetchStatus` → publish; `--upload-only` skips publish), and runs `gh release create`.
  - **The version comes from the tag, not the repo.** `base-manifest.json` holds the placeholder `0.0.0`. `create-manifests.js` overrides `version` with `BCT_VERSION` when it is set, and **throws if `release/notes/<version>.md` is missing** or the version is malformed.
  - `create-manifests.js` also writes `dist/release-notes.json` (`{version, summary}`, `summary` null without a notes file outside release mode). `create-package.js` includes it in the zips. The popup fetches it and passes the summary as `MAT_SNACK_BAR_DATA` to `NewVersionNotificationComponent`, so **don't hard-code release text in the template**.
  - The Mod SDK registration in `hooks.ts` receives the version at runtime (§4a).
- **Update game data:** `yarn tool:update-externals` downloads the CSVs below into `src/assets/` and `Scripts/Typedef.d.ts` into `models/game/`, at the git revision hard-coded in the `package.json` script. Change the hash to update. Files:
  - `ActivityDictionary.csv`, `AssetStrings.csv`, `Female3DCG.csv`, `Interface.csv`, `Text_InformationSheet.csv`, `Text_Title.csv`

## 4. Runtime architecture and message flow

There are three JS "worlds":
- the **page MAIN world**, where the game's globals live
- the **content-script ISOLATED world**
- the **background service worker**

Extension pages (log viewer, popup, options) read IndexedDB and `chrome.storage` directly.

### Injection handshake (per game tab)
1. **`projects/content-script/src/main.ts`** (ISOLATED, manifest-declared, `document_idle`):
   - registers a `window` `message` listener (`pageToBackendListener`)
   - sends `{type:'content-script', event:'GameStart'}` to the background
   - stores the `handshake` from the response
2. **Background `GameStart`** (`projects/background/src/main.ts`):
   - `self.crypto.randomUUID()` → `store(tabId,'handshake', …)`
   - `chrome.scripting.executeScript({func: checkForGame, args:[handshake], world:'MAIN'})`
3. **`check-for-game.ts`** (MAIN) polls up to 10× at 1 s intervals. It looks for `#MainCanvas`, a `<script>` ending in `Screens/Online/ChatRoom/ChatRoom.js`, and `window.ServerSocket`. When all are found it posts `{handshake, type:'content-script', event:'GameLoaded'}`. Detecting this way supports beta/"cheat" URLs and stays silent on non-game pages.
4. **Background `GameLoaded`** validates the handshake, then calls `injectScripts`:
   - `importAndHook(chrome.runtime.getURL('content-script/hooks.js'), handshake, settings.tools.chatRoomRefreshInterval, chrome.runtime.getManifest().version)` in MAIN. This does `import(/* webpackIgnore: true */ path)` → `registerHooks(...)`. `hooks.js` is listed in `web_accessible_resources` (`use_dynamic_url`).
   - `checkForLoggedInState(handshake)` in MAIN posts a `client`/`VariablesUpdate` with `CurrentScreen` and `Player.{MemberNumber,Name}`.
5. **`hooks.ts`** (MAIN, real module, so imports are OK) calls `bcModSdk.registerMod({name:'BCT', fullName:'Bondage Club Tools', …}, {allowReplace:true})`. It hooks:
   - `CommonDrawAppearanceBuild` → `sendCharacterAppearance` (`draw-listeners.ts`). This debounces 1 s per member, then encodes the canvas asynchronously with `Canvas.toBlob(cb, 'image/webp', 0.9)`, converts it to a data URL (extension messaging is JSON-only), and posts it plus height metadata as `client`/`CommonDrawAppearanceBuild`.
   - `ServerInit` → re-attaches the socket listeners in a `setTimeout` (after reconnect, a new `ServerSocket` exists).
   - It also attaches the listeners immediately on first run.
6. Every message from page to background goes through `window.postMessage({handshake, type, event, data, ...})`. The content-script listener drops anything without `handshake/type/event` or with the wrong handshake, then calls `chrome.runtime.sendMessage`. If that call throws (extension reloaded or removed), it unregisters itself. The handshake prevents duplicate data when the extension updates while the game stays open.

> **Rule:** functions passed as `executeScript({func})` (`checkForGame`, `checkForLoggedInState`, `importAndHook`, `requestOnlineFriends`) are **serialized**. They must be fully self-contained, with no imports, closures, or module helpers. Put anything that needs imports in `hooks.ts` or its imports.

### Server → client events (`projects/content-script/src/server-event-listeners.ts`)
`createForwarder(handshake, event, mapper)` inserts a listener at the front of `ServerSocket.listeners(event)` (`unshift`), so it runs before the game's handler. The mapper returns a slimmed object, or `false` to skip. Mapper exceptions are caught and logged. The posted message is `{handshake, type:'server', event, data, inFocus: document.hasFocus()}`.

| Event | Filter / mapping |
|---|---|
| `AccountBeep` | skip if `BeepType` is set (leash) or `Message` is not a string. Strip FBC/WCE metadata after ``, trim, skip if empty |
| `AccountQueryResult` | only `Query === 'OnlineFriends'`, mapped result list |
| `ChatRoomMessage` | skip `Hidden`/`Status`. Enrich with `ChatRoom` (from global `ChatRoomData`, characters mapped), `SessionId = Player.CharacterID`, `PlayerName`, `PlayerNickname`, `MemberNumber`, `Timestamp` |
| `ChatRoomSearchResponse` | only `RoomBanned` / `RoomKicked` |
| `ChatRoomSync` | room name/desc/background + mapped characters |
| `ChatRoomSyncCharacter`, `ChatRoomSyncMemberJoin`, `ChatRoomSyncSingle` | `{Character: mapCharacter(...)}` |
| `ChatRoomSyncMemberLeave` | `{SourceMemberNumber}` |
| `LoginResponse` | MemberNumber, Name, FriendList, Lovership, Ownership |

`mapCharacter` drops heavy fields like Inventory and keeps `Appearance` as `{Group, Name, Color, Difficulty, Property, Craft}`.

### Client → server events (`projects/content-script/src/user-input-listener.ts`)
`ServerSocket.prependAnyOutgoing` runs each outgoing event through `getEventMappers(searchInterval)`, which is typed with `satisfies MappedClientToServerEvents`. Results are posted as `type:'client'`.
- `AccountBeep`: outgoing beep (same filters as the server side). `MemberName` comes from `Player.FriendNames`.
- `ChatRoomChat`: skipped if there is no `ChatRoomData` or the type is `Hidden` (other mods use Hidden). Enriched like ChatRoomMessage, plus `Target`/`TargetName`. The background only **stores Whispers** from this event, because normal chat echoes back through `ChatRoomMessage`.
- `ChatRoomLeave` → `{}`.
- `ChatRoomSearch` is **not forwarded**. It (re)arms the search **auto-refresh** timer: when the interval is > 0, it calls `ChatSearchQuery(ChatSearchQueryString)` but only while `CurrentScreen === 'ChatSearch'` and `ChatSearchResultOffset === 0`. Otherwise it retries next cycle.

### Background (`projects/background/src/`)
`chrome.runtime.onMessage` routes on `message.type` (`content-script` | `client` | `server`) and returns `true` (async `sendResponse`). Handlers:

| Message | Effect |
|---|---|
| server `AccountBeep` | `writeBeepMessage(player, data, 'Incoming')` → `beepMessages` |
| client `AccountBeep` | same, `'Outgoing'` |
| server `AccountQueryResult` (OnlineFriends) | `writeMember(..., DataSource.OnlineFriends)` for each friend, `store(tab,'onlineFriends', members)` |
| server `ChatRoomMessage` | `writeChatLog` → `chatRoomLogs`. If `!inFocus`, `notifyIncomingMessage` |
| client `ChatRoomChat` | Whisper only → `writeChatLog` |
| server `ChatRoomSync` | `store(tab,'chatRoomCharacter', chars)` + `writeMember(ChatRoom)` for each |
| server `ChatRoomSyncSingle` / `ChatRoomSyncCharacter` | both go to `handleChatRoomSyncSingle`: replace the char in the stored list + `writeMember` |
| server `ChatRoomSyncMemberJoin` / `Leave` | push / splice in the stored list (no member write) |
| server `ChatRoomSearchResponse` (banned/kicked), client `ChatRoomLeave` | clear `chatRoomCharacter` |
| server `LoginResponse`, client `VariablesUpdate` (MemberNumber > 0) | `setPlayerLoggedIn`: `store(tab,'player')`, `chrome.action.setPopup({tabId, popup:'popup/index.html'})`, title `"<name>: <player>"` |
| client `VariablesUpdate` with `CurrentScreen === 'Login'` | `cleanUpData(tab)`: strip room data from online friends, clear per-character keys, reset popup/title |
| client `CommonDrawAppearanceBuild` | `dataUrlToBlob` → upsert into `appearances` store as a `Blob`. Delete legacy `member.appearance`/`appearanceMetaData` from `members` (lazy migration) |

Other listeners:
- `chrome.tabs.onRemoved` → `cleanUpData(tab, true)` (clears all per-tab keys including the handshake).
- `chrome.runtime.onInstalled` re-injects `content-script/main.js` into already-open game tabs.
- `chrome.alarms.onAlarm` (`maintenance`) → `runScheduledMaintenance()` (§7a).
- `chrome.action.onClicked` opens `/log-viewer/index.html`. It only fires when no popup is set, meaning the tab is not logged in.

Supporting modules:
- `chat-log.ts` builds an `IChatLog`. Sender info comes from the room's character list. `characters.SourceCharacter`/`TargetCharacter` snapshots are taken from dictionary entries and include `Pronouns` from the `Pronouns` appearance group and `HasPenis`/`HasVagina` from the `Pussy` group, so later rendering is accurate.
- `member.ts`: `writeMember` merges into the existing record and deletes the deprecated `type`.
  - ChatRoom source sets `lastSeen = now`, name, nickname, `normalizedNickname` (NFKC, only stored if different), creation, title, dominant reputation, `description` (LZ-decompressed), difficulty, labelColor, lovership, ownership, pronouns.
  - OnlineFriends source sets chat room name/space/count/limit/private.
  - `removeChatRoomData` clears the room fields.
- `notifications.ts`: skips the player's own messages. Builds the text with `renderContent(chatLog)` and tests `\b(?:kw1|kw2…)\b` (flags `iu`, keywords regex-escaped). On a match, it calls `chrome.notifications.create` "Mentioned by <sender>" for Action/Activity/ServerMessage/Emote/Chat.

The popup also injects `requestOnlineFriends` (`projects/content-script/src/update-friends.ts`) into MAIN, which runs `ServerSend('AccountQuery', {Query:'OnlineFriends'})` unless the player is on the Login screen. The response flows back through the normal pipeline.

## 4a. BC Mod SDK and game typings (bc-stubs)

### The Mod SDK (`bondage-club-mod-sdk`, v1.2.0)
- Source: <https://github.com/Jomshir98/bondage-club-mod-sdk>. It is the community-standard way to change Bondage Club functions without clashing with other mods. Older versions of this extension wrapped functions with proxies themselves, and that conflicted more and more as the number of mods grew (see the comment in `hooks.ts`).
- It is an npm dependency, imported as `import bcModSdk from 'bondage-club-mod-sdk'` and **bundled into `content-script/hooks.js`** by webpack. It only works in the page's **MAIN world**, because it replaces global game functions on `window`. At runtime the SDK is a page-wide singleton (`window.bcModSdk`): every mod's bundled copy hooks into the same instance. Mismatched SDK `version`s only warn, but mismatched `apiVersion`s fail.
- API (types in `node_modules/bondage-club-mod-sdk/dist/bcmodsdk.d.ts`):
  - `bcModSdk.registerMod({name, fullName, version, repository?}, {allowReplace?})` → `ModSDKModAPI`. With `allowReplace: true`, registering the same `name` again unloads the old registration and its hooks first. This extension relies on that when hooks are injected again after an extension update.
  - `mod.hookFunction(name, priority, hook)` returns a function that removes the hook.
    - `name` is a global function name. Dotted paths are allowed for methods, for example `'Player.CanChange'`.
    - **Higher priority runs first.**
    - The hook is a `PatchHook`, `(args, next) => result`. It receives the original arguments as a tuple, and `next(args)` calls the next hook in the chain and finally the original function.
    - Code before `next()` runs before the original, and code after it runs afterwards. You can change `args` before passing them on or replace the return value. **If `next` isn't called, the original function (and any lower-priority hooks) is skipped.**
  - `mod.callOriginal(name, args, context?)` calls the unmodified function, skipping all hooks and patches from all mods.
  - `mod.patchFunction(name, {searchText: replacement | null})` + `removePatches(name)` edit the function's source text and re-`eval` it. **Dangerous and conflict-prone. Avoid it unless `hookFunction` really can't do the job.** `getOriginalHash(name)` (CRC32 of the original source) can detect upstream changes before patching.
  - `mod.unload()`. Global helpers: `bcModSdk.getModsInfo()` and `bcModSdk.getPatchingInfo()` (who hooked or patched what). These are handy in the game's devtools console for debugging conflicts.
- **Use in this repo** (`projects/content-script/src/hooks.ts` → `registerHooks(handshake, searchInterval, version)`):
  - `registerMod({name: 'BCT', fullName: 'Bondage Club Tools', version, repository}, {allowReplace: true})`. `version` is the manifest version, passed from the background (`chrome.runtime.getManifest()` isn't available in the MAIN world). Registering also makes the extension visible to other mods through `getModsInfo()`.
  - `hookFunction('CommonDrawAppearanceBuild', 0, …)` only observes: it calls `sendCharacterAppearance(args[0], handshake)` and then `return next(args)`.
  - `hookFunction('ServerInit', 0, …)` runs when the game rebuilds `ServerSocket` after a disconnect. Its code runs *before* the original creates the new socket, so it re-attaches the listeners in a `setTimeout`. An equivalent idiom would be `const r = next(args); /* attach */; return r;`.
- **What the SDK does *not* cover here:** network traffic. Socket.io handlers are anonymous listeners, not named globals, so server and client events are intercepted with the socket.io API directly (`ServerSocket.listeners(event).unshift(...)` and `ServerSocket.prependAnyOutgoing(...)`, see §4). `allowReplace` does **not** remove these listeners. After an extension reload the old listeners stay on the socket, but their messages carry the old handshake, so the new content script drops them. That is one reason the handshake exists. Each `ServerInit` also starts from a fresh socket.

### Game typings: bc-stubs (`bc-stubs`, v130.0.0, a devDependency)
- Source: <https://github.com/bananarama92/BC-stubs>. These are `.d.ts` stubs **auto-generated from the game's source** (gitgud.io Bondage-College), declaring the game's globals: functions, `var`s, `Character`/`PlayerCharacter`, server message types, and more. The package major version follows the game release (130 → R130). Upgrade it with the game (`yarn upgrade bc-stubs@<release>`). Everything is ambient (global `declare`s), not modules.
- Layout under `node_modules/bc-stubs/bc/`:
  - `Scripts/*.d.ts`, the engine: `Common.d.ts` (`Player`, `CurrentScreen`, …), `Server.d.ts` (`ServerInit`, `ServerSend`, `ServerSocket`), `CommonDraw.d.ts`, …
  - `Screens/**` (per screen: `Online/ChatRoom/ChatRoom.d.ts`, `Online/ChatSearch/ChatSearch.d.ts`, …)
  - `NativeDeclarations/` (`Messages.d.ts` with `ServerToClientEvents`/`ClientToServerEvents`, all `Server*` payload types and `ChatMessageDictionary*`; also `Typedef.d.ts`, `Female3DCG_Types.d.ts`, …)
  - `bcmodsdk.d.ts` (a global `bcModSdk` declaration; this repo uses the npm package's typed import instead)
- **How the two fit together for type safety.** The SDK types `hookFunction<TFunctionName extends string>(name, priority, hook: PatchHook<GetDotedPathType<typeof globalThis, TFunctionName>>)`. When bc-stubs declares the named function, `args` becomes the exact parameter tuple and `next`/the return value get the exact return type. For example, `hookFunction('ChatRoomMessageDisplay', …)` gives `args: [data: ServerChatRoomMessage, msg: string, SenderCharacter: Character, metadata: IChatRoomMessageMetadata]`. Caveats (verified with `tsc` probes):
  - **Name typos and undeclared functions are not compile errors.** The lookup resolves to `never`, so `args`/`next` become `never`, and that is assignable to anything.
  - Only `declare function` and `declare var` appear on `typeof globalThis`. Globals declared with `let`/`const` (for example bc-stubs' `declare let ChatRoomData`) don't, so dotted paths through them resolve to `never`.
  - If you want typos rejected, wrap the call in a helper constrained to `keyof typeof globalThis` (suggestion; not present in the code today).
- **Current state in this repo (as verified, and partly broken):**
  - `projects/content-script/tsconfig.json` `include` lists `node_modules/bc-stubs/bc/**/*.d.ts`, but tsconfig paths are relative to the tsconfig file, so this resolves to `projects/content-script/node_modules/...` and **matches nothing**. `tsc -p projects/content-script/tsconfig.json --listFilesOnly` shows that only **3** stub files are compiled. Each is pulled in by a triple-slash `/// <reference path="../../../node_modules/bc-stubs/bc/...">`:
    - `Scripts/Common.d.ts`
    - `Screens/Online/ChatRoom/ChatRoom.d.ts`
    - `NativeDeclarations/Messages.d.ts` (the last one comes via `models/client-messages/IChatRoomChat.ts`)
  - What that means for the existing hooks:
    - `CommonDrawAppearanceBuild` is typed from the hand-written `projects/content-script/src/globals.d.ts` as `[C: any, callbacks: object]`.
    - **`ServerInit` resolves to `never`, so it is untyped**, because `Scripts/Server.d.ts` isn't loaded.
    - Functions from `ChatRoom.d.ts`/`Common.d.ts` are fully typed.
  - `globals.d.ts` in `projects/{content-script,background,popup}/src/` hand-declares a subset of game globals with looser types: `ServerSocket` is an *untyped* socket.io `Socket`, `ChatSearchQuery` is in the content-script only, and so on. The existing socket code depends on that looseness.
  - **Turning on the full stubs** (the include fixed to `"../../node_modules/bc-stubs/bc/**/*.d.ts"`, verified in a probe) types everything, including `CommonDrawAppearanceBuild` → `Character` and `Player.*`. However, `ServerSocket` then becomes `Socket<ServerToClientEvents, ClientToServerEvents>`. That produces 2 errors in `server-event-listeners.ts` `createForwarder`, where `listeners(event: string)` is too loose, and those must be fixed first. The overlapping `globals.d.ts` declarations should be reconciled at the same time.
  - There is a **second, separate game typing source**: `models/game/Typedef.d.ts`. It is downloaded by `tools/update-externals.js`, referenced from `models/presentation/functions.ts`, and needed by the Angular builds. There are also the hand-written interfaces in `models/game/` and `models/server-messages/`. These can drift from bc-stubs. Prefer bc-stubs types for new MAIN-world code, and keep the slim `models/` interfaces for data that crosses `postMessage` into the extension.
- **Writing a new hook (checklist):**
  1. Make sure the target function is declared. Add the right `/// <reference path>` to the bc-stubs file (or fix the include), then confirm `args` is not `never`.
  2. Add `mod.hookFunction('Name', 0, (args, next) => { …observe…; return next(args); })` in `registerHooks`. Keep extension work inside `try/catch` so a failure can never break the game. Existing code logs `[Bondage Club Tools] … Game is unaffected` warnings.
  3. Send data out with `window.postMessage({handshake, type: 'client', event: 'Name', data}, '*')`. Keep `data` small and structured-clone safe: no `Character` objects, functions, or canvases. Then add a `case` in `handleClientMessage` in the background.
  4. Only skip `next()` or change `args`/return values on purpose. The extension is currently purely observational.

## 5. Data storage

### IndexedDB: database `bclub-tools`, **version 6**
Open with `openDatabase()` in `models/database/functions.ts`. It `alert()`s on `blocked`, and on `versionchange` it closes and alerts. `upgradeDatabase()` in `models/database/upgrades.ts` is **state-based and idempotent**: it checks for stores and indexes rather than stepping through versions, with a changelog comment at the top.

| Store | Key | Indexes | Type |
|---|---|---|---|
| `chatRoomLogs` | autoIncrement `id` | `senderMemberNumber_idx` = [session.memberNumber, sender.id, session.id, chatRoom] (shared rooms) · `sessionMemberNumber_idx` = session.memberNumber (list own characters) · `member_session_chatRoom_idx` = [chatRoom, session.id, session.memberNumber] (session list + replay) | `IChatLog` |
| `members` | [playerMemberNumber, memberNumber] | `memberName_idx` = [playerMemberNumber, memberName] | `IMember` |
| `appearances` | [contextMemberNumber, memberNumber] | none | `Appearance` (`appearance` is a WebP `Blob` for new data, or a legacy base64 PNG data URL string; + `AppearanceMetaData`) |
| `beepMessages` | autoIncrement `id` | `context_member_idx` = [contextMemberNumber, memberNumber] | `IBeepMessage` |

- **All data is scoped per logged-in player character.** The scope is called "context", `playerMemberNumber`, or `session.memberNumber` depending on the store. A chat "session" is `Player.CharacterID` (it changes on every login). Sessions plus room name identify one log.
- `StoreNames` type: `'appearances' | 'beepMessages' | 'chatRoomLogs' | 'members'`.
- Helpers in `models/database/`:
  - `startTransaction`, `executeRequest`, `executeInTransaction`, `upsertValue` (merge into existing), `putValue`
  - `retrieveMember`, `isMemberKnown`, `retrieveAppearance`, `retrieveAppearanceWithFallback` (falls back to legacy `member.appearance`)
  - `retrieveBeepMessages`, `retrieveSharedRooms` (`nextunique` cursor on `senderMemberNumber_idx`)
- Angular code mostly uses `DatabaseService` (`src/app/shared/database.service.ts`). It caches one connection and offers `transaction`, `read`, `write`, `cursor` (Observable), and `objectStoreNames`.
- Appearance images are stored as `Blob`s (WebP); older records may still hold PNG data URL strings until maintenance (§7a) converts them or the member is drawn again. Readers must handle both (`typeof appearance === 'string'`; `appearanceImageExtension()`; member-info uses `URL.createObjectURL`, which needs `blob:` in the CSP `img-src`).
- Deprecated fields are kept for old data:
  - `IMember.type` (deleted on write)
  - `IMember.appearance` / `appearanceMetaData` (moved to `appearances` in v6)
- **Schema change checklist:**
  1. Bump the version in `openDatabase`.
  2. Extend `upgradeDatabase` idempotently and add a changelog line.
  3. Update `StoreNames`.
  4. Update Export/Import services and options "Delete database" (it iterates all store names automatically).
  5. Consider maintenance (§7a).

### chrome.storage.local (`models/storage/`)
- **Global keys** (`IGlobalStorageMap`, via `retrieveGlobal`/`storeGlobal`):
  - `settings: ISettings`, which is `{notifications:{keywords:string[]}, tools:{chatRoomRefreshInterval:number /*seconds, 0=off*/}}`
  - `migration: {readChangelogVersion}`
  - `maintenance: {lastCompleted?, resume?: {store, after?}}` (§7a)
  - `retrieveGlobal` returns `{}` when a key is missing.
- **Always read settings through `retrieveSettings()`.** It calls `ensureSettings()` first, which deletes deprecated keys (`beeps`, `friendOnline`, `friendOffline`, `actions`, `mentions`, `whispers`, `chatRoomRefresh`, `fpsCounter`, `wardrobeSize`) and writes back defaults.
- **Per-tab keys** are stored as `` `${key}_${tabId}` `` (`IStorageMap`, via `retrieve`/`store`):
  - `player: IStoredPlayer`, `chatRoomCharacter: IChatRoomCharacter[]`, `onlineFriends: IMember[]`, `handshake: string`
  - `clearCharacterStorage` removes everything except `handshake`. `clearStorage` removes all of them.
  - `onChanged(tabId, cb)` filters `chrome.storage.onChanged` down to one tab's keys and strips the suffix. The popup uses it for live updates.
- A new key must be added to the map interface **and** to `GLOBAL_STORAGE_KEYS` / `CHARACTER_STORAGE_KEYS` / `ALL_STORAGE_KEYS` in `models/storage/IStorageMap.ts`.

## 6. Shared `models/` package

Barrel: `models/index.ts` re-exports `client-messages`, `database`, `game`, `internal`, `presentation`, `server-messages`, `storage`, `utils/json`, `web-extension`, `IVariablesUpdate`.

- `client-messages/`: `IClientMessage<T>` (`type:'client'`), `IClientAccountBeep`, `IChatRoomChat` / `IEnrichedChatRoomChat`.
- `server-messages/`: `IServerMessage<T>` (`type:'server'`, `inFocus`), `IAccountBeep`, `IAccountQueryResult*`, `IChatRoomMessage` / `IEnrichedChatRoomMessage` / `ChatRoomMessageType`, `IChatRoomSync*`, `ILoginResponse`.
- `game/`: hand-written game shapes (`IChatRoomCharacter`, `IAppearance`, `IOwnership`, `ILovership`, `IReputation`, `IPlayer`, `CurrentScreen`, `ChatRoomSpace`, …). Also `decompress()`, which LZ-string-decompresses UTF16 when the input starts with `╬` (game descriptions).
- **Game typings have two sources:**
  - `models/game/Typedef.d.ts` is pulled from upstream and referenced with a triple-slash from `models/presentation/functions.ts`, which the Angular build needs.
  - The `bc-stubs` npm package (v130) is referenced with `/// <reference path="../../../node_modules/bc-stubs/bc/...">` in content-script files. The `include` entry in `projects/content-script/tsconfig.json` matches nothing; see §4a.
  - `globals.d.ts` in background, content-script, and popup declares game globals (`ServerSocket`, `ChatRoomData`, `CurrentScreen`, `ServerSend`, `ChatSearchQuery`, …).
- `internal/`: `IStoredPlayer`, `IPlayerWithRelations`, `IAsset`.
- `presentation/functions.ts`:
  - **`renderContent(chatLog)`** turns Action/Activity/ServerMessage logs into readable text. It re-implements the game's dictionary substitution, adapted from `ChatRoomMessageDefaultMetadataExtractor` in the game's ChatRoom.js. It covers:
    - source/target characters
    - `DestinationCharacter` (name + `'s`)
    - pronouns `Pronoun{Possessive,Self,Subject,Object}{SheHer|HeHim|TheyThem|ItIt}` and `TargetPronoun…`, defaulting to SheHer
    - asset names, focus group descriptions (ItemVulva/ItemVulvaPiercings are shown as penis/glans when the target `HasPenis`), `Text`, and `TextToLookUp`
    - Substitutions are applied longest-tag first.
  - Character info comes from the `chatLog.characters` snapshot when present. Otherwise it falls back to the `members` store through `MemberCache`, which is keyed only by memberNumber.
  - Dictionaries are loaded lazily through `fetch(chrome.runtime.getURL('log-viewer/assets/<name>.csv'))` and parsed with papaparse into module-level caches. `loadAndCacheDictionariesForChatLog()` is exported, and the replay awaits it first. **The CSVs must exist in `dist/log-viewer/assets`.** This code runs in the background service worker too, for notifications.
  - Also: `findPronouns(code)`, `findTitle(code)`, `findAssetName`, `findInterfaceText`, `findActivity`.
- `storage/`: see §5.
- `utils/json.ts`: `parseJson`, which revives ISO date strings into `Date` (used by import).
- `web-extension/functions.ts`: `executeForAllGameTabs`, `isDevelopmentMode` (no `update_url` in the manifest), `log`.

## 7. Angular apps (Angular 19, standalone components)

Conventions:
- Standalone components with per-component `imports: [...]`. No NgModules.
- Constructor DI, `@Injectable({providedIn:'root'})` services.
- RxJS pipelines, Angular Material.
- Templates mix `*ngIf`/`*ngFor`/`ngSwitch` with the new `@if`/`@for`/`@let`.
- Component selector prefix `app-`.
- Untyped reactive forms are common.

### Log Viewer (`src/`)
- `src/main.ts` → `bootstrapApplication(AppComponent, appConfig)`. `app.config.ts`: `provideAnimationsAsync`, `provideZoneChangeDetection({eventCoalescing:true})`, `provideRouter(routes, withHashLocation())`. `index.html` uses `<base href="/log-viewer/index.html">`. All routing is hash-based (`/log-viewer/index.html#/...`).
- Routes (`src/app/app.routes.ts`):
  | Path | Component | What it shows |
  |---|---|---|
  | `''` | `PlayerCharactersComponent` | own characters found in `chatRoomLogs` |
  | `:memberNumber` | `ChatSessionsComponent` (OnPush) | MatTable of sessions (room + start) and MatTable of known people. The filter form matches name/nickname/normalized nickname, number, and last-seen range |
  | `:playerCharacter/member/:memberNumber` | `MemberInfoComponent` | profile (title, pronouns, difficulty, lover/owner, decompressed description), appearance image (cropped with CSS transforms from metadata), beep history (newest first, with a break marker when the gap is over 4 h), shared rooms, **notes** (autosaved after a 1 s debounce through `putValue('members')`) |
  | `:memberNumber/:sessionId/:chatRoom` | `ChatReplayComponent` | streams logs through `ChatLogsService.findChatReplay`, has a whisper toggle, renders each line with `ChatLineComponent` (Chat/Whisper/Emote as text; Action/Activity/ServerMessage through `renderContent`; label colours derived from the sender colour) |
  | `**` | `AppComponent` | |
- Shared services (`src/app/shared/`):
  - `ChatLogsService`: `findPlayerCharacters`, `findChatRoomsForMemberNumber`, `findChatReplay`.
  - `MemberService`: `findMembersWithName(player)` (cursor over the player's key range, only records with `memberName`) and `retrieveMember` (Observable that errors if not found).
  - `ExportService`: `fflate` `Zip` streamed into a `FileSystemFileHandle` from `showSaveFilePicker`. Zip layout:
    - `chatRoomLogs/<player>/<yyyymmdd-hhmm> - <room>.json` (grouped by session + room, `id` stripped)
    - `beepMessages/<player>/<member>.json`
    - `members/<player>/<member>/data.json`, plus `appearance.{webp,png}` / `appearance-meta-data.json` only when "include images" is ticked. Appearances are exported last in their own transaction, because reading Blobs is async and would auto-commit the shared transaction
  - `ImportService`: picks the file type from magic bytes (`PK\x03\x04` → zip, `{` → JSON).
    - Zip: streamed with `Unzip` + `AsyncUnzipInflate`. Logs and beeps are `add`ed, and members and appearances are `upsertValue`d. Appearance images are stored as `Blob`s with their original bytes (PNG or WebP).
    - Legacy JSON: `{members, chatRoomLogs}` is added directly.
  - Utils: `utils/base64.ts` (from JSZip), `utils/date.ts`, `utils/human-file-size.ts`.

### Popup (`projects/popup/`)
- `PopupComponent` is bootstrapped directly with async animations.
- On open, it queries the active tab and reads `player`, `onlineFriends`, `chatRoomCharacter` from per-tab storage. It subscribes with `onChanged`, updating inside `ngZone.run`, and injects `requestOnlineFriends`.
- Tabs:
  - **Characters**: name links to member-info; pronouns via `findPronouns`; owner + days; dominant/submissive reputation. Falls back to the Friends tab when empty.
  - **Online Friends**: sortable; room, size, space (`''`=Classic, `M`=Men's Lounge, `X`=Expanded).
- Buttons: Log Viewer (opens `#/<player>`) and Options.
- The "alternative characters" menu is disabled because it's too heavy on large DBs.
- `NewVersionNotificationComponent` snackbar appears when `migration.readChangelogVersion !== manifest.version`. Its text is the summary from `release-notes.json` (§3, Release), or a generic "updated to vX" message. Dismissing it with the action records the version.
- The popup is only set for tabs where the player is logged in (`setPopup` in the background). Otherwise clicking the action opens the log viewer.

### Options (`projects/options/`)
- `OptionsComponent`:
  - Settings form, autosaved through `storeGlobal('settings')` with a snackbar: notification keyword chips, and search refresh interval `[0,10,15,30,60,120,300,600]` s.
  - The UI warns that a **game reload is required**. The interval is only passed in at hook injection. It also `chrome.tabs.sendMessage`s the settings to game tabs, but nothing listens.
  - Data section: storage estimate (`navigator.storage.estimate`), Export (with an optional images checkbox), Import.
  - Maintenance section: "Scan & Fix Member Database" → `runFullMaintenance()` (§7a).
  - Danger zone: "Delete appearances" (clears the `appearances` store and strips legacy `member.appearance` fields) and "Delete database" (clears every object store).
- `options_ui.open_in_tab: true`.

### Fallback (`projects/fallback/`)
`dist/index.html` + `main.js` redirect legacy `?page=/log-viewer…` and `?page=/options` URLs to the real pages.

## 7a. Maintenance: IndexedDB corruption recovery

File: `models/database/maintenance-functions.ts` (exported through the `models` barrel).

**Why it exists.** Chrome IndexedDB records can become unreadable at random. Reading one makes the request or cursor fire `error`, typically Chrome's *"UnknownError: Failed to read large IndexedDB value"*, when the external blob that backs a large value is lost. The suspected trigger is large values, specifically the base64 PNG appearance data that used to be stored **inside `members` records**. The user-visible symptom: `MemberService.findMembersWithName`'s cursor dies partway, its error handler only logs, and its promise never resolves. The people list in ChatSessions then stays empty, which is the "people do not show up anymore" case named on the options page.

**History:**
- `dc9280e` (2024‑05‑22, "jank way of fixing member store corruption", originally inside MemberService)
- `5770c39` / `dec44c9` (2024‑07‑14): moved into `MaintenanceService`, given an options button, and set to run automatically when the log viewer opens
- DB v6 (`e11ce88`, 2025‑04): images moved into the separate `appearances` store
- Moved out of the log viewer into the background service worker, scanning in time-limited slices that resume where the previous one stopped. Extended to `appearances`, including conversion of legacy PNG data URLs to WebP blobs

Legacy `member.appearance` blobs are migrated away lazily by the background's `handleCommonDrawAppearanceBuild`. Options "Delete appearances" also strips them.

**Triggers:**
- Background: a `chrome.alarms` alarm named `maintenance` (period 5 min) → `runScheduledMaintenance()`. The alarm is created at service-worker startup only if it doesn't exist yet, because re-creating it resets its schedule. Requires the `alarms` permission.
  - Each run scans for at most **10 s**. When paused, it stores the current store and last handled key in `maintenance.resume` and the next alarm continues from there.
  - After a pass reaches the end of the last store, `maintenance.lastCompleted` is set and a new pass starts only once an hour has passed.
- Options → "Scan & Fix Member Database" → `runFullMaintenance()`: a full pass from the start without a time limit, with a spinner. It resets the stored state.
- The log viewer and popup don't run it.

**Algorithm.** A pass runs the `TASKS` in order, each over one store: `members`, then `appearances` (both keyed `[context, memberNumber]`). `runTask(db, task, startAfter, deadline)`:
1. One cursor over the **whole** store in key order, so every context is covered, whether or not it has chat logs.
2. Each readonly transaction lives at most 250 ms (and handles at least one record), then a new one continues after the last key. Short transactions keep the store available for `writeMember`, appearance writes and the log viewer.
3. On a cursor `error`: `getAllKeys(lowerBound(lastKey, true), 1)` reads **keys only** to find the faulty record, which is then `delete`d in a readwrite transaction. The scan continues after the faulty key, even if the delete failed. If no key is found, the task ends.
4. A task may define `needsProcessing`/`process`/`isUnchanged`. The scan stops at a record that needs processing, because async work would auto-commit the cursor's transaction. `process` runs outside any transaction, then a readwrite transaction re-reads the record and only `put`s the result if `isUnchanged`. Failures are logged and the record is skipped.
   - `appearances`: string values (legacy PNG data URLs) are re-encoded with `createImageBitmap` + `OffscreenCanvas.convertToBlob({type: 'image/webp', quality: 0.9})`, the same quality as the game hook. If WebP encoding isn't supported, the PNG is stored as a `Blob`. It's only stored if the record still holds the same string, so a fresh image drawn meanwhile is never overwritten.

**Limitations:**
- Recovery **deletes the whole member record, including the user's notes**. The member is recreated on the next sighting through `writeMember`, but the notes are lost.
- A deleted appearance is recreated the next time the member is drawn.
- `chatRoomLogs` and `beepMessages` are not scanned.
- Legacy `member.appearance` fields inside `members` records are not moved or converted by maintenance.
- It gives no feedback apart from `console.log` diagnostics (background service worker console) and the options spinner stopping.
- **Guidance:** give any new cursor-based reader over large stores an error path that rejects or completes, so the UI never hangs. To cover another store, add a task to `TASKS` and to the `MaintainedStore` type. `resume.after` assumes `[number, number]` keys, so autoIncrement stores need a different type there.

## 8. Common task recipes

- **Add a game domain:** update all 3 places in §1. Rebuild so the manifests regenerate.
- **Capture a new server event:**
  1. Add a `createForwarder(...)` in `server-event-listeners.ts`, with a mapper that slims the data.
  2. Add a `case` + handler in `handleServerMessage` (`projects/background/src/main.ts`).
  3. Add types in `models/server-messages/`.
- **Capture a new outgoing (client) event:** add a mapper to `getEventMappers` (`user-input-listener.ts`) and a `case` in `handleClientMessage`.
- **Hook a new game function:** follow the checklist at the end of §4a.
- **Read game state from the background or popup:** inject a self-contained `func` with `chrome.scripting.executeScript({world:'MAIN'})`, then post the result back with a handshake or use the return value.
- **New setting:**
  1. Extend `ISettings` and add the default in `ensureSettings()`.
  2. Add a form control in `OptionsComponent` and map it in its `valueChanges` pipeline.
  3. If the hooks need it, pass it through `injectScripts` → `importAndHook` → `registerHooks`.
- **New IndexedDB store/index:** see the checklist in §5.
- **New log-viewer page:** create a standalone component and add a route in `src/app/app.routes.ts`. Links from other pages use `chrome.runtime.getURL('/log-viewer/index.html#/...')`.
- **Verify a change:** `yarn build` (or `yarn build-debug`) + `yarn lint`. Then reload the unpacked extension in `chrome://extensions` and **reload the game tab**. On install/update the content script is re-injected, but old page hooks remain because of `allowReplace`. The background service worker console logs every message it receives.

## 9. Gotchas and known quirks (observed, not fixed)

- `known-bugs.txt`: search auto-refresh can't be cancelled after an extension reload (the old timer keeps running in the page).
- `mapCharacter` / `mapAppearance` are **duplicated** in `server-event-listeners.ts` and `user-input-listener.ts`. Only the server copy maps `Difficulty` to `Difficulty.Level` (a number). `IMember.difficulty` relies on that through a cast marked `FIXME`.
- Options sends settings with `chrome.tabs.sendMessage` to game tabs, but the content script has no `onMessage` listener, so it does nothing. That's why the "reload the game" warning exists.
- `notifications.ts` uses `iconUrl: 'assets/bclub-logo.png'`, but the logo ships at `log-viewer/assets/bclub-logo.png`.
- bc-stubs is only partly loaded: the content-script tsconfig `include` glob matches nothing, so `ServerInit` and hook-name typos are silently untyped (`never`). See §4a.
- `ChatRoomSyncSingle` / `MemberLeave` handlers use `findIndex` without checking for `-1`.
- Unused code: `addArchiveLinkMessageToChat` (`projects/content-script/src/add-message-to-chat.ts`), `isDevelopmentMode` / `log`, `isMemberKnown`, and the `e2e/` folder.
- `presentation` `MemberCache` is keyed by memberNumber only, not by context player.
- `strict` mode is off. Background and content-script are not linted. There are only a few unit tests, and CI doesn't run them.
- `openDatabase()` is called for **every** `startTransaction` in `models/database` helpers (no connection reuse outside `DatabaseService`).
- Firefox: the manifest is generated (MV2, persistent background, CSP hash, gecko id `{69662ce5-5fcc-4d0a-ad93-b8b663bd47ac}`, self-hosted `release/firefox-updates.json`), but the extension doesn't work there.
- Gitignored: `dist/`, `.angular/cache`, `projects/manifest/private-*-additions.json`, `*.zip`.
