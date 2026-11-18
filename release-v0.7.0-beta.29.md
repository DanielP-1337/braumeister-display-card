# Display Card 0.7.0-beta.29

Fix automatic device recipe selection when the account recipe has a different
display name, such as “FastPath - Weizenbier 38°” versus “FastPath Wei”. The Recipe
view now uses the integration's current recipe_slot attribute first, so the live
step is highlighted in the corresponding device schedule.

Exact unique name matching remains a fallback when no slot is supplied. An invalid
or missing device slot entry does not silently fall back to a different recipe.
Browsing another recipe does not highlight it as active, and the main menu has no
active brewing step. The dropdown remains available for browsing device recipes.

No Bridge or Companion update is needed beyond the previous coordinated beta set.
All Card tests pass, including differing names, duplicate names, slot zero,
invalid slots, browsing another recipe, and returning to the main menu.
