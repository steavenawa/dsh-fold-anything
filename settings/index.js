/**
 * 折叠设置导航 (Fold · settings sections) — Host half of the
 * `dsh-fold-anything/settings` subpath plugin, mounted as the `fold-settings`
 * row.
 *
 * The browser half is the package's shared Client bundle: it contributes the
 * "More settings" page and folds the chosen settings sections into it. This row
 * gives the settings plugin its own Loader entry and its own display metadata
 * under `./settings/locale/*.json` and `./settings/icon`.
 */
export function apply() {}
