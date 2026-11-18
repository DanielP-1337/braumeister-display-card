# Display Card 0.7.0-beta.33

Requires Companion beta.21 and Bridge beta.13.
Enable Cancel as pause on the normal Heating to boil screen and guarded Select
to resume that pause. Editor entry/changes and final abort remain separate open
work. The lid prompt is still handled as its own acknowledgment, not a pause.

The coordinated Bridge/Companion update also accepts both observed PH and Pi
actuator flags at the rest-end notification. Previously PH was rejected by the
Companion even though it occurs during the same 2910/010 prompt.
