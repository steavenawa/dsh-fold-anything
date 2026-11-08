# 折叠一切 (Fold anything)

[![ci](https://github.com/steavenawa/dsh-fold-anything/actions/workflows/ci.yml/badge.svg)](https://github.com/steavenawa/dsh-fold-anything/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/dsh-fold-anything.svg)](https://www.npmjs.com/package/dsh-fold-anything)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

One installable DSH bundle that ships two plugins:

| Plugin | Fold target | Controls live in |
|---|---|---|
| **折叠 · 侧边栏入口** (`dsh-fold-anything`) | Left-sidebar navigation entries (`sidebar.panellist`) | The sidebar 更多 menu |
| **折叠 · 会话视图** (`dsh-fold-anything/views`) | Conversation View tabs (`conversation.view`) | The tab row's 「…」 menu |

Both plugins use the shell's own fold state — a launcher or View that is
unpinned leaves its row and stays reachable from the menu — and add the missing
controls, persistence, and panel icons.

## Install (DSH plugin)

This package is a DSH profile bundle, published to npm.

- **From npm**: install the bundle spec `dsh-fold-anything` (or a pinned
  version such as `dsh-fold-anything@0.1.0`) with the DSH plugin manager.
- **From GitHub**: install the repository spec
  `github:steavenawa/dsh-fold-anything`, or clone this repository and install
  the cloned folder (its absolute path) with the DSH plugin manager.
- The bundle inserts two Loader rows — `fold-sidebar` (package root
  `dsh-fold-anything`) and `fold-views` (subpath plugin
  `dsh-fold-anything/views`) — and both plugins then appear in the Plugins
  settings list.
- A newly added bundle may need a DSH restart before its Loader rows activate;
  the browser bundle loads with the page.

## Use it

### Sidebar entries

1. Open **更多** at the bottom of the left sidebar. The menu ends with
   **侧边栏入口**; folded entries are listed there, each with its own icon, and a
   **设置** button sits at the right of the section header.
2. Press **设置**. Every customizable entry appears with a switch: turn it
   **off** to fold that entry into More, **on** to put it back. **全部显示**
   restores everything.
3. Press **完成**. The layout is fixed again: switches disappear and the
   section lists only the folded entries.

### Conversation views

1. In a Session, open the **「…」** menu after the View tabs (对话 / 轨迹 / …).
   The menu ends with **会话视图** and its **设置** button.
2. Press **设置** and switch a view off to fold its tab into that menu, or on to
   pin the tab back. A pinned View is "manually pinned": the tab row may still
   fold it into More when the window is too narrow for every tab. Views already
   folded by that width budget keep their own menu rows — this plugin never
   lists them a second time.
3. Press **完成** to leave settings mode.

A launcher or View is shown in exactly one place in display mode: in the
sidebar / tab row, or inside its More menu — never both. Settings mode is an
explicit, per-open control panel, so both menus always open in the fixed
display mode.

The chat view (对话) can never be folded: the shell always keeps it outside
More.

## Behavior

- Folding hides only the launcher or tab. The panel / View, its registration,
  and the current selection are untouched — the same rule the shell applies to
  an unpinned item.
- Choices are stored in `localStorage`:
  `dsh.fold-anything.sidebar.v1` and `dsh.fold-anything.views.v1`. The sidebar
  key is migrated once from the earlier sidebar-only plugin
  (`dsh.sidebar-fold.folded.v1`).
- The shell keeps its pin sets in page memory only, so after a reload every row
  starts visible. The plugin replays the saved choice through the shell's own
  `onPinnedChange` callback: at startup (best effort, see below) and again on
  the first manual menu open.
- **Startup replay.** Right after a page load (about 0.9 s later) the plugin
  finds the More launchers, mounts each menu invisibly for a moment, and closes
  it again — mounting is the only way the shell exposes its pin callback. The
  menu is hidden by a temporary `html[data-fold-anything-sync]` rule until the
  trigger reports itself closed, so the sync should not be visible.
  - The menu triggers carry no stable class or data attribute, so the plugin
    resolves them through a fallback chain that survives shipped markup drift:
    - **sidebar More**: (1) the sidebar's only `<nav>`; (2) the column that owns
      `[data-sidebar-toggle]`; (3) the localized `panels.more` label from the
      shipped `sidebar` dictionary; (4) the literal labels 更多 / More.
    - **view tabs More**: (1) the localized `session.moreViews` label from the
      shipped `conversation` dictionary; (2) the literal labels 更多会话视图 /
      More conversation views; (3) the sibling of `[data-conversation-tabs]`;
      (4) the sibling of `[role=tablist]`.
    - Every layer only accepts a visible `<button aria-haspopup="menu">` whose
      `aria-expanded` is `false`, so the worst possible drift is toggling another
      menu popup — never a destructive control.
  - A menu is hidden for about two frames plus 60 ms; closing retries twice when
    the trigger still reports itself open, and the whole attempt is capped at
    0.9 s. Trigger lookup retries for up to 8 s (the View tab row only exists
    once a Session is open).
  - Any failure — anchor moved, label changed, page not ready, exception — is
    swallowed. The plugin then simply falls back to the original behaviour:
    replay on the first manual menu open. It can never break the menus.
  - One side effect: each replay clicks the shipped trigger, which records one
    `sidebar_menu_click` product-analytics event per page load with saved folds.
  - Opt out with `localStorage.setItem('dsh.fold-anything.no-boot-replay.v1', '1')`.
- Panel icons are reused from the icons their own plugins register into
  `sidebar.panellist`; each is rendered behind an error boundary, so a hostile
  icon degrades to a neutral placeholder instead of breaking the menu.

## Limits

- **Not every panel is listable.** The shell never lists the **Plugins** panel
  in the sidebar More entries, so 插件 cannot be folded.
- **Workspaces are not covered.** The workspace/session browser is one opaque
  shell region (`sidebar.workspaces`) that exposes only Session row action and
  menu seats — no row-level pin/fold seat, and no 更多 host for workspace rows.
  Adding one would require replacing the shipped browser.
- **The startup replay is best effort**, not a shell contract: it depends on the
  shipped menu triggers' accessible names and structural anchors. If a DSH
  release changes them, the plugin silently falls back to replaying on the first
  manual menu open. A shell-exposed pin service would remove this dependency.
- Stale ids (a folded panel whose plugin was removed) stay in `localStorage`
  until **全部显示** clears them; they are harmless.
- **The two plugin rows share one browser module.** A DSH package owns at most
  one browser module, and only a Loader row addressed by the exact package name
  publishes it: here that is the root row (`折叠 · 侧边栏入口`, package
  `dsh-fold-anything`). The `折叠 · 会话视图` row (`dsh-fold-anything/views`) is a
  separate Loader entry with its own title and icon, but it contributes no
  browser code of its own. Consequences: disabling the root row stops **both**
  controls even while the views row stays enabled, and disabling the views row
  only hides its plugin-list entry. Truly independent enable/disable would need
  two packages, each declaring its own `dsh.client`.

## Implementation

- `cordis.patch.yml` inserts two rows: the package root (`dsh-fold-anything`,
  the sidebar plugin) and the `./views` subpath plugin. The root row guarantees
  the package's browser bundle is published.
- `index.js` and `views/index.js` are empty Host `apply`s: the whole capability
  is browser-side.
- `client.js` registers into `sidebar.panellist.actions` and
  `conversation.session.header.views.actions` only, and React is the only module
  required; colors use `--dsw-alias-*` theme tokens. The optional startup replay
  is the one exception to "no shipped DOM": it looks up the two shipped More
  launchers, clicks them to mount their menus for a moment, and sets a temporary
  root attribute that hides the menus while it runs. It never edits their
  markup, their styles, or their state beyond that toggle.
- `locale/*.json` and `views/locale/*.json` supply each plugin's manager title
  and description; `icon.svg` and `views/icon.svg` are original artwork.

## Development

Both halves are plain JavaScript with no build step, so the only tooling is
Node.js and ESLint.

```sh
npm install
npm run lint
```

`.github/workflows/ci.yml` runs the same lint on every push and pull request.

## License

[MIT](LICENSE) © 2026 Steven Jiang

