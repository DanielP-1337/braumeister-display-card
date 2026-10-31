# Braumeister Display Card 0.5.0

First HACS-ready frontend distribution. The single JavaScript asset includes all
eight language catalogs (en-US, de, fr, es, it, pt, pl, nl), including the recipe
editing title and explanatory message for state 6010. Custom JSON overrides
remain supported in /local/braumeister-i18n or a configured i18n_path.

Add DanielP-1337/braumeister-display-card as a Dashboard custom repository in HACS.
When migrating, replace the old /local JavaScript resource with
/hacsfiles/braumeister-display-card/braumeister-display-card.js; do not load both.
Keep existing YAML entity mappings and the companion integration.

This release does not change backend states or device commands. Boiling time and
next-hop countdown remain open display limitations. English and German UI were
hardware-tested on card 0.4.2; the new packaging has automated offline tests and
still needs a real HACS installation smoke test. Default HACS catalog inclusion
is not implied by this release.
