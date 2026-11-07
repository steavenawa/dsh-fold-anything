/**
 * 折叠侧边栏入口 (Fold · sidebar entries) — Host half of the
 * `dsh-fold-anything` package root, mounted as the `fold-sidebar` row.
 *
 * The capability lives in the browser: the shared Client bundle registers the
 * fold controls into the sidebar More menu (`sidebar.panellist.actions`). This
 * row exists so the package is an active Loader entry and its `dsh.client`
 * declaration reaches the browser roster; it owns no Host state.
 */
export function apply() {}
