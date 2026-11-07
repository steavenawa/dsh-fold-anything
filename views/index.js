/**
 * 折叠会话视图 (Fold · conversation views) — Host half of the
 * `dsh-fold-anything/views` subpath plugin, mounted as the `fold-views` row.
 *
 * The browser half is the package's shared Client bundle (one package owns one
 * browser module), which registers the view-tab fold controls into
 * `conversation.session.header.views.actions`. This row gives the views plugin
 * its own Loader entry and its own display metadata under
 * `./views/locale/*.json` and `./views/icon`.
 */
export function apply() {}
