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

Catalog access has a separate enabled/disabled status and an `ALL_APPROVED` or
`SELECTED` mode. Selected visibility uses sparse foreign-key-backed rules for
canonical Companies or Products; Company grants cover that Company's approved
products. This does not duplicate Product records. A future collection target
can be added as another explicit target type when collection semantics are
defined; no collection model is invented here.

## Audit and deferred UI

Profile creation/update/default changes, duplication, Client Account changes
and profile assignments, visibility-rule grants/revocations, and Variant/Profile
override changes are appended to the existing `AuthAuditEvent` store. Removing
an override first records its prior values in that audit trail.

The Admin area manages Client Accounts, access mode/rules, Price Profiles, and
profile duplication/default adjustments. A per-Variant editor for sparse
overrides is deliberately deferred to C-007A2; this milestone provides its
audited server API and data model. No client-facing catalog or login UI is part
of C-007A. Platform-wide EN/FR/AR localization remains separate and taxonomy
translation behavior is unchanged.
