# 折叠一切 (Fold anything)

[![ci](https://github.com/steavenawa/dsh-fold-anything/actions/workflows/ci.yml/badge.svg)](https://github.com/steavenawa/dsh-fold-anything/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/dsh-fold-anything.svg)](https://www.npmjs.com/package/dsh-fold-anything)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

One installable DSH bundle that ships three plugins:

| Plugin | Fold target | Controls live in |
|---|---|---|
| **折叠 · 侧边栏入口** (`dsh-fold-anything`) | Left-sidebar navigation entries (`sidebar.panellist`) | The sidebar 更多 menu |
| **折叠 · 会话视图** (`dsh-fold-anything/views`) | Conversation View tabs (`conversation.view`) | The tab row's 「…」 menu |
| **折叠 · 设置导航** (`dsh-fold-anything/settings`) | Settings sections (`settings.section`) | The **更多设置** settings page |

The first two use the shell's own fold state — a launcher or View that is
unpinned leaves its row and stays reachable from the menu. The settings plugin
contributes a settings page and folds chosen sections out of the navigation into
that page. All three add the missing controls, persistence, and icons.

## Install (DSH plugin)

This package is a DSH profile bundle, published to npm.

- **From npm**: install the bundle spec `dsh-fold-anything` (or a pinned
  version such as `dsh-fold-anything@0.1.3`) with the DSH plugin manager.
- **From GitHub**: install the repository spec
  `github:steavenawa/dsh-fold-anything`, or clone this repository and install
  the cloned folder (its absolute path) with the DSH plugin manager.
- The bundle inserts three Loader rows — `fold-sidebar` (package root
  `dsh-fold-anything`), `fold-views` and `fold-settings` (subpath plugins
  `dsh-fold-anything/views` and `dsh-fold-anything/settings`) — and each then
  appears in the Plugins settings list.
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

### Settings sections

1. Open **Settings** and select **更多设置 / More settings**, the last entry in
   the settings navigation (an extra page this bundle contributes).
2. Press **设置**. Every other settings section appears with a switch: turn it
   **off** to fold that section out of the navigation into this page, **on** to
   put it back. **全部显示** restores everything.
3. Leave settings mode. The folded sections are gone from the navigation and
   listed on this page — click one to open it directly.

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
- **Settings fold.** The settings shell renders its navigation itself and offers
  no fold/group seat, so this plugin contributes one ordinary settings page and
  hides the chosen nav cells at the DOM level:
  - A folded cell keeps its DOM (only `display:none`), so the page can still
    select that section through a programmatic click on the cell — no private
    shell state is touched.
  - Cells are matched by their visible nav label (the text the shell renders),
    which is resolved from the live `settings.section` ledger, so a locale change
    follows automatically. Two `MutationObserver`s (the body for panel
    mount/unmount, the panel for re-renders) re-apply the marker, because a React
    re-render recreates the cells.
  - If the shipped panel markup changes, the marker simply never applies: the
    navigation stays untouched, and the page remains a normal settings page whose
    rows are inert. No error escapes.
  - Choices are stored in `localStorage` under `dsh.fold-anything.settings.v1`.
  - Folding is a navigation filter only: a folded page is still mounted when
    selected and its settings are unchanged.

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
- **Settings categories (grouping) are not implemented.** The settings shell
  renders a flat navigation with no group-header seat, so grouping would need
  injected section headers (a much more fragile DOM layer). Folding sections into
  the **更多设置** page is the supported-by-this-plugin alternative today.
- **A folded active section loses the initial focus target.** The shell marks the
  selected nav cell as its modal's autofocus target; when that section is folded
  (hidden), the initial focus silently stays on the Settings opener. Tab still
  reaches the panel through the modal's focus trap and Escape still closes it.
- **Settings rows fall back to this bundle's glyph.** Shipped sections do not
  register `settings.section.icon`, so a folded section shows this bundle's gear
  glyph unless its own plugin registers a nav icon.
- **Cross-tab changes are not live.** Folding is stored per browser; another tab
  picks the change up on its next Settings open, not instantly (no `storage`
  listener).
- **The three plugin rows share one browser module.** A DSH package owns at most
  one browser module, and only a Loader row addressed by the exact package name
  publishes it: here that is the root row (`折叠 · 侧边栏入口`, package
  `dsh-fold-anything`). The `折叠 · 会话视图` and `折叠 · 设置导航` rows
  (`dsh-fold-anything/views`, `dsh-fold-anything/settings`) are separate Loader
  entries with their own titles and icons, but they contribute no browser code of
  their own. Consequences: disabling the root row stops **all** controls even
  while the other rows stay enabled, and disabling another row only hides its
  plugin-list entry. Truly independent enable/disable would need one package per
  plugin, each declaring its own `dsh.client`.

## Implementation

- `cordis.patch.yml` inserts three rows: the package root (`dsh-fold-anything`,
  the sidebar plugin), plus the `./views` and `./settings` subpath plugins. The
  root row guarantees the package's browser bundle is published; the subpath rows
  give the other two plugins their own title, description, and icon.
- `index.js`, `views/index.js`, and `settings/index.js` are empty Host `apply`s:
  the whole capability is browser-side.
- `client.js` registers into `sidebar.panellist.actions`,
  `conversation.session.header.views.actions`, `settings.section`, and
  `settings.section.icon`; React is the only module required, and colors use
  `--dsw-alias-*` theme tokens.
- Two features touch the shipped DOM, both best effort and both unable to break
  it: the **startup replay** clicks the two shipped More launchers (to mount the
  menus that expose the pin callback) and hides them with a temporary root
  attribute; the **settings fold** marks shipped settings nav cells with an
  attribute (`display:none` only) and clicks one back when a folded section is
  opened from its page. Neither edits shipped markup, styles, or private state.
- `locale/*.json`, `views/locale/*.json`, and `settings/locale/*.json` supply
  each plugin's manager title and description; `icon.svg`, `views/icon.svg`, and
  `settings/icon.svg` are original artwork.

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

