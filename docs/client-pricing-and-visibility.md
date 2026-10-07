# Client Pricing and Visibility Foundation (C-007A)

## Confirmed pricing model

```text
Variant/SKU Base Selling Price
→ Price Profile Default Adjustment
→ Optional Variant/Profile Override
→ Client-visible Price
```

The Variant's Wossol selling price is the base. Factory/supplier price, internal
markup, and profitability are never inputs to client profile calculations and
must never appear in client-facing DTOs. The resolver uses decimal arithmetic
and produces DZD amounts rounded to two minor digits.

Resolution priority is:

1. `FIXED_CLIENT_PRICE` Variant/Profile override;
2. `PERCENTAGE_ADJUSTMENT` Variant/Profile override, replacing the profile default;
3. the Price Profile default percentage adjustment;
4. the Variant Base Selling Price.

One Client Account has at most one assigned Price Profile in the MVP. A profile
may be assigned to many accounts. Profile duplication creates a separate active
profile, copies its default adjustment and configured Variant/Profile
overrides, and creates no Client assignments. Later edits are independent.

Overrides are sparse: the database stores only explicitly configured
Variant/Profile pairs, with a unique constraint on that pair and a database
check requiring exactly one override mode/value. No per-profile fields or
Cartesian Variant × Profile rows are added to Product records.

## Client access and visibility

`ClientAccount` retains the existing Client User/session identity relationship.
The new profile foreign key is nullable only to preserve existing accounts;
Admin-created and edited accounts must be assigned an active profile. New
accounts have price visibility off and catalog access disabled until an Admin
opts in.

Catalog access has a separate enabled/disabled status and an `ALL_APPROVED`
(Admin label: Entire catalog) or `SELECTED` (Admin label: Selective catalog)
mode. Entire catalog is the single account-level default-access state, never a
set of generated Include rows. Visibility rules are sparse and typed as `INCLUDE` or
`EXCLUDE`, with one target per rule: canonical GS1 GPC taxonomy node, Company,
or Product. Taxonomy includes or exclusions may target a Segment, Family, Class, or Brick;
the selected node is stored once and descendants are traversed dynamically
from the canonical parent hierarchy. Descendant rows are never materialized.

In `SELECTED` mode, all matching taxonomy, Company, and Product includes are
unioned. A Company include covers its published Products, while Product and
taxonomy includes are exact Product or descendant-branch matches. With no
matching include, the Product is not visible. In `ALL_APPROVED` mode, approved
published Products under active Companies are eligible without include rules.
In both modes, Taxonomy, Company, and Product exclusions are applied afterward and always
win. Products are not duplicated for Clients. Candidate searches omit targets
already configured for the same effect/target context; database uniqueness
constraints remain the final concurrency safeguard.

Switching to Entire catalog transactionally removes selective Includes while
retaining Excludes. Switching back to Selective catalog removes any dormant
Includes and starts without default access; explicit Includes must be added
afterward.

The server-side visibility query checks that the Client Account is active,
catalog access is enabled, the Product is published, and its Company is active.
It returns only visible Product IDs for a future client-safe projection; the
future catalog must use this query policy rather than reimplementing rule logic.
Existing C-007A Company/Product rows are migrated as `INCLUDE` rules without
changing their IDs or targets.

## Audit and deferred UI

Profile creation/update/default changes, duplication, Client Account changes
and profile assignments, visibility include/exclusion additions/removals, and
Variant/Profile override changes are appended to the existing `AuthAuditEvent`
store. Removing an override first records its prior values in that audit trail.

The Admin area manages Client Accounts, access mode/rules, Price Profiles, and
profile duplication/default adjustments, taxonomy/Company/Product includes,
and Company/Product exclusions. A per-Variant editor for sparse
overrides is deliberately deferred to C-007A2; this milestone provides its
audited server API and data model. No client-facing catalog or login UI is part
of C-007A. Platform-wide EN/FR/AR localization remains separate and taxonomy
translation behavior is unchanged.
