# bitwig-electra-one
Electra One Control Script for Bitwig

This Control Script for Bitwig allows Remote Control Pages to be controlled by Electra One. It has the following features:

- Operates as any Bitwig Remote Control script, it follows the current device (any), and maps 8 controls (per page), so that Electra One reflects the current parameter values, and allow to control them seamlessly (no value jumps)
- It reflects the current parameter names (assignments) as control labels on Electra One.
- It uses high-res MIDI so that even meticulous parameters changes will transmitted and received. This thanks to Electra One's a very balanced tuning of controll handling. Due to this one can do (i.e. with a 'Feedback' parameter on a 0.0 % to 100.0 % scale) little steps like 63.1%, 63.2%, 63.3%, 63.4%. While one a standard low-res MIDI setup this would result in little jumps like 62.5%, 63.3%, 64.1%, 64.8%. 