# D35E Spell Save DC

D35E Spell Save DC is a small Foundry VTT module for the D35E system. It makes spell save DCs harder to miss during play by promoting the system's native calculated save DC into a clear row on existing spell chat cards.

The module does not create extra chat messages, open extra windows, or replace D35E's spell math. It displays the DC D35E already calculated from the spell, spellbook, ability modifier, and configured DC bonuses.

## Features

- Adds a clear `Spell Save DC: N` row to existing D35E spell chat cards when a spell calls for a saving throw.
- Leaves native D35E tags, saving throw buttons, spell resistance buttons, damage buttons, and chat behavior intact.
- Adds a Spell Save DC reference box to each spellbook section on character sheets.
- Supports multiple spellbooks by reading each spellbook's own D35E `baseDCFormula` and spellcasting ability.

## Rules Basis

This module follows the D&D 3.5e / D35E spell save DC shape:

```text
10 + spell level + spellcasting ability modifier + configured D35E DC bonuses or overrides
```

Caster level is not used as the spell save DC base.

## Installation

Install the module like any other Foundry VTT module, then enable **D35E Spell Save DC** in a D35E world.

For local development, copy this folder into Foundry's `Data/modules` directory and restart or reload Foundry.

## Validation

```powershell
npm test
```

Manual checks should include:

- Cast a spell with a Fortitude, Reflex, or Will saving throw and confirm the existing chat card shows `Spell Save DC: N`.
- Cast a spell with no saving throw and confirm no save DC row appears.
- Open a character sheet's Spells tab and confirm each spellbook summary shows a Spell Save DC reference.

## Donate

If this project helped your table, donations are welcome. GitHub Sponsors is best for recurring sponsorships; PayPal works well for one-time donations.

[![Sponsor on GitHub](https://img.shields.io/badge/GitHub%20Sponsors-Donate-ea4aaa?style=flat&logo=githubsponsors&logoColor=white)](https://github.com/sponsors/SpencerZPoole)
[![Donate with PayPal](https://img.shields.io/badge/PayPal-One--time%20donation-00457C?style=flat&logo=paypal&logoColor=white)](https://paypal.me/mrpooley92)
