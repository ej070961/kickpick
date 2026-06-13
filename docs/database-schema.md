# Database Schema

KickPick stores team data under `teams.owner_user_id`. RLS policies should use that ownership chain so each signed-in user can only access rows for their own teams.

This document is the source of truth for schema intent. If migrations or Supabase tables change, update this file in the same task.

## Ownership Model

```txt
auth.users
  -> teams.owner_user_id
    -> players.team_id
    -> formation_templates.team_id
    -> matches.team_id
      -> match_guest_players.match_id
```

Child rows that do not have `team_id` directly must resolve ownership through their parent rows.

## Enums

### `position_code`

Position codes used by players and formation slots.

```txt
GK
LB, LWB, LCB, CB, RCB, RB, RWB, RC
LDM, CDM, RDM
LCM, CM, RCM
CAM, LM, RM
LW, LF, CF, RF, RW
```

Player input currently uses the subset defined by `PlayerPositionCode`; formation slots may use the wider `FormationSlotCode` set.

### `match_status`

```txt
draft
generated
completed
```

## Tables

### `teams`

Team workspace owned by a Supabase Auth user.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `owner_user_id` | `uuid` | References `auth.users(id)` |
| `name` | `text` | Team name |
| `created_at` | `timestamptz` | Insert timestamp |
| `updated_at` | `timestamptz` | Updated by trigger |

### `players`

Roster for a team. Deletion is soft-delete first via `is_deleted`.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `team_id` | `uuid` | References `teams(id)` |
| `name` | `text` | Required, non-blank |
| `player_number` | `integer` | Optional uniform number |
| `main_position` | `position_code` | Primary player position |
| `sub_positions` | `position_code[]` | Unique array, defaults to empty |
| `priority_rank` | `integer` | Positive sort rank; lower number means higher priority |
| `is_deleted` | `boolean` | Soft delete flag |
| `created_at` | `timestamptz` | Insert timestamp |
| `updated_at` | `timestamptz` | Updated by trigger |

### `formation_templates`

Team-owned formation template. Templates are user-created; the app does not seed default templates automatically.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `team_id` | `uuid` | References `teams(id)` |
| `name` | `text` | Template display name, e.g. `4-3-3` |
| `is_deleted` | `boolean` | Soft delete flag |
| `created_at` | `timestamptz` | Insert timestamp |
| `updated_at` | `timestamptz` | Updated by trigger |

### `formation_template_slots`

Slot definitions for a formation template.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `formation_template_id` | `uuid` | References `formation_templates(id)` |
| `slot_name` | `position_code` | Formation slot code |
| `sort_order` | `integer` | Display/order index; GK is inserted first by the current form |
| `x` | `numeric(5, 2)` | Percentage coordinate, 0 to 100 |
| `y` | `numeric(5, 2)` | Percentage coordinate, 0 to 100 |
| `created_at` | `timestamptz` | Insert timestamp |
| `updated_at` | `timestamptz` | Updated by trigger |

Expected invariant:

- Each active template has 11 slots.
- The app's template create form asks for 10 field slots and automatically inserts `GK`.

### `matches`

Match setup and generation status.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `team_id` | `uuid` | References `teams(id)` |
| `name` | `text` | Optional, non-blank when present |
| `match_date` | `date` | Optional |
| `quarter_count` | `integer` | 1 to 8 |
| `gk_fixed` | `boolean` | Whether the selected GK is fixed to every quarter |
| `formation` | `text` | Formation label copied at creation time |
| `status` | `match_status` | `draft`, `generated`, `completed` |
| `created_at` | `timestamptz` | Insert timestamp |
| `updated_at` | `timestamptz` | Updated by trigger |

### `match_players`

Join table for selected players in a match.

| Column | Type | Notes |
| --- | --- | --- |
| `match_id` | `uuid` | References `matches(id)`, cascade delete expected |
| `player_id` | `uuid` | Optional, references `players(id)` for registered roster players |
| `guest_player_id` | `uuid` | Optional, references `match_guest_players(id)` for match-only guest players |
| `target_quota` | `integer` | Generated target slot count |
| `is_reduced_quota` | `boolean` | Whether player was selected as reduced quota |
| `created_at` | `timestamptz` | Insert timestamp |

Expected key:

```txt
unique (match_id, player_id) where player_id is not null
unique (match_id, guest_player_id) where guest_player_id is not null
check exactly one of player_id, guest_player_id is not null
```

GK fixed behavior:

- Fixed GK receives `target_quota = quarter_count`.
- Fixed GK is not eligible for `is_reduced_quota`.
- Other players' `target_quota` is calculated from field slots only when `gk_fixed = true`.

### `match_guest_players`

Match-only guest player snapshots. These rows are not part of the team roster and are deleted with the match.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `match_id` | `uuid` | References `matches(id)`, cascade delete expected |
| `name` | `text` | Required, non-blank |
| `player_number` | `integer` | Optional uniform number |
| `main_position` | `position_code` | Primary player position |
| `sub_positions` | `position_code[]` | Unique array, defaults to empty |
| `priority_rank` | `integer` | Positive sort rank copied from match creation |
| `created_at` | `timestamptz` | Insert timestamp |

### `quarter_formations`

One row per match quarter.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `match_id` | `uuid` | References `matches(id)`, cascade delete expected |
| `quarter_number` | `integer` | Positive, unique per match |
| `created_at` | `timestamptz` | Insert timestamp |
| `updated_at` | `timestamptz` | Updated by trigger |

Expected invariant:

```txt
unique (match_id, quarter_number)
```

### `formation_slots`

Position slot assignments for each quarter.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `quarter_formation_id` | `uuid` | References `quarter_formations(id)`, cascade delete expected |
| `slot_name` | `position_code` | Formation slot code |
| `x` | `numeric(5, 2)` | Percentage coordinate, 0 to 100 |
| `y` | `numeric(5, 2)` | Percentage coordinate, 0 to 100 |
| `player_id` | `uuid` | Optional assigned player |
| `guest_player_id` | `uuid` | Optional assigned match guest player |
| `fit_score` | `integer` | Optional 0 to 10 score |
| `is_manual` | `boolean` | Whether user manually changed the slot |
| `created_at` | `timestamptz` | Insert timestamp |
| `updated_at` | `timestamptz` | Updated by trigger |

## RLS Expectations

Enable RLS on every table and add policies that resolve ownership through:

```sql
teams.owner_user_id = auth.uid()
```

Policy resolution:

- `teams`: direct `owner_user_id = auth.uid()`.
- `players`, `formation_templates`, `matches`: check direct `team_id`.
- `formation_template_slots`: check parent `formation_templates.team_id`.
- `match_players`: check parent `matches.team_id` and selected `players.team_id` or `match_guest_players.match_id`.
- `match_guest_players`: check parent `matches.team_id`.
- `quarter_formations`: check parent `matches.team_id`.
- `formation_slots`: check parent `quarter_formations -> matches -> team_id`.

Inserts should validate that child rows belong to a team owned by the current user. Updates and deletes should use the same ownership chain.
