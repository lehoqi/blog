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
| `minibus` | 🚐 | 面包车 | 面包车 | 24 |
| `pickup` | 🛻 | 皮卡车 | 皮卡车 | 28 |
| `truck` | 🚚 | 货车 | 货车 | 30 |
| `motorcycle` | 🏍️ | 摩托车 | 摩托车 | 35 |
| `tram` | 🚋 | 电车 | 电车 | 40 |
| `bullettrain` | 🚄 | 高铁 | 高铁 | 45 |

All new items use `kind: 'vehicle'`. Existing items keep their ids, emojis, names, and prices.

## Theme Mapping

Extend `VEHICLE_FAMILY` so every new vehicle maps to an existing family:

| id | family |
|---|---|
| `car` | `everyday` |
| `suv` | `everyday` |
| `minibus` | `everyday` |
| `pickup` | `everyday` |
| `truck` | `everyday` |
| `motorcycle` | `everyday` |
| `tram` | `everyday` |
| `bullettrain` | `everyday` |

This keeps the pack on the existing "safe arrival / traffic" route and avoids mismatched "space launch / meteor" copy for boats, planes, or ships. Sea and air vehicles are deferred until a future theme can support them.

## Data Behavior

Existing garage records remain valid. New vehicles are locked by default for every player because `normalize()` only guarantees each player's default vehicle and default dino badge are owned. Unlocking and equipping the new vehicles uses the existing `unlock()` and `equip()` functions.

## Medal Behavior

Adding vehicles must not make a child lose an already-earned collection milestone. Keep the existing `garage_master` id and label (`车库大师`) as the legacy garage completion medal, awarded when `ownedVehicleCount >= 11`. Add a new medal for the expanded garage:

| id | icon | label | condition |
|---|---|---|---|
| `mega_garage_master` | 🏁 | 超级车库大师 | `ownsAllVehicles === true` |

This makes old full-garage players keep `车库大师`, while the 19-vehicle catalog still has a new top-end target.

## Tests

Update `tests/garage.test.js` to assert:

- `CATALOG.length` is 22.
- `G.byKind('vehicle').length` is 19.
- `G.byKind('dino').length` remains 3.
- Representative new items have the expected emoji and price.
- `vehicleFamily()` returns the intended family for every new vehicle.
- The existing loop still proves every catalog vehicle maps to a non-`general` family.

Update `tests/index-adventure-flow.test.js` to assert:

- `index.html` medal definitions keep `garage_master` as `ownedVehicleCount >= 11`.
- `index.html` medal definitions include `mega_garage_master` with `ownsAllVehicles === true`.

## Acceptance Criteria

1. The root garage shows 19 vehicles and 3 dino badges without changing the UI schema.
2. New vehicles are locked until purchased, can be unlocked with enough coins, and can be equipped after ownership.
3. Existing players keep their saved coins, owned items, and equipped items.
4. Existing players who already collected 11 vehicles still satisfy `车库大师`; collecting all 19 vehicles unlocks `超级车库大师`.
5. Existing default vehicles, dino badges, and prices are unchanged.
6. All `garage.js` tests pass, and static index tests cover the revised medal definitions.
