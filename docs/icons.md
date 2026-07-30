# Icon catalog

Every icon in `@f-ewald/components/icons.js`, generated from
`scripts/generate-icons.mjs` by `npm run icons`, with the intended use case
for each so consumers (including AI coding agents) pick a consistent icon for
a given situation instead of ad hoc choices. Each is a function taking an
optional `size` (pixels) and returning a Lit `TemplateResult`:

```js
import { iconPencil } from "@f-ewald/components/icons.js";

const icon = iconPencil(16); // 16px, defaults shown below if omitted
```

| Icon | Default size | Use for |
| --- | --- | --- |
| `iconAcademicCap` | 18px | Education, learning, or certification-related content. |
| `iconArrowDownTray` | 16px | Download or export actions. |
| `iconArrowPath` | 12px | Refresh actions, or an animated busy/loading spinner. |
| `iconArrowRight` | 12px | "Continue" or forward-progressing actions, e.g. a compact next-step arrow. |
| `iconArrowRightOnRectangle` | 16px | Logout/sign-out actions. |
| `iconArrowsPointingOut` | 16px | "Expand" or "view fullscreen" actions. |
| `iconArrowsRightLeft` | 16px | Swap, exchange, or compare actions between two items. |
| `iconArrowTopRightOnSquare` | 16px | Links that open in a new tab/window, or navigate to an external site. |
| `iconBars3` | 18px | A hamburger menu toggle, e.g. collapsing or opening a sidebar/nav drawer. |
| `iconCalendar` | 16px | Dates, due dates, or calendar-related metadata. |
| `iconChatBubbleLeftRight` | 18px | Messaging, comments, or conversation-related content. |
| `iconCheckCircle` | 16px | Success states, confirmations, or a selected-item checkmark. |
| `iconChevronDown` | 16px | "Scroll to bottom", a downward disclosure, or an expanded tree/accordion indicator. |
| `iconChevronLeft` | 16px | "Previous" navigation, e.g. pagination or carousel back controls. |
| `iconChevronRight` | 16px | "Next" navigation, or a collapsed disclosure/submenu indicator. |
| `iconChevronUp` | 16px | "Scroll to top", or an expanded/upward disclosure control. |
| `iconClipboardDocumentList` | 18px | Task lists, checklists, or clipboard/notes content. |
| `iconClock` | 16px | Timestamps, durations, or time-related metadata. |
| `iconCodeBracketSquare` | 16px | Code snippets, developer tools, or technical/API content. |
| `iconCog` | 20px | Settings, preferences, or configuration entry points. |
| `iconComputerDesktop` | 16px | A "system/auto" theme option, or to represent a desktop device. |
| `iconCpuChip` | 18px | System, hardware, or technical/processing content. |
| `iconCurrencyDollar` | 16px | Monetary values, pricing, or billing-related content. |
| `iconDocument` | 18px | A generic file/document icon, e.g. tile-grid's default file icon. |
| `iconEllipsisVertical` | 16px | An overflow ("kebab") menu trigger, e.g. dropdown-button's icon variant. |
| `iconExclamationCircle` | 16px | Error states, e.g. the error variant of toast-notification. |
| `iconExclamationTriangle` | 16px | Warning states, e.g. the warning variant of toast-notification. |
| `iconEye` | 16px | "Show"/"preview" actions or a visible/reviewed state, e.g. password visibility or a review status. |
| `iconEyeSlash` | 16px | "Hide" actions or a hidden/masked state; pair with iconEye for the visible state. |
| `iconFolder` | 18px | Folders, directories, or grouped file content. |
| `iconHeart` | 16px | "Like"/"favorite" actions in their unselected state. |
| `iconHeartSolid` | 16px | "Like"/"favorite" actions in their selected/active state; pair with iconHeart for the unselected state. |
| `iconHome` | 16px | A primary navigation link to the app's home or dashboard. |
| `iconInfo` | 20px | Neutral informational messages, e.g. an info toast or status banner. |
| `iconLink` | 16px | Copy-link or hyperlink-related actions, e.g. copy-link-button. |
| `iconListBullet` | 18px | A list-view toggle, or to represent list-type content. |
| `iconMap` | 16px | A map-view toggle, or to represent map/geographic content. |
| `iconMapPin` | 16px | A location, address, or map marker. |
| `iconMoon` | 16px | A dark-theme toggle, or to represent night/dark mode. |
| `iconPencil` | 16px | Edit actions, e.g. an edit icon-button or inline edit toggle. |
| `iconPlus` | 16px | "Add new" actions, e.g. creating a new item or row. |
| `iconPuzzlePiece` | 18px | Plugins, integrations, or extensible/add-on features. |
| `iconQuestionMarkCircle` | 20px | Help, tooltips, or "learn more" affordances. |
| `iconQueueList` | 16px | Queues, backlogs, or ordered work-item lists. |
| `iconShieldCheck` | 16px | Verified, secure, or trusted states. |
| `iconShieldExclamation` | 16px | Security warnings, or at-risk/compromised states. |
| `iconSquares2x2` | 18px | A grid or kanban-view toggle, or to represent card/tile layouts. |
| `iconSun` | 16px | A light-theme toggle, or to represent daytime/light mode. |
| `iconTag` | 16px | Tags, labels, or categorical metadata. |
| `iconTrash` | 16px | Delete/remove actions, typically paired with a destructive/danger style. |
| `iconUserCircle` | 20px | A generic user/person fallback, e.g. user-avatar's icon fallback. |
| `iconUsers` | 18px | Teams, groups, or multi-user/collaboration content. |
| `iconWrenchScrewdriver` | 18px | Tools, maintenance, or build/configuration actions. |
| `iconX` | 18px | Close, dismiss, or clear (e.g. a modal, toast, or clearable input). |
