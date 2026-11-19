# Upstream migration audit — November 19, 2026

**Conclusion: the merged control PR does not yet make the current beta stack a
drop-in replacement with upstream. Keep the running installation unchanged.**
The largest remaining dependencies are the Card's display attributes and the
Companion's additional early-program/editor actions. The rare rest-end qi case
is a documented, non-blocking follow-up, not a migration prerequisite.

## Compared source versions

| Component | Audited revision/version |
| --- | --- |
| Upstream main | `a2e005f` (after merged #31 and #32; changelog update) |
| Latest published upstream release | `v3.3.0`, published November 18 before the merges; packaged Bridge 0.6.0 |
| Beta integration / Bridge source | `a4a8bf1`, Integration 3.2.1-beta.17 / Bridge 0.5.1-beta.15 |
| Beta app-store branch | `8020691`, same beta runtime, separate repository channel/name |
| Companion | `7d68b78`, 0.1.0-beta.24 |
| Display Card | 0.7.0-beta.37; repository `f9db3d5` adds documentation only after the release |

Upstream main still declares Integration 3.3.0 and Bridge 0.6.0. Its later controls
are listed under **Unreleased**. Do not infer that the already published versions
contain #32 merely because main's version files still have those numbers.

This is a source/contract audit plus synthetic offline checks. No installed HA
versions or configuration were read, no device commands were sent, and no apps,
integrations, resources, or options were changed. The beta baseline is the source
set previously reported installed by the user, not a new inventory of live HA.

## Already upstream

- Named later-program actions: rest-end, malt-pipe removal, boil start, lid,
  hops, brewing complete, Whirlpool, Cheers; exact later pause/resume contexts
  and final abort from the heating-stage pause.
- The two target-confirmation corrections: heating resume accepts PH or qH;
  rest-end from PH accepts transient pH as well as pi. The released beta source
  still lacks these two corrections.
- Start-boil permission is rechecked immediately before dispatch, just like
  resume. The beta checks start-boil permission at enqueue but omits that action
  from its corresponding dispatch permission check. Preserve upstream's fix.
- Recipe-slot attributes on brew_name and structured device recipe data are
  present upstream, so recipe matching by slot and schedule data are not missing
  backend features. Progress, alarm and basic current-step information remain.
- Upstream accepts recipe boil targets from 90 °C; the beta limits them to 95 °C.
  Preserve this upstream change and its recipe/service improvements when porting
  remaining features; do not replace upstream files with entire beta copies.

## Blocking differences for unchanged Card behavior

The beta adds these eight attributes to the **current_step** sensor. Upstream
main does not expose them there:

| Missing attribute | Current Card dependency |
| --- | --- |
| `display_clock` | Device clock in the header |
| `display_pump_flag`, `display_heater_flag` | Detailed P/H badges and manual actuator action selection |
| `display_time_target_seconds`, `display_time_elapsed_seconds` | Verified target/elapsed time in Display and Recipe |
| `display_button_labels` | Editor/button-layout context |
| `display_editor_flags` | Normal heating, lid warning, editor and pause distinctions |
| `display_start_delay_seconds` | Start-delay countdown |

These are not just cosmetic omissions. An offline check of the released Card
bundle with a synthetic `3010/qH/0D0` lid warning reproduced this routing:

- With beta attributes: `request_program_pause` and `confirm_lid_removed`.
- With upstream's current attributes (`display_interrupt=1`, no editor flags):
  `abort_program` and `resume_program` instead.

The upstream Bridge rejects those pause-dialog commands at the active lid prompt,
so this is a loss of usable controls, not an observed unintended device action.

**Required:** either port the additional validated attributes into upstream's
integration or adapt the Card/adapter to an equivalent supported data contract.
Keep the recipe-slot and alarm behavior already upstream. Validate an active lid
warning separately from an actual pause before treating the combination as ready.

Upstream also exposes `start_delay_seconds` on process_status, while this Card
reads `display_start_delay_seconds` on current_step. Upstream classifies 2120 as
pre-start; the beta treats the pending countdown as an active program because it
can start later. Resolve these semantics deliberately when adapting countdown
display/status behavior; do not silently alias fields without checking meaning.

## Companion actions not implemented by upstream Bridge

The unchanged Companion advertises 15 action names that upstream does not accept:

| Area | Missing upstream action names |
| --- | --- |
| Water prompt / delayed start | `confirm_water_filled`, `cancel_water_prompt`, `start_delay_up`, `start_delay_down`, `confirm_start_delay`, `cancel_start_delay`, `start_now` |
| Mash-in confirmations | `acknowledge_mash_temperature`, `open_malt_confirmation`, `confirm_malt_added` |
| Manual temperature editor | `open_temperature_editor`, `temperature_up`, `temperature_down`, `confirm_temperature`, `cancel_temperature` |

The last row is the **manual** editor (4006/4007), not the still-unimplemented
boil editor. These requests would receive an unsupported-action rejection from
upstream even though the Companion service selectors advertise them.

For existing action names, Companion allows additional contexts that upstream
deliberately excludes:

- Pause at 2310, 2510, 2610, 2705, 2810, 2820, 2910, 2930 and 2960.
- Final abort from the ph/120 pauses at those same screens.
- Resume from 2310/ph/120 and 2810/ph/120.

This list describes the source-contract mismatch, not proof that every broad beta
flag combination was hardware-validated. Do not copy those blanket permissions.
The exact later transitions merged in #32 match the corresponding Companion
rules, including its special handling of the normal 0D0 lid warning.

**Required for full feature parity:** port only evidenced missing actions with
their guards and tests. **Alternative for a deliberately reduced feature set:**
update Companion/Card to advertise and enable only supported action/context pairs.
The current Card checks Companion service selectors, not Bridge capabilities;
keeping the existing selectors unchanged would leave misleading enabled buttons.
The current Bridge API has no action/context capability inventory to solve this
automatically. Companion's admin check, five-second freshness check and loopback
endpoint remain compatible; no new credential mechanism is needed.

## Other differences to resolve or explicitly accept

| Difference | Impact and migration decision |
| --- | --- |
| Recipe-selection bounds | Beta derives count from a valid contiguous stored recipe list at screen 2015. Upstream uses status field 8. The beta regression fixture has nine stored recipes but field 8 = 1; upstream can reject later slots. Retain/test this case or explicitly establish it is unnecessary before claiming picker parity. |
| Diagnostics export | Beta has `diagnostics_export_to_share`, a share mount, sequence/session IDs and additional structured fields. Upstream has its own state log and compact diagnostics, but not that export contract. Our SMB log-analysis workflow would no longer work unchanged. Optional for brewing; required if retaining that diagnostic workflow. |
| App identity/options | Beta is installed from the fork's `#beta` repository channel. The upstream app is a separate source; equal slug/ports do not prove automatic option/data migration. Save and transfer supported options deliberately at a later authorized migration. |
| Card/Companion ownership | They remain separate HACS projects. Merging integration/Bridge PRs does not install, replace or remove either component. |

## Readiness plan for a later change

1. Obtain a released upstream build containing #31/#32, or explicitly choose a
   pinned test build. Recheck release contents rather than just version strings.
2. Close the current_step attribute gap first; preserve the upstream timer and
   countdown semantics intentionally. Add Card tests using actual upstream-shaped
   sensor attributes, especially lid vs. pause, manual P/H and Recipe timing.
3. Decide full parity versus a restricted profile. For full parity, prepare
   separate small ports for water/start-delay, mash confirmations and manual
   temperature editing. For either profile, align Companion action/context
   advertising with the selected Bridge. Keep unverified qi and editor/abort
   variants excluded.
4. Validate recipe-selection bounds and choose whether to keep the structured
   share export. Preserve upstream recipe-upload changes and both corrected
   control target checks.
5. Run isolated contract/integration tests for the exact combined versions.
   A later supervised device smoke test should cover normal cold-water start,
   rest end/malt-pipe/boil start, active lid Cancel vs. paused final abort,
   hop/completion/Whirlpool/Cheers, and alarms while viewing Recipe. Do not add
   artificial qi tests as a migration gate.
6. Only with separate authorization and outside a brew: back up HA and record
   entity mappings, Card YAML/resources, Companion device configuration and Bridge
   options. Stop the old Bridge before starting another host-network Bridge on
   the same ports. Verify the loopback endpoint, DNS routing and options; keep a
   tested route back to the beta set. This audit performs none of those steps.

| Candidate combination | Current assessment |
| --- | --- |
| Existing complete beta set | Leave unchanged; this is the previously tested baseline |
| New upstream Bridge + beta integration/Card/Companion | Later controls compatible in source, but early/editor actions and broader contexts are rejected; not full parity |
| Upstream integration + beta Bridge/Card/Companion | Loses required display attributes; not a drop-in combination |
| Entire upstream backend + current Card/Companion | Both gaps apply; wait for adaptations and combined validation |

## Verification and references

- Refreshed upstream main and checked published releases on November 19.
- Compared Bridge functions/options, parser/sensor attributes, Companion service
  schemas/guards, and the released Card bundle. Static extraction enumerated the
  missing action names and rejected source contexts; no live endpoints were read.
- Offline Card routing check reproduced the lid/pause mismatch above.
- This report does not claim the entire proposed mixed stack passed tests or a
  hardware run. Existing #32 tests validate its scoped Bridge changes only.

Sources: [upstream main snapshot](https://github.com/omphteliba/ha-speidel-braumeister/tree/a2e005f),
[beta backend](https://github.com/DanielP-1337/ha-speidel-braumeister/tree/a4a8bf1),
[Companion](https://github.com/DanielP-1337/braumeister-menu-companion/tree/7d68b78),
[Card beta.37](https://github.com/DanielP-1337/braumeister-display-card/releases/tag/v0.7.0-beta.37),
[merged code PR #32](https://github.com/omphteliba/ha-speidel-braumeister/pull/32).
