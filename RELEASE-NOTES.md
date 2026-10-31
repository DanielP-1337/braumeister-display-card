# Braumeister Display Card 0.6.1

The four navigation rings now follow the configured smart plug. A confirmed
`off` state temporarily darkens all rings. The saved color remains unchanged
and returns when the plug is on. A deliberate Lights off selection stays dark.

Cloud outages, missing plug entities and unknown/unavailable plug states do not
count as confirmed power-off. No new configuration is required: the existing
`entities.plug` mapping is used. LCD appearance and device commands are unchanged.

Automated tests cover power transitions, all navigation pages, saved color
preservation, cloud outages and missing/unknown/unavailable plug states.
