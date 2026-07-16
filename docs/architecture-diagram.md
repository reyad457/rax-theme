# RAX Theme — Architecture Diagram

Rendered automatically by GitHub in any Markdown file. Source is plain
[Mermaid](https://mermaid.js.org/) — no build step, no image file to keep in
sync.

## Module dependency + boot order

```mermaid
flowchart TD
    subgraph Boot["Boot sequence (identical on every page)"]
        direction TB
        A[events.js<br/>RaxEvents] --> B[registry.js<br/>RaxRegistry]
        B --> C[utils.js<br/>RaxUtils]
        C --> D[theme.js<br/>RaxTheme]
        D --> E[plugin-loader.js<br/>RaxPluginLoader]
        E --> F[components/*.js<br/>RaxComponents.*]
        F --> G[charts.js / notifications.js /<br/>search.js / command-palette.js]
        G --> H[navigation.js<br/>RaxNavigation]
        H --> I[menu-config.js<br/>commands-config.js]
        I --> J[core.js<br/>RaxCore]
        J --> K[pages/&lt;page&gt;.js<br/>this page's module]
        K --> L["inline: RaxNavigation.mount(...)"]
        L --> M["inline: RaxPluginLoader.loadAll()<br/>.then(RaxCore.boot)"]
    end

    M -->|"RaxCore.boot() runs"| N[RaxTheme.init]
    N --> O[Mount ToastStack + ModalHost]
    O --> P[Wire button ripple]
    P --> Q["Active page module's init()"]
    Q --> R[Wire card entrance animation]
    R --> S[lucide.createIcons]
```

## Extension API surface

```mermaid
flowchart LR
    Plugin["Plugin script<br/>(plugins/&lt;name&gt;/index.js)"]

    Plugin -->|registerPage| Registry[RaxRegistry]
    Plugin -->|registerMenuItem| Registry
    Plugin -->|registerWidget| Registry
    Plugin -->|registerCommand| Registry
    Plugin -->|registerSearchProvider| Registry
    Plugin -->|registerTheme| Theme[RaxTheme]

    Registry -->|getMenuItems| Sidebar[Sidebar component]
    Registry -->|getCommands + getMenuItems| Palette[CommandPalette]
    Registry -->|getPage by active id| Core[RaxCore.boot]
    Registry -->|forwards to| Search[RaxSearch]
    Search -->|registered provider| Topbar[Topbar search box]
    Theme -->|data-accent, CSS vars| CSS[theme.css resolution]
```

## CSS token layering

```mermaid
flowchart TD
    T1["variables.css — Tier 1<br/>raw primitives, no semantic meaning"]
    T2["theme.css — Tier 2<br/>semantic tokens, resolved via<br/>data-mode + data-accent on &lt;html&gt;"]
    T3["components/*.css — Tier 3<br/>component-scoped tokens,<br/>built from Tier 2 only"]
    Layout["layout.css / utilities.css / animations.css<br/>structure + glue, semantic roles only"]

    T1 --> T2
    T2 --> T3
    T2 --> Layout
    T3 --> Pages["dashboard.html / interfaces.html /<br/>vpn.html / suricata.html / logs.html"]
    Layout --> Pages
```

## Component contract

```mermaid
classDiagram
    class RaxComponent {
        <<contract>>
        +mount(el, props) instance
        +update(instance, props) void
        +destroy(instance) void
    }
    RaxComponent <|-- Card
    RaxComponent <|-- Widget
    RaxComponent <|-- Table
    RaxComponent <|-- Tabs
    RaxComponent <|-- Modal
    RaxComponent <|-- Toast
    RaxComponent <|-- Sidebar : framework singleton
    RaxComponent <|-- Topbar : framework singleton
```
