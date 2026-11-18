# Display Card 0.7.0-beta.28

Enable the three hardware-observed Select actions through the program-control service:

- Add hops: acknowledge the notification and return to boiling (3080 → 3070).
- Whirlpool: advance to Cheers (3510 → 3610).
- Cheers: return to the main menu (3610 → 101).

Requires Menu Companion 0.1.0-beta.18 and Bridge 0.5.1-beta.10, with the existing
`menu_control: true` and `program_control: true` card options. An older Companion
leaves these actions disabled. Administrator and fresh-state checks remain active.
Only Select is enabled: hop Cancel remains unverified, and Whirlpool/Cheers have
no Cancel or Up/Down buttons. No generic recipe-stage confirmation is introduced.

All three underlying transitions were recorded from user-operated MySpeidel
commands on a Braumeister 20 L Plus, firmware 1.1.27. The new HA path is covered
by automated tests and awaits the next hardware test. Update when the device is
idle; reload the browser after updating the card. No sound assets were added.
