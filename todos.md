# TODO

- [ ] 
- [ ] html standards follow-ups (see `claude-skills/programming-standards/html.md`): `popover-panel` centered mode is still a hand-rolled modal (`role="dialog" aria-modal` + own focus trap) — move it to native `<dialog>`; anchored mode waits on CSS anchor positioning / `popover` support.
- [ ] `dropdown-button` keeps `role="menu"`/`menuitem` deliberately (no native menu widget); revisit only if it adopts `popover` for light-dismiss/top-layer.
- [ ] `chevron-panel` already uses a real `<button aria-expanded>`; could become `<details>`/`<summary>` if the chevron rotation and `toggle` event contract can be kept.
