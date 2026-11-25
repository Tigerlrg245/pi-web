# Integration Hooks

Two hooks for code that runs alongside Pi Web: a browser event for apps that embed it (an Electron wrapper, for example) and a server-side registry for pi extensions. Neither is needed to use Pi Web.

## Beast fork: single-chat Telegram assignment

With `STORM_TELEGRAM_SESSION_POINTER` set on the server and the
`@llblab/pi-telegram` package installed, right-click a saved chat and choose
**Assign as Telegram chat**. Pi Web opens that chat and runs the connector's
native connect command. Confirm the native takeover prompt if the bot is
already connected elsewhere. There is no separate disconnect step, and
this action does not move chat history or queued work.

In single-chat (classic) mode, the sidebar paper plane follows the live
session status on the next sidebar poll. The pointer is an atomic restart
hint for Beast's startup script, not proof of a connection. A takeover can
briefly leave both old and new status lines visible internally; the sidebar
shows no badge until there is a unique live report. This integration does
not manage Telegram Threaded Mode or other Pi Web processes.

## Downstream Session Context Menu

Electron wrappers and other downstream integrations can provide a session-row
context menu without patching `SessionSidebar`. Listen for the cancelable
`pi-web:session-row-contextmenu` browser event and call `preventDefault()`
synchronously when the integration will handle it:

```js
window.addEventListener("pi-web:session-row-contextmenu", (event) => {
  event.preventDefault();
  const { id, path, cwd, name, clientX, clientY, refresh } = event.detail;

  void openSessionMenu({ id, path, cwd, name, clientX, clientY }).then((changed) => {
    if (changed) refresh();
  });
});
```

The detail object contains `id`, `path`, `cwd`, optional `name`, pointer
coordinates, and a `refresh()` callback for actions that change the session
list. If no listener cancels the extension event, Pi Web opens its built-in
session menu (pin, rename, fork, mark read or unread, archive, open in new
tab, delete) at the pointer instead of the browser's native context menu.
The row's `⋯` button always opens the built-in menu and does not dispatch the
event. Sessions not yet saved to disk get no built-in menu, so the native one
still appears for them. This hook is browser-side and independent of Pi agent
extensions.

## Extension Session Liveness

Server-side Pi extensions with detached work can prevent automatic idle
session eviction through the versioned global registry:

```js
const liveness = globalThis[Symbol.for("@agegr/pi-web/session-liveness/v1")];
const release = liveness?.version === 1
  ? liveness.register({
      name: "my-extension",
      sessionId,
      sessionFile: sessionFile || undefined,
      isActive: () => detachedJobs.size > 0,
    })
  : () => {};
```

Register once per active extension session and call the returned idempotent
`release` function on session shutdown, replacement, or reload. `isActive`
must be synchronous, cheap, and scoped to the supplied exact session id or
file. Provider errors fail safe by preserving that session. This lease only
affects automatic idle eviction; explicit shutdown and Stop fallback cleanup
still take precedence.
