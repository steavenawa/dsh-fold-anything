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

    /** Copy for both plugins; English is the fallback dictionary. */
    const en = {
      'sidebar.title': 'Sidebar entries',
      'sidebar.hint': 'Turn an entry off to fold it into More; turn it on to put it back.',
      'sidebar.empty': 'Nothing is folded.',
      'views.title': 'Conversation views',
      'views.hint': 'Turn a view off to fold its tab into the More menu; turn it on to put it back.',
      'views.empty': 'Nothing is folded.',
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

    // ----------------------------------------------------------------- plugin

    /**
     * Client plugin entry point: one locale namespace, one stylesheet, three
     * slot stores, and one registration per fold target.
     * @param {object} ctx - the Client Cordis context.
     */
    function apply(ctx) {
      ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'fold-anything: dictionaries')

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
    }

    return { apply, inject }
  },
})
