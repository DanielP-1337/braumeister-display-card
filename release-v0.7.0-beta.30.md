# Display Card 0.7.0-beta.30

New device alarms, process pauses and brewing notifications automatically open
the Display tab, including when Recipe, Power or Status was selected. This also
works with sound disabled or muted, and when reconnecting to an active alarm.

Alarms and pauses show the red frame. Routine temperature, rest-end, hop and
brew-finished notifications retain their normal notification styling.
Repeated updates for the same notification do not repeatedly override manual
navigation. A new alarm context opens Display again. No device command is sent.

Card-only update; no Bridge or Companion update required. Regression coverage
includes all other tabs, muted/disabled audio, offline data, reconnect, repeated
updates and a pause arriving during a normal notification.
