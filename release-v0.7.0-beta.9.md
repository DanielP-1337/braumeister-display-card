# Display Card 0.7.0-beta.9

HA test beta: normalize numeric-string screen codes at the menu lookup and dispatch boundary. Cancel at pump purging (2300 / Ph / 000) requests a pause for both integer 2300 and string "2300", without the start/resume opt-in. Final abort still requires the paused dialog and confirmation. Admin, availability, pending and service capability checks remain required.

The reported installation failure is not yet proven to be a type mismatch. This beta fixes that reproducible case; hardware validation remains pending. All seven Node test scripts pass, including purge rendering and dispatch and refusal of unsupported/malformed codes. No device commands were sent.

Use Companion 0.1.0-beta.7 (same control rules as beta.6), Bridge 0.3.2-control.4-beta.1 and the existing HA integration. Update through HACS with beta versions enabled; restart HA after Companion update, then reload the browser after Card update. Keep existing YAML. Rollback: redownload the previous versions in HACS and repeat restart/reload.