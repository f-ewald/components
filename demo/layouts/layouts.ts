import "../../src/index.js";
import type {
  AppShell,
  DataTable,
  IconButton,
  ModalDialog,
  PaginationNav,
  PopoverPanel,
  UiButton,
} from "../../src/index.js";
import { iconEllipsisVertical } from "../../src/icons.js";

/**
 * Shared wiring for the full-page template demos (list-only, list+detail,
 * detail-only, form page). Each page only contains the markup for its template;
 * this module seeds whatever demo elements are present and no-ops for the rest,
 * so one entry module serves all four pages.
 */

interface Member {
  id: string;
  name: string;
  role: string;
  status: string;
  email: string;
}

const members: Member[] = [
  { id: "m1", name: "Ada Lovelace", role: "Owner", status: "Active", email: "ada@acme.test" },
  { id: "m2", name: "Alan Turing", role: "Admin", status: "Active", email: "alan@acme.test" },
  { id: "m3", name: "Grace Hopper", role: "Editor", status: "Invited", email: "grace@acme.test" },
  { id: "m4", name: "Katherine Johnson", role: "Editor", status: "Active", email: "kj@acme.test" },
];

// Seed every template table with the same sample data.
for (const table of document.querySelectorAll<DataTable>("data-table[data-tpl-table]")) {
  table.columns = [
    { key: "name", label: "Name" },
    { key: "role", label: "Role" },
    { key: "status", label: "Status" },
  ];
  table.rows = members;
  table.rowHref = (row) => `#${(row as Member).id}`;
}

// Reflect page changes back onto every controlled pager.
for (const pager of document.querySelectorAll<PaginationNav>("pagination-nav")) {
  pager.addEventListener("page-change", (event) => {
    pager.currentPage = (event as CustomEvent<{ page: number }>).detail.page;
  });
}

// list + detail: open the shell's detail pane for the member in the hash.
const shell = document.querySelector<AppShell>("app-shell[data-tpl-detail]");
const detailBody = document.querySelector<HTMLElement>("[data-tpl-detail-body]");
if (shell && detailBody) {
  const showMember = (): void => {
    const id = location.hash.slice(1);
    const member = members.find((candidate) => candidate.id === id);
    if (!member) return;
    detailBody.innerHTML = `
      <h4 style="margin: 0; font-weight: 600;">${member.name}</h4>
      <dl style="margin: 0.75rem 0 0; display: grid; grid-template-columns: auto 1fr; gap: 0.25rem 0.75rem;">
        <dt style="color: #64748b;">Role</dt><dd style="margin: 0;">${member.role}</dd>
        <dt style="color: #64748b;">Status</dt><dd style="margin: 0;">${member.status}</dd>
        <dt style="color: #64748b;">Email</dt><dd style="margin: 0;">${member.email}</dd>
      </dl>`;
    shell.detailOpen = true;
  };
  window.addEventListener("hashchange", showMember);
  showMember();
  shell.addEventListener("detail-close", () => {
    if (location.hash) history.replaceState(null, "", location.pathname + location.search);
  });
}

// list-only: dismissible quick-actions popover anchored off the topbar.
const quickActionsTrigger = document.querySelector<IconButton>("[data-testid='tpl-quick-actions-trigger']");
const quickActionsPopover = document.querySelector<PopoverPanel>("[data-testid='tpl-quick-actions-popover']");
if (quickActionsTrigger && quickActionsPopover) {
  quickActionsTrigger.icon = iconEllipsisVertical(18);
  quickActionsTrigger.addEventListener("click", () => {
    quickActionsPopover.open = !quickActionsPopover.open;
  });
  quickActionsPopover.addEventListener("panel-close", () => {
    quickActionsPopover.open = false;
  });
}

// list-only: fullscreen report dialog toggled from the topbar.
const fullscreenReportOpen = document.querySelector<UiButton>(
  "[data-testid='tpl-fullscreen-report-open']",
);
const fullscreenReport = document.querySelector<ModalDialog>("[data-testid='tpl-fullscreen-report']");
if (fullscreenReportOpen && fullscreenReport) {
  fullscreenReportOpen.addEventListener("click", () => {
    fullscreenReport.open = true;
  });
  fullscreenReport.addEventListener("panel-close", () => {
    fullscreenReport.open = false;
  });
}

// Any template form: keep the demo on-page and report the submit.
for (const form of document.querySelectorAll<HTMLFormElement>("form[data-tpl-form]")) {
  const status = form.querySelector<HTMLElement>("[data-tpl-form-status]");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (status) status.textContent = "Saved.";
  });
}
