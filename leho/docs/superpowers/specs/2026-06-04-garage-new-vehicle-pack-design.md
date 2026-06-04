# Garage New Vehicle Pack Design

- Date: 2026-06-04
- Status: approved for spec
- Scope: root `index.html` garage experience only. The `v2/` app is out of scope for this change.

## Context

The root game renders the garage from `Garage.CATALOG` in `garage.js`. The current garage has 11 vehicles and 3 dino badges. `index.html` already renders all catalog vehicles automatically through `Garage.byKind('vehicle')`, so expanding the garage does not require a new page or a new UI category.

The current tests intentionally lock down catalog size, representative item prices, and `vehicleFamily()` coverage. Any new vehicle must update those tests and must map to a non-`general` family so adventure theme selection remains predictable.

## Goal

Add a small vehicle pack that gives children more things to save coins for, while keeping the existing garage model and unlock/equip flow unchanged.

## Non-Goals

- Do not add a new equipment slot or accessory category.
- Do not change localStorage schema.
- Do not change coin earning, prices of existing items, or player defaults.
- Do not change the `index.html` garage layout unless a test or runtime issue proves it necessary.

## Catalog Additions

Add 8 vehicles to `Garage.CATALOG`:

| id | emoji | name | voiceName | price |
|---|---|---|---|---:|
| `car` | 🚗 | 小汽车 | 小汽车 | 18 |
| `suv` | 🚙 | 越野车 | 越野车 | 22 |
| `truck` | 🚚 | 货车 | 货车 | 28 |
| `motorcycle` | 🏍️ | 摩托车 | 摩托车 | 35 |
| `bullettrain` | 🚄 | 高铁 | 高铁 | 45 |
| `speedboat` | 🚤 | 快艇 | 快艇 | 50 |
| `airplane` | ✈️ | 飞机 | 飞机 | 70 |
| `cruise` | 🛳️ | 邮轮 | 邮轮 | 85 |

All new items use `kind: 'vehicle'`. Existing items keep their ids, emojis, names, and prices.

## Theme Mapping

Extend `VEHICLE_FAMILY` so every new vehicle maps to an existing family:

| id | family |
|---|---|
| `car` | `everyday` |
| `suv` | `everyday` |
| `truck` | `everyday` |
| `motorcycle` | `adventure` |
| `bullettrain` | `adventure` |
| `speedboat` | `adventure` |
| `airplane` | `adventure` |
| `cruise` | `adventure` |

This keeps all vehicles on existing adventure logic paths and avoids introducing a new theme family.

## Data Behavior

Existing garage records remain valid. New vehicles are locked by default for every player because `normalize()` only guarantees each player's default vehicle and default dino badge are owned. Unlocking and equipping the new vehicles uses the existing `unlock()` and `equip()` functions.

## Tests

Update `tests/garage.test.js` to assert:

- `CATALOG.length` is 22.
- `G.byKind('vehicle').length` is 19.
- `G.byKind('dino').length` remains 3.
- Representative new items have the expected emoji and price.
- `vehicleFamily()` returns the intended family for every new vehicle.
- The existing loop still proves every catalog vehicle maps to a non-`general` family.

## Acceptance Criteria

1. The root garage shows 19 vehicles and 3 dino badges without changing the UI schema.
2. New vehicles are locked until purchased, can be unlocked with enough coins, and can be equipped after ownership.
3. Existing players keep their saved coins, owned items, and equipped items.
4. Existing default vehicles, dino badges, and prices are unchanged.
5. All `garage.js` tests pass.
