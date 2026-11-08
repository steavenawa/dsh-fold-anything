// 折叠一切 (Fold anything) — the shared Client bundle of the `dsh-fold-anything`
// package.
//
// One package owns one browser module, so both fold plugins are served by this
// one file:
//
// 1. `fold-sidebar` — the left sidebar's navigation rows (`sidebar.panellist`).
//    The shell already supports folding a launcher: an unpinned panel keeps its
//    panel and registration but loses its sidebar row, staying reachable from
//    the 更多 (More) menu. This bundle adds the missing controls to that menu
//    (`sidebar.panellist.actions`): a 设置 header control, switches in settings
//    mode, and in display mode the folded launchers themselves — with their own
//    panel icon on the left.
//
// 2. `fold-views` — the conversation View tabs. Same shell rule: an unpinned
//    View leaves the tab row and is listed by the tab row's More menu. This
//    bundle registers the same style of controls into
//    `conversation.session.header.views.actions`.
//
// A launcher or View is listed in exactly one place: in the sidebar/tab row, or
// inside More — never both. Settings mode is an explicit, per-open panel; the
// menus always open in the fixed display mode.
//
// Plain JS, no build step and no JSX: the ModuleLoader factory receives
// `require`, and React is a platform seed. No Harness Client package is
// imported. Panel icons are reused from their own `sidebar.panellist`
// registrations through the same slot API the shipped sidebar uses, each
// rendered behind an error boundary so one hostile icon cannot break the menu.

window.__ModuleLoader__.load({
  id: 'dsh-fold-anything',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    /** Client Cordis services this bundle waits for. */
    const inject = ['slots', 'locale']

    /** Locale namespace shared by both plugins. */
    const NS = 'fold-anything'

    /** Slot carrying the sidebar's panel launchers (icon components). */
    const PANEL_SLOT = 'sidebar.panellist'

    /** More-menu rows of the left sidebar. */
    const PANEL_ACTIONS_SLOT = 'sidebar.panellist.actions'

    /** Registered conversation Views (tab roster). */
    const VIEW_SLOT = 'conversation.view'

    /** More-menu rows of the conversation tab row. */
    const VIEW_ACTIONS_SLOT = 'conversation.session.header.views.actions'

    /** Registration ids of this bundle's two menu rows. */
    const PANEL_ENTRY_ID = 'fold-anything-sidebar'
    const VIEW_ENTRY_ID = 'fold-anything-views'

    /** Persisted fold sets: ids whose launcher/list row is folded into More. */
    const PANEL_STORAGE_KEY = 'dsh.fold-anything.sidebar.v1'
    const VIEW_STORAGE_KEY = 'dsh.fold-anything.views.v1'

    /** Fold set written by the previous sidebar-only version of this plugin. */
    const LEGACY_PANEL_STORAGE_KEY = 'dsh.sidebar-fold.folded.v1'

    /** No `<style>` tag id is used twice, however often the plugin reloads. */
    const STYLE_TAG_ID = 'dsh-fold-anything/controls.css'

    /** The shipped package that lists folded Views in the tab row's menu. */
    const SHIPPED_VIEW_MENU_ID = 'entry-customization'

    /** The shipped tab row always keeps Chat outside More. */
    const ALWAYS_VISIBLE_VIEWS = ['chat']

    /**
     * Startup replay (best effort): after a page load the shell's pin sets are
     * empty, so the controls' saved fold state has to be replayed before the
     * user opens a menu. This marker attribute hides the menu that the replay
     * opens for a couple of frames, so the sync stays invisible.
     */
    const SYNC_ATTRIBUTE = 'data-fold-anything-sync'

    /** localStorage opt-out: set it to "1" to keep the startup replay off. */
    const BOOT_REPLAY_DISABLE_KEY = 'dsh.fold-anything.no-boot-replay.v1'

    /** Timing knobs for the startup replay: first try, retry, give up. */
    const BOOT_REPLAY_DELAY_MS = 900
    const BOOT_REPLAY_POLL_MS = 400
    const BOOT_REPLAY_WINDOW_MS = 8000

    /**
     * Settings navigation fold: this plugin contributes one extra settings page
     * ("More settings") and folds chosen shipped sections into it. The settings
     * shell renders its navigation as `nav > button` cells inside a panel that
     * carries `data-shortcut-modal="settings"`; a hidden cell keeps its DOM (so a
     * programmatic click can still select that page) and is hidden by the
     * attribute below.
     */
    const SETTINGS_SECTION_ID = 'fold-anything'
    const SETTINGS_STORAGE_KEY = 'dsh.fold-anything.settings.v1'
    const SETTINGS_NAV_ATTRIBUTE = 'data-fold-anything-nav-folded'
    const SETTINGS_PANEL_SELECTOR = '[data-shortcut-modal="settings"]'

    /** Copy for both plugins; English is the fallback dictionary. */
    const en = {
      'sidebar.title': 'Sidebar entries',
      'sidebar.hint': 'Turn an entry off to fold it into More; turn it on to put it back.',
      'sidebar.empty': 'Nothing is folded.',
      'views.title': 'Conversation views',
      'views.hint': 'Turn a view off to fold its tab into the More menu; turn it on to put it back.',
      'views.empty': 'Nothing is folded.',
      'settings.title': 'More settings',
      'settings.hint': 'Turn a section off to fold it into this page; turn it on to put it back in the navigation.',
      'settings.empty': 'No settings section is folded.',
      settings: 'Settings',
      done: 'Done',
      showAll: 'Show all',
    }

    /** Chinese counterpart, shown under the default zh locale. */
    const zh = {
      'sidebar.title': '侧边栏入口',
      'sidebar.hint': '关闭开关即把该入口折叠进「更多」菜单；打开即放回侧边栏。',
      'sidebar.empty': '没有折叠的入口。',
      'views.title': '会话视图',
      'views.hint': '关闭开关即把该视图标签折叠进「更多」菜单；打开即放回标签栏。',
      'views.empty': '没有折叠的视图。',
      'settings.title': '更多设置',
      'settings.hint': '关闭开关即把该设置项收进这里；打开即放回设置导航。',
      'settings.empty': '没有收起的设置项。',
      settings: '设置',
      done: '完成',
      showAll: '全部显示',
    }

    /**
     * Styles for both menus. Every color is a DSH theme token, so the controls
     * follow light and dark themes without a second stylesheet.
     */
    const CSS = [
      '.dsh-fa-root{display:flex;flex-direction:column;margin-top:4px;padding-top:4px;border-top:1px solid var(--dsw-alias-border-l1);max-height:45vh;}',
      '.dsh-fa-head{display:flex;align-items:center;justify-content:space-between;gap:8px;flex:none;padding:2px 8px 2px 10px;color:var(--dsw-alias-label-secondary);font-size:11px;font-weight:600;letter-spacing:.02em;}',
      '.dsh-fa-gear{display:inline-flex;align-items:center;gap:4px;flex:none;padding:3px 7px;border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:11px;font-weight:500;letter-spacing:0;cursor:pointer;}',
      '.dsh-fa-gear:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);}',
      '.dsh-fa-body{display:flex;flex-direction:column;gap:1px;min-height:0;overflow-y:auto;overscroll-behavior:contain;}',
      '.dsh-fa-hint{padding:0 10px 6px;color:var(--dsw-alias-label-secondary);font-size:11px;line-height:1.35;}',
      '.dsh-fa-empty{padding:1px 10px 7px;color:var(--dsw-alias-label-secondary);font-size:11px;}',
      '.dsh-fa-row{display:flex;align-items:center;gap:8px;width:100%;padding:7px 10px;border:0;border-radius:8px;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;line-height:1.3;text-align:left;cursor:pointer;}',
      '.dsh-fa-row:hover{background:var(--dsw-alias-bg-layer-2);}',
      '.dsh-fa-row:focus-visible,.dsh-fa-gear:focus-visible,.dsh-fa-reset:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px;}',
      '.dsh-fa-icon{display:inline-flex;flex:none;align-items:center;justify-content:center;width:16px;height:16px;color:var(--dsw-alias-label-secondary);}',
      '.dsh-fa-icon-fallback{display:inline-block;width:16px;height:16px;}',
      '.dsh-fa-icon-fallback::after{content:"";display:block;width:8px;height:8px;margin:4px;border-radius:2px;background:var(--dsw-alias-border-l2);}',
      '.dsh-fa-label{min-width:0;flex:1 1 auto;overflow-wrap:anywhere;}',
      '.dsh-fa-switch{position:relative;flex:none;width:30px;height:18px;border-radius:999px;background:var(--dsw-alias-border-l2);transition:background .15s ease;}',
      '.dsh-fa-switch[data-on="true"]{background:var(--dsw-alias-brand-primary);}',
      '.dsh-fa-knob{position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:var(--dsw-alias-bg-base);transition:transform .15s ease;}',
      '.dsh-fa-switch[data-on="true"] .dsh-fa-knob{transform:translateX(12px);}',
      '.dsh-fa-foot{display:flex;justify-content:flex-end;gap:4px;padding:2px 6px 4px;}',
      '.dsh-fa-reset{padding:4px 8px;border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-brand-primary);font:inherit;font-size:12px;cursor:pointer;}',
      '.dsh-fa-reset:hover{background:var(--dsw-alias-bg-layer-2);}',
      'html[data-fold-anything-sync] [role="menu"]{visibility:hidden!important;pointer-events:none!important;}',
      '[data-fold-anything-nav-folded]{display:none!important;}',
      '.dsh-fa-settings{display:flex;flex-direction:column;gap:14px;padding:18px 16px 24px;max-width:620px;}',
      '.dsh-fa-settings-head{display:flex;align-items:center;justify-content:space-between;gap:12px;}',
      '.dsh-fa-settings-title{margin:0;color:var(--dsw-alias-label-primary);font-size:15px;font-weight:600;}',
      '.dsh-fa-settings-hint{margin:0;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:1.45;}',
      '.dsh-fa-settings-list{display:flex;flex-direction:column;gap:2px;padding:4px;border:1px solid var(--dsw-alias-border-l1);border-radius:10px;}',
      '.dsh-fa-settings-foot{display:flex;justify-content:flex-end;}',
      '@media (prefers-reduced-motion: reduce){.dsh-fa-switch,.dsh-fa-knob{transition:none;}}',
    ].join('')

    // --------------------------------------------------------------- storage

    /**
     * Read one persisted fold set. Storage can be unavailable (private mode,
     * quota, a disabled page store); then the plugin degrades to per-page state
     * instead of throwing.
     * @param {string} key - localStorage key.
     * @returns {Set<string>} ids currently folded into More.
     */
    function readList(key) {
      const out = new Set()
      try {
        const raw = window.localStorage.getItem(key)
        if (!raw) return out
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) return out
        for (const id of parsed) {
          if (typeof id === 'string' && id.length > 0) out.add(id)
        }
      } catch (err) {
        console.warn('[fold-anything] could not read a saved fold state', err)
      }
      return out
    }

    /**
     * Replace one persisted fold set.
     * @param {string} key - localStorage key.
     * @param {Set<string>} ids - ids to keep folded.
     */
    function writeList(key, ids) {
      try {
        window.localStorage.setItem(key, JSON.stringify(Array.from(ids)))
      } catch (err) {
        console.warn('[fold-anything] could not save a fold state', err)
      }
    }

    /**
     * Persist one item's fold choice.
     * @param {string} key - localStorage key.
     * @param {string} id - panel or view id.
     * @param {boolean} folded - whether the item is folded into More.
     */
    function writeOne(key, id, folded) {
      const current = readList(key)
      if (folded) current.add(id)
      else current.delete(id)
      writeList(key, current)
    }

    /**
     * Read the sidebar fold set, migrating the previous sidebar-only plugin's
     * key once so an existing choice is not lost on upgrade.
     * @param {'sidebar' | 'views'} region - which plugin's set to read.
     * @returns {Set<string>} folded ids.
     */
    function readFolded(region) {
      const key = region === 'views' ? VIEW_STORAGE_KEY : PANEL_STORAGE_KEY
      const current = readList(key)
      if (region !== 'sidebar' || current.size > 0) return current
      const legacy = readList(LEGACY_PANEL_STORAGE_KEY)
      if (legacy.size > 0) {
        writeList(key, legacy)
        writeList(LEGACY_PANEL_STORAGE_KEY, new Set())
      }
      return legacy
    }

    // ------------------------------------------------------------ slot stores

    /**
     * A small observable snapshot over one slot's registrations. Slot entries
     * are owned by other plugins; this store only projects their id, order,
     * label, and component, and re-reads them whenever the slot or the locale
     * changes (labels may be locale-aware thunks).
     * @param {string} slotName - declared slot key.
     * @returns {{bind: (ctx: object) => () => void, get: () => object[], subscribe: (fn: () => void) => () => void}}
     */
    function createSlotStore(slotName) {
      let ctx = null
      let items = []
      const listeners = new Set()

      const resolveLabel = (value, fallback) => {
        try {
          const text = typeof value === 'function' ? value() : value
          return typeof text === 'string' && text.length > 0 ? text : fallback
        } catch {
          return fallback
        }
      }

      function refresh() {
        if (ctx === null) return
        let next = []
        try {
          for (const stored of ctx.slots.entriesOfSlot(slotName)) {
            const options = stored.options || {}
            const id = typeof options.id === 'string' ? options.id : undefined
            if (id === undefined) continue
            next.push({
              id,
              order: typeof options.order === 'number' ? options.order : 0,
              label: resolveLabel(options.label, id),
              component: stored.component,
            })
          }
          next.sort((left, right) => left.order - right.order)
        } catch (err) {
          console.warn('[fold-anything] could not read the ' + slotName + ' registrations', err)
          next = []
        }
        items = next
        for (const listener of listeners) {
          try {
            listener()
          } catch (err) {
            console.error('[fold-anything] slot listener failed', err)
          }
        }
      }

      return {
        bind(context) {
          ctx = context
          refresh()
          const disposers = []
          try {
            disposers.push(ctx.slots.subscribe(slotName, refresh))
          } catch (err) {
            console.warn('[fold-anything] could not watch the ' + slotName + ' slot', err)
          }
          try {
            disposers.push(ctx.locale.subscribe(refresh))
          } catch (err) {
            console.warn('[fold-anything] could not watch the locale', err)
          }
          return () => {
            for (const dispose of disposers) {
              try {
                dispose()
              } catch (err) {
                console.warn('[fold-anything] store cleanup failed', err)
              }
            }
          }
        },
        get() {
          return items
        },
        subscribe(listener) {
          listeners.add(listener)
          return () => {
            listeners.delete(listener)
          }
        },
      }
    }

    /** Icon components registered by the sidebar's panel list. */
    const panelStore = createSlotStore(PANEL_SLOT)

    /** Tab-roster registrations of the conversation (id, order, label). */
    const viewStore = createSlotStore(VIEW_SLOT)

    /** Rows already registered into the tab row's More menu (shipped ones). */
    const viewActionStore = createSlotStore(VIEW_ACTIONS_SLOT)

    /**
     * Subscribe a component to one slot store.
     * @param {{get: Function, subscribe: Function}} store - slot store.
     * @returns {object[]} the current snapshot.
     */
    function useStore(store) {
      const [value, setValue] = React.useState(() => store.get())
      React.useEffect(() => store.subscribe(() => setValue(store.get())), [store])
      return value
    }

    // --------------------------------------------------------- startup replay

    /**
     * Whether an element is laid out enough to receive a click.
     * @param {Element | null | undefined} element - candidate.
     * @returns {boolean} true when the element has a box.
     */
    function isVisibleElement(element) {
      if (element === null || element === undefined) return false
      const rect = element.getBoundingClientRect()
      return rect.width > 0 && rect.height > 0
    }

    /**
     * Resolve one label of a shipped locale namespace. The menu triggers carry
     * no stable class or data attribute, but their accessible name comes from
     * these dictionaries, which gives the selector chain a locale-independent
     * anchor.
     * @param {object} ctx - Client context with the locale service.
     * @param {string} ns - shipped namespace, e.g. "sidebar".
     * @param {string} key - dictionary key.
     * @returns {string | undefined} the localized label, when resolvable.
     */
    function resolveShippedLabel(ctx, ns, key) {
      try {
        const bind = ctx.locale.bind(ns)
        const text = bind(key)
        if (typeof text !== 'string' || text.length === 0 || text === key) return undefined
        return text
      } catch {
        return undefined
      }
    }

    /**
     * A clickable, currently closed menu trigger. Requiring `aria-expanded` on
     * the element keeps the replay from ever clicking something that is not a
     * toggle-able menu button (and guarantees the close path can read the state
     * back).
     * @param {Element | null | undefined} button - candidate.
     * @returns {boolean} true when the element is safe to click as a menu toggle.
     */
    function isMenuTriggerCandidate(button) {
      if (button === null || button === undefined) return false
      if (button.getAttribute('aria-haspopup') !== 'menu') return false
      if (button.getAttribute('aria-expanded') !== 'false') return false
      return isVisibleElement(button)
    }

    /**
     * Find a visible button by its accessible name.
     * @param {string} label - aria-label to match.
     * @returns {HTMLButtonElement | null} the button.
     */
    function findMenuButtonByLabel(label) {
      const candidates = document.querySelectorAll('button[aria-label][aria-haspopup="menu"][aria-expanded]')
      for (const button of candidates) {
        if (button.getAttribute('aria-label') !== label) continue
        if (!isMenuTriggerCandidate(button)) continue
        return button
      }
      return null
    }

    /**
     * Find the sidebar's More launcher. Strategies are tried in order of
     * structural strength, because the shipped markup offers no stable class
     * or data attribute for it:
     * 1. the sidebar's only `<nav>` (the panel list) and its menu button;
     * 2. the column that owns the `[data-sidebar-toggle]` control;
     * 3. the localized "More" label from the shipped `sidebar` dictionary;
     * 4. literal Chinese/English labels as a last resort.
     * @param {object} ctx - Client context.
     * @returns {HTMLButtonElement | null} the trigger, or null.
     */
    function findSidebarMoreTrigger(ctx) {
      const inNav = document.querySelector('nav[aria-label] button[aria-haspopup="menu"][aria-expanded]')
      if (isMenuTriggerCandidate(inNav)) return inNav
      const toggle = document.querySelector('[data-sidebar-toggle]')
      const column = toggle !== null ? toggle.parentElement?.parentElement ?? null : null
      if (column !== null) {
        const inColumn = column.querySelector('button[aria-haspopup="menu"][aria-expanded]')
        if (isMenuTriggerCandidate(inColumn)) return inColumn
      }
      const labels = []
      const localized = resolveShippedLabel(ctx, 'sidebar', 'panels.more')
      if (localized !== undefined) labels.push(localized)
      labels.push('更多', 'More')
      for (const label of labels) {
        const button = findMenuButtonByLabel(label)
        if (button !== null) return button
      }
      return null
    }

    /**
     * Find the View tab row's More launcher with the same layered fallback.
     * @param {object} ctx - Client context.
     * @returns {HTMLButtonElement | null} the trigger, or null.
     */
    function findViewsMoreTrigger(ctx) {
      const labels = []
      const localized = resolveShippedLabel(ctx, 'conversation', 'session.moreViews')
      if (localized !== undefined) labels.push(localized)
      labels.push('更多会话视图', 'More conversation views')
      for (const label of labels) {
        const button = findMenuButtonByLabel(label)
        if (button !== null) return button
      }
      for (const selector of ['[data-conversation-tabs]', '[role="tablist"]']) {
        const tablist = document.querySelector(selector)
        const row = tablist !== null ? tablist.parentElement : null
        if (row === null) continue
        const button = row.querySelector('button[aria-haspopup="menu"][aria-expanded]')
        if (isMenuTriggerCandidate(button)) return button
      }
      return null
    }

    /**
     * Mount a More menu for a few frames, then close it: mounting is what runs
     * the controls' replay effect, which pushes the saved fold state into the
     * shell. {@link SYNC_ATTRIBUTE} keeps the menu invisible while that happens,
     * and the visibility is only lifted after the trigger reports itself closed
     * (with a bounded retry) so a lagging React commit cannot leave the menu
     * visible.
     * @param {HTMLButtonElement} trigger - the menu's launcher, a closed toggle.
     * @param {() => void} done - called once the menu is closed and cleaned up.
     * @returns {() => void} cancels pending frames/timers and cleans up.
     */
    function replayThroughMenu(trigger, done) {
      const doc = document
      const root = doc.documentElement
      const previousFocus = doc.activeElement
      const timers = []
      const frames = []
      let cancelled = false
      let finished = false
      let cleaned = false

      const later = (callback, ms) => {
        timers.push(window.setTimeout(() => {
          if (!cancelled) callback()
        }, ms))
      }
      const frame = (callback) => {
        frames.push(window.requestAnimationFrame(() => {
          if (!cancelled) callback()
        }))
      }
      const cleanup = () => {
        if (cleaned) return
        cleaned = true
        for (const id of timers) window.clearTimeout(id)
        for (const id of frames) window.cancelAnimationFrame(id)
        root.removeAttribute(SYNC_ATTRIBUTE)
        if (previousFocus !== null && previousFocus !== doc.body && typeof previousFocus.focus === 'function') {
          try {
            previousFocus.focus({ preventScroll: true })
          } catch (err) {
            console.warn('[fold-anything] could not restore focus after the replay', err)
          }
        }
        done()
      }
      const closeMenu = (attempt) => {
        try {
          if (trigger.getAttribute('aria-expanded') === 'true') trigger.click()
        } catch (err) {
          console.warn('[fold-anything] could not close the replay menu', err)
        }
        later(() => {
          if (trigger.getAttribute('aria-expanded') === 'true' && attempt < 2) {
            closeMenu(attempt + 1)
            return
          }
          cleanup()
        }, 90)
      }
      const finish = () => {
        if (finished) return
        finished = true
        closeMenu(0)
      }

      if (trigger.getAttribute('aria-expanded') !== 'false') {
        cleanup()
        return () => {}
      }
      root.setAttribute(SYNC_ATTRIBUTE, '')
      try {
        trigger.click()
      } catch (err) {
        console.warn('[fold-anything] could not open the replay menu', err)
        cleanup()
        return () => {}
      }
      frame(() => {
        frame(() => {
          later(finish, 60)
        })
      })
      later(finish, 900)
      return () => {
        cancelled = true
        cleanup()
      }
    }

    /**
     * Replay the persisted fold state right after startup instead of waiting for
     * the first manual menu open. This is best effort by construction: the shell
     * exposes its pin callback only through menu rows, so each menu is mounted
     * invisibly for a moment. Every failure (missing trigger, changed markup,
     * thrown error, page not ready) is swallowed — the plugin then falls back to
     * replaying on the first manual menu open, exactly like before.
     * @param {object} ctx - Client context.
     * @returns {() => void} disposer cancelling timers and any in-flight replay.
     */
    function startBootReplay(ctx) {
      try {
        let disabled
        try {
          disabled = window.localStorage.getItem(BOOT_REPLAY_DISABLE_KEY) === '1'
        } catch {
          disabled = false
        }
        if (disabled) return () => {}
        const startedAt = Date.now()
        const tasks = []
        if (readFolded('sidebar').size > 0) {
          tasks.push({ region: 'sidebar', done: false, deadline: startedAt + BOOT_REPLAY_WINDOW_MS })
        }
        if (readFolded('views').size > 0) {
          tasks.push({ region: 'views', done: false, deadline: startedAt + BOOT_REPLAY_WINDOW_MS })
        }
        if (tasks.length === 0) return () => {}

        let cancelled = false
        let timer = 0
        let busy = false
        let cancelActive = null
        const schedule = () => {
          if (cancelled) return
          if (timer !== 0) window.clearTimeout(timer)
          timer = window.setTimeout(poll, BOOT_REPLAY_POLL_MS)
        }
        const poll = () => {
          timer = 0
          if (cancelled || busy) return
          const current = Date.now()
          for (const task of tasks) {
            if (task.done) continue
            const trigger = task.region === 'views' ? findViewsMoreTrigger(ctx) : findSidebarMoreTrigger(ctx)
            if (trigger === null) {
              if (current >= task.deadline) task.done = true
              continue
            }
            task.done = true
            busy = true
            cancelActive = replayThroughMenu(trigger, () => {
              cancelActive = null
              busy = false
              if (tasks.some((item) => !item.done)) schedule()
            })
            return
          }
          if (tasks.some((task) => !task.done)) schedule()
        }
        timer = window.setTimeout(poll, BOOT_REPLAY_DELAY_MS)
        return () => {
          cancelled = true
          if (timer !== 0) window.clearTimeout(timer)
          const cancel = cancelActive
          cancelActive = null
          if (cancel !== null) cancel()
          document.documentElement.removeAttribute(SYNC_ATTRIBUTE)
        }
      } catch (err) {
        console.warn('[fold-anything] startup replay skipped', err)
        return () => {}
      }
    }

    // ------------------------------------------------------------- components

    /**
     * Renders one panel icon registered by another plugin, catching its render
     * errors so a hostile or context-dependent icon cannot break this menu.
     */
    class IconBoundary extends React.Component {
      constructor(props) {
        super(props)
        this.state = { failed: false }
      }

      static getDerivedStateFromError() {
        return { failed: true }
      }

      componentDidCatch(error) {
        console.warn('[fold-anything] a panel icon failed to render', error)
      }

      render() {
        if (this.state.failed) return this.props.fallback
        return this.props.children
      }
    }

    /**
     * One panel icon, reusing the component its own plugin registered into
     * `sidebar.panellist` with the documented owner props.
     * @param {{component: unknown}} props - the registered icon component.
     * @returns {import('react').ReactElement} the icon cell.
     */
    function PanelIcon(props) {
      const fallback = h('span', { className: 'dsh-fa-icon-fallback', 'aria-hidden': 'true' })
      const component = props.component
      // Any non-null element type is attempted (function, memo, forwardRef); an
      // invalid type throws inside the boundary and becomes the placeholder.
      if (component === undefined || component === null) {
        return h('span', { className: 'dsh-fa-icon', 'aria-hidden': 'true' }, fallback)
      }
      return h('span', { className: 'dsh-fa-icon', 'aria-hidden': 'true' },
        h(IconBoundary, { fallback },
          h(React.Suspense, { fallback }, h(component, { size: 16, active: false }))))
    }

    /**
     * One more-menu section for a fold plugin.
     *
     * Owner props (shared by both slots):
     * - `entries`: the items the shell currently lists outside the visible row
     *   (sidebar launchers / Views outside the tab row), with `id`, `label`,
     *   `pinned`, `active`.
     * - `onPinnedChange(id, pinned)`: show (`true`) or fold (`false`) one item.
     * - `onOpen(id)`: select the item without changing its pin state.
     * - `onDismiss()`: close the menu.
     * Injected: `region` (`sidebar` or `views`) and, through `locale: NS`, `t`.
     *
     * @param {object} props - owner, injected, and locale props.
     * @returns {import('react').ReactElement | null} the section.
     */
    function FoldMenuContent(props) {
      const region = props.region === 'views' ? 'views' : 'sidebar'
      const entries = Array.isArray(props.entries) ? props.entries : []
      const translate = typeof props.t === 'function' ? props.t : function (key) { return key }
      const storageKey = region === 'views' ? VIEW_STORAGE_KEY : PANEL_STORAGE_KEY

      const panelEntries = useStore(panelStore)
      const viewEntries = useStore(viewStore)
      const viewActions = useStore(viewActionStore)

      // Optimistic switch values, seeded from the saved fold state so the first
      // paint already reflects the user's choice instead of flashing. The
      // legacy-key migration runs in the mount effect below, never during render.
      const [overrides, setOverrides] = React.useState(() => {
        const initial = {}
        for (const id of readList(storageKey)) initial[id] = false
        return initial
      })

      // Settings mode is per menu open and in memory only: every menu opens in
      // the fixed display mode, and switches appear only after pressing 设置.
      const [settings, setSettings] = React.useState(false)

      // The mount-only restore effect needs the freshest owner props without
      // making them dependencies: a new entry array arrives on every sidebar
      // render, and re-running the effect would keep re-pinning items.
      const owner = React.useRef({ entries, onPinnedChange: props.onPinnedChange })
      owner.current = { entries, onPinnedChange: props.onPinnedChange }

      // Replay the saved fold state once per mount. The shell keeps its pin set
      // in page memory only, so after a reload everything starts visible again;
      // this is where the user's saved choice is applied.
      React.useEffect(() => {
        const change = owner.current.onPinnedChange
        if (typeof change !== 'function') return
        const saved = readFolded(region)
        if (saved.size === 0) return
        if (region === 'views') {
          for (const id of saved) {
            try {
              change(id, false)
            } catch (err) {
              console.error('[fold-anything] could not restore a folded view', id, err)
            }
          }
          return
        }
        for (const entry of owner.current.entries) {
          if (!entry || typeof entry.id !== 'string') continue
          const wanted = !saved.has(entry.id)
          if (entry.pinned === wanted) continue
          try {
            change(entry.id, wanted)
          } catch (err) {
            console.error('[fold-anything] could not restore a folded entry', entry.id, err)
          }
        }
      }, [])

      // ------------------------------------------------------------- modeling

      const labelOf = (entry) => {
        return typeof entry.label === 'string' && entry.label.length > 0
          ? entry.label
          : String(entry.id)
      }

      const ownEntries = new Map()
      for (const entry of entries) {
        if (entry === null || typeof entry !== 'object' || typeof entry.id !== 'string') continue
        ownEntries.set(entry.id, entry)
      }

      const items = []
      if (region === 'sidebar') {
        for (const entry of ownEntries.values()) {
          items.push({ id: entry.id, label: labelOf(entry), pinned: entry.pinned !== false })
        }
      } else {
        const seen = new Set()
        for (const view of viewEntries) {
          if (seen.has(view.id) || ALWAYS_VISIBLE_VIEWS.includes(view.id)) continue
          seen.add(view.id)
          const own = ownEntries.get(view.id)
          items.push({
            id: view.id,
            label: view.label || view.id,
            pinned: own === undefined ? true : own.pinned !== false,
          })
        }
        for (const entry of ownEntries.values()) {
          if (seen.has(entry.id) || ALWAYS_VISIBLE_VIEWS.includes(entry.id)) continue
          seen.add(entry.id)
          items.push({ id: entry.id, label: labelOf(entry), pinned: entry.pinned !== false })
        }
      }

      if (items.length === 0) return null

      const iconById = new Map()
      for (const panel of panelEntries) iconById.set(panel.id, panel.component)

      // Whether the shipped tab-row menu already lists folded Views. It does in
      // the official composition; only when that specific row is absent does
      // this section render the rows itself, so a View is never listed twice.
      let shippedViewRows = false
      for (const action of viewActions) {
        if (action.id === SHIPPED_VIEW_MENU_ID) {
          shippedViewRows = true
          break
        }
      }

      /** Whether one item is currently shown in the sidebar / tab row. */
      const isShown = (item) => {
        // `overrides` is caller-seeded, so use an own-key check: an id such as
        // "constructor" must not inherit a truthy prototype value.
        if (Object.prototype.hasOwnProperty.call(overrides, item.id)) {
          return overrides[item.id] === true
        }
        return item.pinned !== false
      }

      const applyPin = (id, shown) => {
        const change = owner.current.onPinnedChange
        if (typeof change !== 'function') return
        try {
          change(id, shown)
        } catch (err) {
          console.error('[fold-anything] the shell rejected a fold change', id, err)
        }
      }

      const setPinned = (item, shown) => {
        const next = {}
        for (const key of Object.keys(overrides)) next[key] = overrides[key]
        next[item.id] = shown
        setOverrides(next)
        applyPin(item.id, shown)
        writeOne(storageKey, item.id, !shown)
      }

      const showAll = () => {
        writeList(storageKey, new Set())
        const next = {}
        for (const item of items) {
          next[item.id] = true
          applyPin(item.id, true)
        }
        setOverrides(next)
      }

      // ---------------------------------------------------------------- render

      /** A display row: the item is hidden from its strip and opens from here. */
      const displayRow = (item, withIcon) => h('button', {
        key: 'open:' + item.id,
        type: 'button',
        role: 'menuitem',
        className: 'dsh-fa-row',
        title: item.label,
        onClick(event) {
          event.preventDefault()
          event.stopPropagation()
          if (typeof props.onDismiss === 'function') props.onDismiss()
          if (typeof props.onOpen === 'function') props.onOpen(item.id)
        },
      },
      withIcon ? h(PanelIcon, { key: 'icon', component: iconById.get(item.id) }) : null,
      h('span', { className: 'dsh-fa-label' }, item.label))

      /** A settings row: the item and its show/fold switch. */
      const settingsRow = (item) => {
        const shown = isShown(item)
        return h('button', {
          key: 'switch:' + item.id,
          type: 'button',
          role: 'menuitemcheckbox',
          'aria-checked': shown ? 'true' : 'false',
          className: 'dsh-fa-row',
          title: item.label,
          onClick(event) {
            event.preventDefault()
            event.stopPropagation()
            setPinned(item, !shown)
          },
        },
        region === 'sidebar' ? h(PanelIcon, { key: 'icon', component: iconById.get(item.id) }) : null,
        h('span', { className: 'dsh-fa-label' }, item.label),
        h('span', {
          key: 'switch',
          className: 'dsh-fa-switch',
          'data-on': shown ? 'true' : 'false',
          'aria-hidden': 'true',
        }, h('span', { className: 'dsh-fa-knob' })))
      }

      const foldedItems = items.filter((item) => item.pinned === false)

      let displayRows
      if (region === 'sidebar') {
        displayRows = foldedItems.length > 0
          ? foldedItems.map((item) => displayRow(item, true))
          : [h('div', { className: 'dsh-fa-empty', key: 'empty' }, translate('sidebar.empty'))]
      } else if (shippedViewRows) {
        // The shipped More menu lists folded Views before this section.
        displayRows = []
      } else {
        // No shipped tab-row menu to list them: show every View outside the tab
        // row — including ones folded only by the tab row's width budget, whose
        // pin state can still be `false`-plus-visible — so nothing is lost.
        const outsideRows = []
        for (const entry of ownEntries.values()) {
          outsideRows.push(displayRow({ id: entry.id, label: labelOf(entry) }, false))
        }
        displayRows = outsideRows.length > 0
          ? outsideRows
          : [h('div', { className: 'dsh-fa-empty', key: 'empty' }, translate('views.empty'))]
      }

      const settingsButton = h('button', {
        key: 'settings',
        type: 'button',
        role: 'menuitem',
        className: 'dsh-fa-gear',
        'aria-expanded': settings ? 'true' : 'false',
        onClick(event) {
          event.preventDefault()
          event.stopPropagation()
          setSettings((previous) => !previous)
        },
      },
      h('svg', {
        width: 12,
        height: 12,
        viewBox: '0 0 16 16',
        'aria-hidden': 'true',
        focusable: 'false',
        style: { display: 'block', flex: 'none' },
      },
      h('circle', {
        cx: 8, cy: 8, r: 2.3,
        fill: 'none', stroke: 'currentColor', strokeWidth: 1.4,
      }),
      h('path', {
        d: 'M8 1.7v1.9M8 12.4v1.9M1.7 8h1.9M12.4 8h1.9M3.6 3.6l1.3 1.3M11.1 11.1l1.3 1.3M12.4 3.6l-1.3 1.3M4.9 11.1l-1.3 1.3',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.4,
        strokeLinecap: 'round',
      })),
      h('span', null, settings ? translate('done') : translate('settings')))

      const body = settings
        ? [
            h('div', { className: 'dsh-fa-hint', key: 'hint' },
              translate(region === 'views' ? 'views.hint' : 'sidebar.hint')),
            items.map((item) => settingsRow(item)),
            h('div', { className: 'dsh-fa-foot', key: 'foot' },
              h('button', {
                type: 'button',
                role: 'menuitem',
                className: 'dsh-fa-reset',
                onClick(event) {
                  event.preventDefault()
                  event.stopPropagation()
                  showAll()
                },
              }, translate('showAll'))),
          ]
        : displayRows

      return h('div', { className: 'dsh-fa-root', role: 'presentation' },
        h('div', { className: 'dsh-fa-head', key: 'head' },
          h('span', null, translate(region === 'views' ? 'views.title' : 'sidebar.title')),
          settingsButton),
        h('div', { className: 'dsh-fa-body', key: 'body' }, body))
    }

    // ---------------------------------------------------------- settings fold

    /** Client context, published for the settings nav helpers. */
    let settingsPluginCtx = null

    /**
     * Resolve the current nav label of every registered settings section.
     * @returns {Map<string, string>} section id → label.
     */
    function readSettingsSectionLabels() {
      const labels = new Map()
      if (settingsPluginCtx === null) return labels
      try {
        for (const stored of settingsPluginCtx.slots.entriesOfSlot('settings.section')) {
          const options = stored.options || {}
          const id = typeof options.id === 'string' ? options.id : undefined
          if (id === undefined) continue
          let text
          try {
            const value = options.label
            text = typeof value === 'function' ? value() : value
          } catch {
            text = undefined
          }
          labels.set(id, typeof text === 'string' && text.length > 0 ? text : id)
        }
      } catch (err) {
        console.warn('[fold-anything] could not read the settings sections', err)
      }
      return labels
    }

    /**
     * Mark the settings nav cells of the folded sections. The cells keep their
     * DOM (so the page can still select them) and are hidden by CSS.
     */
    function applySettingsFoldState() {
      const panel = document.querySelector(SETTINGS_PANEL_SELECTOR)
      if (panel === null) return
      const nav = panel.querySelector('nav')
      if (nav === null) return
      const folded = readList(SETTINGS_STORAGE_KEY)
      const foldedLabels = new Set()
      if (folded.size > 0) {
        for (const [id, label] of readSettingsSectionLabels()) {
          if (id === SETTINGS_SECTION_ID) continue
          if (folded.has(id)) foldedLabels.add(label)
        }
      }
      for (const button of nav.querySelectorAll('button')) {
        const label = (button.textContent || '').trim()
        if (foldedLabels.has(label)) button.setAttribute(SETTINGS_NAV_ATTRIBUTE, '')
        else button.removeAttribute(SETTINGS_NAV_ATTRIBUTE)
      }
    }

    /** Re-run the marking on the next frame (coalesced). */
    let requestSettingsNavSync = function () {}

    /**
     * Keep the settings navigation marked while the panel is open. Two
     * MutationObservers (body for panel mount/unmount, panel for shell
     * re-renders and locale label changes) re-apply the markers, so a React
     * render cannot drop them. Any failure just leaves the nav untouched.
     * @param {object} ctx - Client context.
     * @returns {() => void} disposer.
     */
    function startSettingsNavSync(ctx) {
      settingsPluginCtx = ctx
      let frame = 0
      let panelObserver = null
      let observedPanel = null
      const run = () => {
        frame = 0
        applySettingsFoldState()
      }
      const schedule = () => {
        if (frame !== 0) return
        frame = window.requestAnimationFrame(run)
      }
      requestSettingsNavSync = schedule
      const watchPanel = (panel) => {
        if (panel === observedPanel) return
        if (panelObserver !== null) {
          panelObserver.disconnect()
          panelObserver = null
        }
        observedPanel = panel
        if (panel === null) return
        panelObserver = new MutationObserver(schedule)
        panelObserver.observe(panel, { subtree: true, childList: true, characterData: true })
      }
      const bodyObserver = new MutationObserver(() => {
        const panel = document.querySelector(SETTINGS_PANEL_SELECTOR)
        watchPanel(panel)
        if (panel !== null) schedule()
      })
      bodyObserver.observe(document.body, { childList: true })
      watchPanel(document.querySelector(SETTINGS_PANEL_SELECTOR))
      schedule()
      return () => {
        settingsPluginCtx = null
        requestSettingsNavSync = function () {}
        bodyObserver.disconnect()
        if (panelObserver !== null) panelObserver.disconnect()
        if (frame !== 0) window.cancelAnimationFrame(frame)
        for (const element of document.querySelectorAll('[' + SETTINGS_NAV_ATTRIBUTE + ']')) {
          element.removeAttribute(SETTINGS_NAV_ATTRIBUTE)
        }
      }
    }

    /**
     * Select a settings section through the nav cell the shell rendered. A
     * folded cell is display:none but still responds to a programmatic click, so
     * the fold page can open a hidden section without any other shell API.
     * @param {string} label - the section's current nav label.
     * @returns {boolean} whether a cell was clicked.
     */
    function openSettingsSection(label) {
      const panel = document.querySelector(SETTINGS_PANEL_SELECTOR)
      if (panel === null) return false
      const nav = panel.querySelector('nav')
      if (nav === null) return false
      const wanted = label.trim()
      const normalized = wanted.replace(/\s+/g, ' ')
      let loose = null
      for (const button of nav.querySelectorAll('button')) {
        const text = (button.textContent || '').trim()
        if (text === wanted) {
          button.click()
          return true
        }
        if (loose === null && text.replace(/\s+/g, ' ') === normalized) loose = button
      }
      if (loose !== null) {
        loose.click()
        return true
      }
      return false
    }

    /** Settings ledger store: sections and their nav icons. */
    const settingsSectionStore = createSlotStore('settings.section')
    const settingsIconStore = createSlotStore('settings.section.icon')

    /**
     * Navigation icon for this plugin's settings page.
     * @param {{size?: number}} props - shell icon size.
     * @returns {import('react').ReactElement} the glyph.
     */
    function SettingsFoldIcon(props) {
      const size = typeof props.size === 'number' ? props.size : 16
      return h('svg', {
        width: size,
        height: size,
        viewBox: '0 0 16 16',
        'aria-hidden': 'true',
        focusable: 'false',
        style: { display: 'block' },
      },
      h('path', {
        d: 'M2 4.2h12M2 8h12M2 11.8h6',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.4,
        strokeLinecap: 'round',
      }),
      h('path', {
        d: 'M10.4 11.6 12.2 13.4 14 11.6',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.4,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      }))
    }

    /**
     * The "More settings" page: folded settings sections, and the switches that
     * fold them. Owner props carry only `close` (unused here); the locale seat
     * supplies `t`.
     * @param {object} props - owner and locale props.
     * @returns {import('react').ReactElement} the page.
     */
    function SettingsFoldSection(props) {
      const translate = typeof props.t === 'function' ? props.t : function (key) { return key }
      const sections = useStore(settingsSectionStore)
      const icons = useStore(settingsIconStore)
      const stored = readList(SETTINGS_STORAGE_KEY)
      const [overrides, setOverrides] = React.useState(() => {
        const initial = {}
        for (const id of stored) initial[id] = true
        return initial
      })
      const [settings, setSettings] = React.useState(false)

      const iconById = new Map()
      for (const icon of icons) iconById.set(icon.id, icon.component)

      const items = []
      for (const section of sections) {
        if (section.id === SETTINGS_SECTION_ID) continue
        const override = overrides[section.id]
        const folded = override === undefined ? stored.has(section.id) : override === true
        items.push({ id: section.id, label: section.label, folded })
      }
      const foldedItems = items.filter((item) => item.folded)

      const setFolded = (item, folded) => {
        const next = {}
        for (const key of Object.keys(overrides)) next[key] = overrides[key]
        next[item.id] = folded
        setOverrides(next)
        writeOne(SETTINGS_STORAGE_KEY, item.id, folded)
        requestSettingsNavSync()
      }

      const showAll = () => {
        writeList(SETTINGS_STORAGE_KEY, new Set())
        const next = {}
        for (const item of items) next[item.id] = false
        setOverrides(next)
        requestSettingsNavSync()
      }

      const settingsButton = h('button', {
        type: 'button',
        className: 'dsh-fa-gear',
        'aria-expanded': settings ? 'true' : 'false',
        onClick() {
          setSettings((previous) => !previous)
        },
      },
      h('span', null, settings ? translate('done') : translate('settings')))

      const row = (item, withSwitch) => h('button', {
        key: item.id,
        type: 'button',
        role: withSwitch ? 'switch' : undefined,
        'aria-checked': withSwitch ? (item.folded ? 'false' : 'true') : undefined,
        className: 'dsh-fa-row',
        title: item.label,
        onClick() {
          if (withSwitch) {
            setFolded(item, !item.folded)
            return
          }
          openSettingsSection(item.label)
        },
      },
      h(PanelIcon, { key: 'icon', component: iconById.get(item.id) }),
      h('span', { className: 'dsh-fa-label' }, item.label),
      withSwitch
        ? h('span', {
            key: 'switch',
            className: 'dsh-fa-switch',
            'data-on': item.folded ? 'false' : 'true',
            'aria-hidden': 'true',
          }, h('span', { className: 'dsh-fa-knob' }))
        : null)

      const body = settings
        ? [
            h('p', { className: 'dsh-fa-settings-hint', key: 'hint' }, translate('settings.hint')),
            h('div', { className: 'dsh-fa-settings-list', key: 'list' },
              items.map((item) => row(item, true))),
            h('div', { className: 'dsh-fa-settings-foot', key: 'foot' },
              h('button', { type: 'button', className: 'dsh-fa-reset', onClick: showAll }, translate('showAll'))),
          ]
        : [
            foldedItems.length > 0
              ? h('div', { className: 'dsh-fa-settings-list', key: 'list' },
                  foldedItems.map((item) => row(item, false)))
              : h('p', { className: 'dsh-fa-settings-hint', key: 'empty' }, translate('settings.empty')),
          ]

      return h('div', { className: 'dsh-fa-settings' },
        h('div', { className: 'dsh-fa-settings-head', key: 'head' },
          h('h3', { className: 'dsh-fa-settings-title' }, translate('settings.title')),
          settingsButton),
        body)
    }

    // ----------------------------------------------------------------- plugin

    /**
     * Client plugin entry point: one locale namespace, one stylesheet, three
     * slot stores, and one registration per fold target.
     * @param {object} ctx - the Client Cordis context.
     */
    function apply(ctx) {
      ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'fold-anything: dictionaries')
      const t = ctx.locale.bind(NS)

      ctx.effect(() => {
        // Replace a leftover tag from a crashed instance instead of keeping it:
        // a no-op branch here would outlive the plugin's own cleanup.
        const selector = 'style[data-plugin-css="' + STYLE_TAG_ID + '"]'
        const stale = document.querySelector(selector)
        if (stale !== null && stale.parentNode !== null) stale.parentNode.removeChild(stale)
        const tag = document.createElement('style')
        tag.dataset.plugin = 'dsh-fold-anything'
        tag.dataset.pluginCss = STYLE_TAG_ID
        tag.textContent = CSS
        document.head.appendChild(tag)
        return () => {
          tag.remove()
        }
      }, 'fold-anything: controls styles')

      ctx.effect(() => panelStore.bind(ctx), 'fold-anything: panel icons')
      ctx.effect(() => viewStore.bind(ctx), 'fold-anything: view roster')
      ctx.effect(() => viewActionStore.bind(ctx), 'fold-anything: view menu rows')
      ctx.effect(() => settingsSectionStore.bind(ctx), 'fold-anything: settings sections')
      ctx.effect(() => settingsIconStore.bind(ctx), 'fold-anything: settings icons')
      ctx.effect(() => startSettingsNavSync(ctx), 'fold-anything: settings nav sync')

      // Best-effort startup replay: apply the saved fold state without waiting
      // for the user to open a menu. Falls back to the menu-open replay when the
      // shell markup moved or the page is not ready.
      ctx.effect(() => startBootReplay(ctx), 'fold-anything: startup replay')

      // `slots.inject` waits for the shell to declare each slot, so this bundle
      // may load before or after the shell without a race.
      ctx.slots.inject(PANEL_ACTIONS_SLOT, () => ctx.slots.register({
        name: PANEL_ACTIONS_SLOT,
        id: PANEL_ENTRY_ID,
        order: 100,
        locale: NS,
        inject: () => ({ region: 'sidebar' }),
      }, FoldMenuContent))

      ctx.slots.inject(VIEW_ACTIONS_SLOT, () => ctx.slots.register({
        name: VIEW_ACTIONS_SLOT,
        id: VIEW_ENTRY_ID,
        order: 100,
        locale: NS,
        inject: () => ({ region: 'views' }),
      }, FoldMenuContent))

      // Settings navigation: one extra page that lists folded sections, plus its
      // nav icon. The page's switches hide/show the other sections' nav cells.
      ctx.slots.inject('settings.section', () => ctx.slots.register({
        name: 'settings.section',
        id: SETTINGS_SECTION_ID,
        order: 900,
        locale: NS,
        label: () => t('settings.title'),
      }, SettingsFoldSection))

      ctx.slots.inject('settings.section.icon', () => ctx.slots.register({
        name: 'settings.section.icon',
        id: SETTINGS_SECTION_ID,
        order: 900,
      }, SettingsFoldIcon))
    }

    return { apply, inject }
  },
})
