# ScopePlan — port audit

Read against commit `d569ba6`, working tree clean. Everything below was verified by
reading the code or generating DDL from `prisma/schema.prisma`. Where I could not
verify something, it says so in bold.

**Global caveats, stated once:**

- There is **no live database in this environment**. DDL in §A was generated with
  `npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma
  --script` (Prisma 6.15, MySQL provider). It is what `prisma db push` would
  create. The repo has **no real migration history** — `prisma/migrations/`
  contains 5 hand-written `.sql` files, none of which touch the plan tree.
  **I could not diff this against the actual production schema.**
- **I could not find a single row of ScopePlan data anywhere in this repository.**
  See §H.

---

## §0. What the four doomed tables actually hand the plan tree

One line each, as asked. These are the only facts ScopePlan reads from them —
verified by grepping every `db.*` / `prisma.*` call under `src/app/api/scopeplan`,
`src/lib/scopeplan`, `src/lib/clients` and the ScopePlan UI directory.

| Table | What the plan tree reads from it |
|---|---|
| **`clients_data`** | `id` (every phase, phase group and team member hangs off it); `client_name` (header + Excel filename); and **`lead_consultant VARCHAR` — read by `canAccessClient` to grant CLIENT_LEAD without any team-member row**. That last one is a permission input, not decoration. |
| **`client_assignments`** (agreement) | `id` + `assignment_name` for the dropdown and as part of the plan's partition key and the terminology key. `start_date`, `expected_end_date`, `budget_hours` are read by **exactly one file** — `src/app/api/scopeplan/template/route.ts:69-71,305,315-317` — where they are printed as prose into the Excel "Context" sheet for the AI to read. **No plan-tree logic reads them.** Nothing validates an activity against the agreement's dates or budget. |
| **`scopes`** | `scope_id` + `scope_name` for the dropdown, as the plan's other partition key, and as the unit of the SCOPE_LEAD visibility filter. Only rows with `status = 'A'` are listed (`hierarchy/route.ts:210`). |
| **`subdomains`** | Two things: it is the join used to find which scopes belong to a client (`hierarchy/route.ts:204-208`, `visibility.ts:189-197`), and **`subdomains.lead_consultant` is a second permission input** — being lead on *any* subdomain of a client grants CLIENT_LEAD (`permissions.ts:254-263`). |
| **`domains`** | **Nothing.** Zero references from any ScopePlan code path. Confirmed by grep. |

So when these go: you lose one dropdown pair, one Excel context blurb, and **two
implicit grants of Lead**. Fields that may want to come back on the project:
`lead_consultant` (as a real grant, not a name match), and — if you ever want the
AI template back — `start_date` / `end_date` / `budget_hours`.

---

## §A. The schema, verbatim

Generated DDL for the 13 plan tables plus the two access tables plus the
notification table. **There are zero `CHECK` constraints in the entire schema**
(`grep -c CHECK` over the full generated DDL = 0). MySQL 8 / InnoDB,
`utf8mb4_unicode_ci`.

### A.1 The tree

```sql
-- phases
CREATE TABLE `phases` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `client_id` INTEGER NOT NULL,
    `assignment_id` INTEGER NULL,
    `scope_id` INTEGER NULL,
    `group_id` INTEGER NULL,
    `phase_number` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `status` ENUM('TODO', 'IN_PROGRESS', 'DONE', 'COMPLETED', 'BLOCKED', 'ON_HOLD', 'CANCELLED') NOT NULL DEFAULT 'TODO',
    `progress_percent` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `created_by` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `phases_client_id_idx`(`client_id`),
    INDEX `phases_assignment_id_idx`(`assignment_id`),
    INDEX `phases_scope_id_idx`(`scope_id`),
    INDEX `phases_group_id_idx`(`group_id`),
    UNIQUE INDEX `phases_client_id_assignment_id_scope_id_phase_number_key`(`client_id`, `assignment_id`, `scope_id`, `phase_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `phases` ADD CONSTRAINT `phases_client_id_fkey`
  FOREIGN KEY (`client_id`) REFERENCES `clients_data`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `phases` ADD CONSTRAINT `phases_assignment_id_fkey`
  FOREIGN KEY (`assignment_id`) REFERENCES `client_assignments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `phases` ADD CONSTRAINT `phases_group_id_fkey`
  FOREIGN KEY (`group_id`) REFERENCES `phase_groups`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
-- NOTE: scope_id has NO foreign key. It is a bare INTEGER.
```

> **A row is:** one numbered stage of a plan — "Phase 2: Design". It is the only
> required level. `progress_percent` is **never written by any code** (§B1).
> The unique key includes two nullable columns, and in MySQL a unique index does
> not constrain NULLs — so with `assignment_id` or `scope_id` NULL, **phase numbers
> are not unique at all**. After you collapse to client-only, that key has to be
> rebuilt as `(project_id, phase_number)`.

```sql
-- phase_groups
CREATE TABLE `phase_groups` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `client_id` INTEGER NOT NULL,
    `scope_id` INTEGER NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `color` VARCHAR(191) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_by` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `phase_groups_client_id_idx`(`client_id`),
    INDEX `phase_groups_client_id_scope_id_idx`(`client_id`, `scope_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `phase_groups` ADD CONSTRAINT `phase_groups_client_id_fkey`
  FOREIGN KEY (`client_id`) REFERENCES `clients_data`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
-- NOTE: scope_id has NO foreign key.
```

> **A row is:** an optional coloured bucket a user drags phases into so the
> analytics page can group by it — "Strategic Objective 1". No uniqueness on name.

```sql
-- scope_milestones  ← this table holds WORK PACKAGES. The name is a lie.
CREATE TABLE `scope_milestones` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `phase_id` INTEGER NOT NULL,
    `milestone_number` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `status` ENUM('TODO', 'IN_PROGRESS', 'DONE', 'COMPLETED', 'BLOCKED', 'ON_HOLD', 'CANCELLED') NOT NULL DEFAULT 'TODO',
    `progress_percent` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `created_by` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `scope_milestones_phase_id_idx`(`phase_id`),
    UNIQUE INDEX `scope_milestones_phase_id_milestone_number_key`(`phase_id`, `milestone_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `scope_milestones` ADD CONSTRAINT `scope_milestones_phase_id_fkey`
  FOREIGN KEY (`phase_id`) REFERENCES `phases`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
```

> **A row is:** an optional middle grouping inside a phase — "WP 1.2: Technical
> Assessment". Renamed from Milestone to Work Package in Dec 2025; the table name
> and the `milestone_number` column were deliberately left alone
> (`schema.prisma:1790` — `@@map("scope_milestones") // Keep same table name for
> backward compatibility`). Rename both on the way in; you will never do it later.
> `progress_percent` is never written.

```sql
-- activities
CREATE TABLE `activities` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `milestone_id` INTEGER NULL,          -- ← FK to scope_milestones (work package)
    `phase_id` INTEGER NULL,              -- ← set instead, when there is no work package
    `activity_number` INTEGER NOT NULL,
    `display_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `deliverables` TEXT NULL,
    `deliverable_type` ENUM('TRANSITIONAL', 'FINAL') NULL,
    `duration_type` ENUM('WEEKS', 'DAYS') NOT NULL DEFAULT 'WEEKS',
    `duration` INTEGER NOT NULL DEFAULT 1,
    `planned_start_date` DATE NOT NULL,
    `planned_end_date` DATE NOT NULL,
    `actual_start_date` DATE NULL,
    `actual_end_date` DATE NULL,
    `last_done_at` DATETIME(3) NULL,
    `depends_on_activity_id` INTEGER NULL,
    `is_dependent` BOOLEAN NOT NULL DEFAULT false,
    `assigned_to_user_id` VARCHAR(191) NULL,
    `assigned_to_username` VARCHAR(191) NULL,
    `assigned_to_team_member_id` INTEGER NULL,
    `status` ENUM('TODO', 'IN_PROGRESS', 'DONE', 'COMPLETED', 'BLOCKED', 'ON_HOLD', 'CANCELLED') NOT NULL DEFAULT 'TODO',
    `progress` INTEGER NOT NULL DEFAULT 0,
    `is_milestone` BOOLEAN NOT NULL DEFAULT false,
    `is_billable` BOOLEAN NOT NULL DEFAULT false,
    `trigger_invoice` BOOLEAN NOT NULL DEFAULT false,
    `created_by` VARCHAR(191) NOT NULL,
    `created_by_username` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `activities_milestone_id_idx`(`milestone_id`),
    INDEX `activities_phase_id_idx`(`phase_id`),
    INDEX `activities_depends_on_activity_id_idx`(`depends_on_activity_id`),
    INDEX `activities_assigned_to_user_id_idx`(`assigned_to_user_id`),
    INDEX `activities_assigned_to_team_member_id_idx`(`assigned_to_team_member_id`),
    INDEX `activities_status_idx`(`status`),
    INDEX `activities_planned_start_date_idx`(`planned_start_date`),
    INDEX `activities_planned_end_date_idx`(`planned_end_date`),
    INDEX `activities_is_milestone_idx`(`is_milestone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `activities` ADD CONSTRAINT `activities_milestone_id_fkey`
  FOREIGN KEY (`milestone_id`) REFERENCES `scope_milestones`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `activities` ADD CONSTRAINT `activities_phase_id_fkey`
  FOREIGN KEY (`phase_id`) REFERENCES `phases`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `activities` ADD CONSTRAINT `activities_depends_on_activity_id_fkey`
  FOREIGN KEY (`depends_on_activity_id`) REFERENCES `activities`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `activities` ADD CONSTRAINT `activities_assigned_to_team_member_id_fkey`
  FOREIGN KEY (`assigned_to_team_member_id`) REFERENCES `client_team_members`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
-- NOTE: assigned_to_user_id has NO foreign key to users.
```

> **A row is:** the thing someone actually does — "Interview IT Department", with a
> duration, dates, an owner and a status. Both parent columns are nullable and
> **nothing enforces that exactly one is set** — no CHECK, no application guard I
> could find. An activity with both NULL is an orphan visible to nobody; with both
> set, `getScopeIdFromActivity` resolves `workPackage` first
> (`permissions.ts:782`) but `hierarchy/route.ts` would list it twice.
> Three columns describe the assignee (`user_id`, `username`, `team_member_id`) and
> they are kept in sync by hand.

```sql
-- sub_activities
CREATE TABLE `sub_activities` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `activity_id` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `weight` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('TODO', 'IN_PROGRESS', 'DONE') NOT NULL DEFAULT 'TODO',
    `created_by` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `sub_activities_activity_id_idx`(`activity_id`),
    INDEX `sub_activities_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `sub_activities` ADD CONSTRAINT `sub_activities_activity_id_fkey`
  FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
```

> **A row is:** a checklist line inside an activity whose ticking drives the
> activity's percentage. Note the narrower status enum — three values, not seven.
> `weight` has a different meaning depending on whether the *set* sums to 100 (§B1).

### A.2 What hangs off an activity

```sql
-- activity_collaborators
CREATE TABLE `activity_collaborators` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `activity_id` INTEGER NOT NULL,
    `user_id` VARCHAR(191) NULL,
    `username` VARCHAR(191) NOT NULL,
    `team_member_id` INTEGER NULL,
    `added_by` VARCHAR(191) NOT NULL,
    `added_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `activity_collaborators_activity_id_idx`(`activity_id`),
    INDEX `activity_collaborators_user_id_idx`(`user_id`),
    INDEX `activity_collaborators_team_member_id_idx`(`team_member_id`),
    UNIQUE INDEX `activity_collaborators_activity_id_user_id_key`(`activity_id`, `user_id`),
    UNIQUE INDEX `activity_collaborators_activity_id_team_member_id_key`(`activity_id`, `team_member_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `activity_collaborators` ADD CONSTRAINT `activity_collaborators_activity_id_fkey`
  FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `activity_collaborators` ADD CONSTRAINT `activity_collaborators_team_member_id_fkey`
  FOREIGN KEY (`team_member_id`) REFERENCES `client_team_members`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
-- NOTE: user_id has NO foreign key to users.
```

> **A row is:** a second person attached to an activity who is not its owner — they
> can read it and comment on it. Both unique keys are on nullable columns, so in
> MySQL the same person can be added twice if `user_id` is NULL both times.

```sql
-- activity_comments
CREATE TABLE `activity_comments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `activity_id` INTEGER NOT NULL,
    `content` TEXT NOT NULL,
    `author_id` VARCHAR(191) NOT NULL,
    `author_name` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `is_edited` BOOLEAN NOT NULL DEFAULT false,

    INDEX `activity_comments_activity_id_idx`(`activity_id`),
    INDEX `activity_comments_author_id_idx`(`author_id`),
    INDEX `activity_comments_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `activity_comments` ADD CONSTRAINT `activity_comments_activity_id_fkey`
  FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- comment_mentions
CREATE TABLE `comment_mentions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `comment_id` INTEGER NOT NULL,
    `mentioned_user_id` VARCHAR(191) NOT NULL,
    `mentioned_username` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `comment_mentions_comment_id_idx`(`comment_id`),
    INDEX `comment_mentions_mentioned_user_id_idx`(`mentioned_user_id`),
    UNIQUE INDEX `comment_mentions_comment_id_mentioned_user_id_key`(`comment_id`, `mentioned_user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `comment_mentions` ADD CONSTRAINT `comment_mentions_comment_id_fkey`
  FOREIGN KEY (`comment_id`) REFERENCES `activity_comments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
-- NOTE: mentioned_user_id has NO foreign key to users.

-- comment_reactions
CREATE TABLE `comment_reactions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `comment_id` INTEGER NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `emoji` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `comment_reactions_comment_id_idx`(`comment_id`),
    UNIQUE INDEX `comment_reactions_comment_id_user_id_emoji_key`(`comment_id`, `user_id`, `emoji`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `comment_reactions` ADD CONSTRAINT `comment_reactions_comment_id_fkey`
  FOREIGN KEY (`comment_id`) REFERENCES `activity_comments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
```

> **Comment:** one message in the thread on an activity, plain text with `@name`
> inside it. **Mention:** a resolved link from a comment to a person. **Reaction:**
> one emoji from one person on one comment.

```sql
-- activity_files
CREATE TABLE `activity_files` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `activity_id` INTEGER NOT NULL,
    `file_name` VARCHAR(191) NOT NULL,
    `file_url` TEXT NOT NULL,
    `file_type` VARCHAR(191) NULL,
    `file_size` INTEGER NULL,
    `description` TEXT NULL,
    `uploaded_by` VARCHAR(191) NOT NULL,
    `uploaded_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `activity_files_activity_id_idx`(`activity_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `activity_files` ADD CONSTRAINT `activity_files_activity_id_fkey`
  FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
```

> **A row is:** a named hyperlink someone pasted onto an activity. Nothing is
> stored. See §D.

```sql
-- activity_history
CREATE TABLE `activity_history` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `activity_id` INTEGER NOT NULL,
    `field_changed` VARCHAR(191) NOT NULL,
    `old_value` TEXT NULL,
    `new_value` TEXT NULL,
    `changed_by` VARCHAR(191) NOT NULL,
    `changed_by_username` VARCHAR(191) NOT NULL,
    `changed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `version` INTEGER NOT NULL DEFAULT 1,
    `source` VARCHAR(191) NULL,

    INDEX `activity_history_activity_id_idx`(`activity_id`),
    INDEX `activity_history_changed_at_idx`(`changed_at`),
    INDEX `activity_history_field_changed_idx`(`field_changed`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `activity_history` ADD CONSTRAINT `activity_history_activity_id_fkey`
  FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
```

> **A row is:** one field on one activity changed from X to Y by someone, tagged
> with *why* — `source` carries `auto:progress_started`, `auto:status_done`,
> `auto:status_completed`, `auto:reopen_cleared`, `manual:lead_adjustment`,
> `backfill:<date>`, or NULL for legacy rows. **The audit trail is deleted with the
> activity** (ON DELETE CASCADE). If the audit is meant to survive deletion, that
> has to change on the way in.

### A.3 Terminology, access, notification

```sql
-- scope_plan_terminology
CREATE TABLE `scope_plan_terminology` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `agreement_id` INTEGER NOT NULL,
    `scope_id` INTEGER NOT NULL,
    `term_phase` VARCHAR(191) NULL,
    `term_work_package` VARCHAR(191) NULL,
    `term_activity` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `scope_plan_terminology_agreement_id_idx`(`agreement_id`),
    INDEX `scope_plan_terminology_scope_id_idx`(`scope_id`),
    UNIQUE INDEX `scope_plan_terminology_agreement_id_scope_id_key`(`agreement_id`, `scope_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `scope_plan_terminology` ADD CONSTRAINT `scope_plan_terminology_agreement_id_fkey`
  FOREIGN KEY (`agreement_id`) REFERENCES `client_assignments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
-- NOTE: scope_id has NO foreign key.
```

> **A row is:** the three words this particular plan uses instead of Phase / WP /
> Activity. **NULL means "use the default"** — the writer nulls a value out when it
> equals the default (`terminology/route.ts:124-126`). Relevant to your decision 4:
> today the key is `(agreement, scope)`, i.e. **per plan, not per client**. Moving it
> to per-client is a widening — one client, one vocabulary. There is no
> `client_id` on this table at all; you would rebuild it.

```sql
-- client_team_members
CREATE TABLE `client_team_members` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `client_id` INTEGER NOT NULL,
    `userId` VARCHAR(191) NULL,
    `user_name` VARCHAR(191) NOT NULL,
    `external_name` VARCHAR(191) NULL,
    `is_non_user` BOOLEAN NOT NULL DEFAULT false,
    `team_role` ENUM('CLIENT_LEAD', 'SCOPE_LEAD', 'SENIOR_CONTRIBUTOR', 'CONTRIBUTOR', 'COLLABORATOR', 'VIEWER') NOT NULL DEFAULT 'CONTRIBUTOR',
    `role` VARCHAR(191) NULL,
    `added_by` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    INDEX `client_team_members_client_id_idx`(`client_id`),
    INDEX `client_team_members_userId_idx`(`userId`),
    INDEX `client_team_members_team_role_idx`(`team_role`),
    INDEX `client_team_members_is_non_user_idx`(`is_non_user`),
    UNIQUE INDEX `client_team_members_client_id_userId_key`(`client_id`, `userId`),
    UNIQUE INDEX `client_team_members_client_id_external_name_key`(`client_id`, `external_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `client_team_members` ADD CONSTRAINT `client_team_members_client_id_fkey`
  FOREIGN KEY (`client_id`) REFERENCES `clients_data`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `client_team_members` ADD CONSTRAINT `client_team_members_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
```

> **A row is:** one person's standing on one client — either a real user or, with
> `is_non_user = true`, a name with no login who can still be given work.
> Note `userId` is the one camelCase column in the whole plan schema.
> **This is the answer to "where is the role held": on the client.** See §C.

```sql
-- scope_lead_assignments
CREATE TABLE `scope_lead_assignments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `scope_id` INTEGER NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `assigned_by` VARCHAR(191) NOT NULL,
    `assigned_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `is_active` BOOLEAN NOT NULL DEFAULT true,

    INDEX `scope_lead_assignments_scope_id_idx`(`scope_id`),
    INDEX `scope_lead_assignments_user_id_idx`(`user_id`),
    UNIQUE INDEX `scope_lead_assignments_scope_id_user_id_key`(`scope_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- NOTE: NO foreign keys at all on this table.
```

> **A row is:** "this person leads this scope." **This table dies with scopes** —
> and with it the entire SCOPE_LEAD tier. See §C.

```sql
-- in_app_notifications
CREATE TABLE `in_app_notifications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` VARCHAR(191) NOT NULL,
    `type` ENUM('DAILY_REMINDER', 'TASK_REMINDER', 'MENTION', 'COMMENT', 'ASSIGNMENT', 'STATUS_CHANGE', 'TASK_DUE') NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `activity_id` INTEGER NULL,
    `task_id` INTEGER NULL,
    `comment_id` INTEGER NULL,
    `created_by_user_id` VARCHAR(191) NULL,
    `created_by_name` VARCHAR(191) NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT false,
    `read_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `in_app_notifications_user_id_idx`(`user_id`),
    INDEX `in_app_notifications_is_read_idx`(`is_read`),
    INDEX `in_app_notifications_created_at_idx`(`created_at`),
    INDEX `in_app_notifications_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- NOTE: NO foreign keys at all. activity_id is a dangling integer —
-- deleting an activity leaves notifications pointing at nothing.
```

### A.4 Enums, complete

```
ActivityStatus     : TODO | IN_PROGRESS | DONE | COMPLETED | BLOCKED | ON_HOLD | CANCELLED
SubActivityStatus  : TODO | IN_PROGRESS | DONE
DurationType       : WEEKS | DAYS
DeliverableType    : TRANSITIONAL | FINAL
ClientTeamRole     : CLIENT_LEAD | SCOPE_LEAD | SENIOR_CONTRIBUTOR | CONTRIBUTOR | COLLABORATOR | VIEWER
NotificationType   : DAILY_REMINDER | TASK_REMINDER | MENTION | COMMENT | ASSIGNMENT | STATUS_CHANGE | TASK_DUE
```

---

## §B. The rules, as code

First, a correction to the handover you were given, because it changes what you
should budget for.

> **`src/lib/scopeplan/` is 1,343 lines and 1,103 of them are dead.**
> `dateUtils.ts` (239), `dependencyUtils.ts` (346), `permissionUtils.ts` (512) and
> `index.ts` (6) are **imported by zero files**. Verified:
> ```
> dateUtils       : imported by 0 files
> dependencyUtils : imported by 0 files
> permissionUtils : imported by 0 files
> index           : imported by 0 files
> phaseGroupColors: imported by 1 file
> activityDates   : imported by 6 files
> ```
> The live rule engine is `activityDates.ts` (217 lines) plus logic inlined in the
> route handlers. Anything a previous reader described from `permissionUtils.ts` or
> `dateUtils.ts` describes code that does not run.

### B1. Roll-up — how a parent's percentage comes from its children

**Answer: it doesn't. There is no roll-up above the activity.**

`phases.progress_percent` and `scope_milestones.progress_percent` exist as
`DECIMAL(5,2) NOT NULL DEFAULT 0` and **are never written by any ScopePlan code
path**. Grep for `progressPercent` across `src/` returns hits only in type
definitions and in the *old* MilestoneCluster UI (`components/clients/`), never in
a `create`/`update`. The ScopePlan UI never displays a phase or work-package
percentage — the only figure rendered is one plan-level number at
`src/app/clients/[clientId]/scopeplan/page.tsx:2795`.

There are exactly two computations:

**(a) Activity ← sub-activities.** By weight if the set sums to 100, otherwise by
count. Not by duration, not by effort.

`src/types/scopeplan.ts:345-374`
```ts
export function calculateProgressFromSubActivities(subActivities: SubActivity[]): number {
  if (subActivities.length === 0) return 0;

  const hasDone = subActivities.some(sa => sa.status === 'DONE');
  const hasInProgress = subActivities.some(sa => sa.status === 'IN_PROGRESS');

  // Floor: at least one IN_PROGRESS but none DONE -> 10%
  if (!hasDone && hasInProgress) {
    return 10;
  }

  // All TODO -> 0%
  if (!hasDone) {
    return 0;
  }

  const totalWeight = subActivities.reduce((sum, sa) => sum + (sa.weight || 0), 0);

  if (totalWeight === 100) {
    // Weighted progress: sum of weights of DONE sub-activities
    const doneWeight = subActivities
      .filter(sa => sa.status === 'DONE')
      .reduce((sum, sa) => sum + (sa.weight || 0), 0);
    return Math.round(doneWeight);
  }

  // Fallback: equal weight (backward compatible for subtasks without weights configured)
  const completedCount = subActivities.filter(sa => sa.status === 'DONE').length;
  return Math.round((completedCount * 100) / subActivities.length);
}
```

- **Reads:** the sub-activity list. **Writes:** nothing — the caller writes
  `activities.progress`.
- **Called from:** `sub-activities/route.ts:149`, `sub-activities/[subId]/route.ts:106`
  and `:271`. **Server only.**
- **A parent with no children reads 0** (line 346) — but see the floor rule in B2,
  which is what actually sets progress for a childless activity.
- The schema comment on `sub_activities.weight` says *"all subtasks must sum to
  100"*. **Nothing enforces that.** The only validation is
  `weight: z.number().int().min(0).max(100).optional()`
  (`sub-activities/route.ts:19`). A set summing to 90 silently falls through to
  equal weighting, which is a different answer.

**(b) Plan ← activities.** A flat count, ignoring the tree entirely.

`src/app/api/scopeplan/hierarchy/route.ts:365-367`
```ts
        overallProgress: totalActivities > 0
          ? Math.round((completedActivities / totalActivities) * 100)
          : 0,
```
where `completedActivities` counts `status === 'DONE' || status === 'COMPLETED'`
(`:312`, `:321`). An activity at 99% counts as zero. `activities.progress` plays no
part in the plan figure.

### B2. Done vs Completed

**Who sets what.** `DONE` needs `canWorkOnActivity`. `COMPLETED` needs
`canManageActivity` — an explicit second gate:

`src/app/api/scopeplan/activities/[id]/route.ts:370-383`
```ts
    // Only CLIENT_LEAD / SCOPE_LEAD can set COMPLETED status
    if (validatedData.status === 'COMPLETED') {
      const canManage = await canManageActivity(
        session.user.id,
        activityId,
        session.user.modulePermissions?.['scope_plan']
      );

      if (!canManage) {
        return NextResponse.json(
          { error: 'Only Scope Leads and Client Leads can mark activities as Completed' },
          { status: 403 }
        );
      }
    }
```
**Server only.** This gate exists in this one handler. `bulk-create/route.ts:53`
accepts `COMPLETED` in its activity schema with no equivalent check — though that
whole route already requires `canManageScope`, so the effective audience matches
(but see the hole in §I-1).

**What else changes.** Everything date-shaped runs through one function:

`src/lib/scopeplan/activityDates.ts:69-135`
```ts
export function resolveActualDates(
  existing: ExistingActivityState,
  next: NextActivityState,
  now: Date = new Date()
): { updates: ResolvedDateChanges; logs: DateChangeLog[] } {
  const updates: ResolvedDateChanges = {};
  const logs: DateChangeLog[] = [];

  // Rule 1: actualStartDate — updated on every progress 0 -> >0 transition
  if (existing.progress === 0 && next.progress !== undefined && next.progress > 0) {
    updates.actualStartDate = now;
    logs.push({ field: 'actualStartDate', oldValue: existing.actualStartDate,
                newValue: now, source: 'auto:progress_started' });
  }

  // Rule 2: lastDoneAt — updated on every transition TO DONE
  if (next.status === 'DONE' && existing.status !== 'DONE') {
    updates.lastDoneAt = now;
    logs.push({ field: 'lastDoneAt', oldValue: existing.lastDoneAt,
                newValue: now, source: 'auto:status_done' });
  }

  // Rule 3: actualEndDate — set only on transition TO COMPLETED
  if (next.status === 'COMPLETED' && existing.status !== 'COMPLETED' && !existing.actualEndDate) {
    updates.actualEndDate = now;
    logs.push({ field: 'actualEndDate', oldValue: existing.actualEndDate,
                newValue: now, source: 'auto:status_completed' });
  }

  // Rule 4: Reopen — clear actualEndDate when status leaves COMPLETED
  if (existing.status === 'COMPLETED' && next.status !== undefined &&
      next.status !== 'COMPLETED' && existing.actualEndDate) {
    updates.actualEndDate = null;
    logs.push({ field: 'actualEndDate', oldValue: existing.actualEndDate,
                newValue: null, source: 'auto:reopen_cleared' });
  }

  return { updates, logs };
}
```

**Can it be un-set?** Yes — Rule 4. Any status change away from COMPLETED clears
`actual_end_date`. **There is no guard on who may reopen** beyond the ordinary
`canWorkOnActivity` — so a CONTRIBUTOR assigned to the activity can move it
COMPLETED → IN_PROGRESS and wipe the lead's sign-off date. `last_done_at`
survives, so the record isn't lost.

The lead's manual override of the end date is bounded:

`src/lib/scopeplan/activityDates.ts:168-195`
```ts
export function validateActualEndDate(
  proposed: Date, lastDoneAt: Date, plannedEndDate: Date
): { valid: boolean; error?: string } {
  const p = stripTime(proposed);
  const ldone = stripTime(lastDoneAt);
  const pEnd = stripTime(plannedEndDate);

  if (p.getTime() < ldone.getTime()) {
    return { valid: false,
      error: 'Actual end date cannot be before the activity was marked DONE' };
  }

  const workWasOnTime = ldone.getTime() <= pEnd.getTime();
  if (workWasOnTime && p.getTime() > pEnd.getTime()) {
    return { valid: false,
      error: 'Work was completed on time — actual end date cannot exceed the planned end date' };
  }

  return { valid: true };
}
```
Called at `activities/[id]/route.ts:705`. `getActualEndDateRange` (same file,
:201-213) returns the same bounds as `{min, max}` so the picker can be configured —
consumed by `pending-completions/route.ts:15`. **Both server; the range is fed to
the screen, so the screen shows the bound but the server is what refuses.**

**The progress floor**, which is the other half of "what else changes":

`src/lib/scopeplan/activityDates.ts:144-155`
```ts
export function applyProgressFloorForStatus(
  currentProgress: number,
  nextStatus: ActivityStatus | undefined
): number | undefined {
  if (nextStatus === 'IN_PROGRESS' && currentProgress === 0) {
    return 10;
  }
  if (nextStatus === 'DONE') {
    return 100;
  }
  return undefined; // no change
}
```
Applied only when the activity has **no** sub-activities
(`activities/[id]/route.ts:583-601`); with sub-activities, DONE still forces 100
(`:606-618`, comment: *"Preserve legacy behavior"*).

**Divergence worth knowing.** The screen applies two rules the server does not:

`src/app/clients/[clientId]/scopeplan/page.tsx:1677-1690`
```ts
      if (!hasSubActivities) {
        // Auto-set progress to 10% when status changes to IN_PROGRESS and current progress is 0
        if (newStatus === 'IN_PROGRESS' && currentProgress === 0) {
          updateData.progress = 10;
        }
        // Auto-set progress to 100% when status changes to DONE or COMPLETED
        if (newStatus === 'DONE' || newStatus === 'COMPLETED') {
          updateData.progress = 100;
        }
        // Reset progress to 0 when status changes to TODO
        if (newStatus === 'TODO') {
          updateData.progress = 0;
        }
      }
```
`COMPLETED → 100` and `TODO → 0` exist **only here**. Any other caller — the
importer, a script, a second front end — leaves progress where it was. Fold both
into the server.

### B3. Dates

**Planned.** Derived from a start date plus a duration. Week-based durations snap
the start to **Sunday** and end on **Saturday**.

There are three live implementations of this and they do not agree. The server one:

`src/app/api/scopeplan/activities/[id]/route.ts:98-108`
```ts
function calculateEndDate(startDate: Date, duration: number, durationType: 'WEEKS' | 'DAYS'): Date {
  const endDate = new Date(startDate);
  if (durationType === 'WEEKS') {
    // End date is Saturday: Sunday + (weeks * 7) - 1
    endDate.setDate(endDate.getDate() + (duration * 7) - 1);
  } else {
    // End date: start + duration - 1
    endDate.setDate(endDate.getDate() + duration - 1);
  }
  return endDate;
}
```
**It does not snap to Sunday** — it assumes the caller already did. The two client
copies do snap:

`src/components/scopeplan/utils.ts:36-50` and
`src/app/clients/[clientId]/scopeplan/utils.ts:28-42` (byte-for-byte the same body)
```ts
export function calculateEndDate(startDate: string, duration: number, durationType: 'WEEKS' | 'DAYS'): string {
  const start = parseLocalDate(startDate);

  if (durationType === 'WEEKS') {
    const sunday = getSundayOfWeek(start);
    const endDate = new Date(sunday);
    // End date is Saturday: Sunday + (weeks * 7) - 1
    endDate.setDate(endDate.getDate() + (duration * 7) - 1);
    return formatDateString(endDate);
  } else {
    const endDate = new Date(start);
    endDate.setDate(endDate.getDate() + duration - 1);
    return formatDateString(endDate);
  }
}
```
A fourth copy in `src/lib/scopeplan/dateUtils.ts:41-64` snaps *and* sets
`23:59:59.999` — and is dead.

**Working-day arithmetic: none.** No holiday calendar, no weekend skipping, no
business-day count anywhere in the module. A 2-week activity is 14 calendar days.
(ClientPlus has a `public_holidays` table and a working-day engine in
`src/utils/dealCalculations.ts`, but **ScopePlan does not touch it** — verified.)
The Sunday–Saturday week is the only nod to a calendar, and it is hard-coded, not
configurable.

**Child running past its parent's end: nothing happens.** I looked specifically
for this. There is no comparison of an activity's dates against its work package,
its phase, or the agreement. Phases and work packages **have no date columns at
all** — look at the DDL in §A.1. So the question cannot be asked in this schema:
a parent has no end date to run past. Not refused, not allowed, not moved —
**unrepresentable**. If SMP wants phase dates, that is new.

Likewise nothing checks an activity against the agreement's `start_date` /
`expected_end_date`. The Excel AI prompt *asks* for it in prose — *"Stay within
project timeline from Context sheet"* — and that is the entire enforcement.

**Timezone.** Every date function uses local-time accessors (`getDay()`,
`setDate()`, `setHours()`), while `parseExcelDate` and several history log lines
use `toISOString()`, which is UTC. The repo's own bug tracker already records this
class of defect in the sibling module (`docs/bugs.md` BUG-001: *"`isWeekend(date)`
calls `date.getDay()` which evaluates in the server local timezone"*). **I could
not verify whether it actually misbehaves here without a running server**, but the
same pattern is present: `getSundayOfWeek` uses `getDay()`, and
`formatDateForApi`/`parseExcelDate` use `toISOString()`.

### B4. Dependencies

**Model:** one column, `activities.depends_on_activity_id`, self-referential,
`ON DELETE SET NULL`. Strictly finish-to-start, single predecessor, no lag.
`is_dependent` is a denormalised boolean kept in sync by hand
(`activities/[id]/route.ts:447-450`).

**What is enforced:**

1. **Cascade on date change** — automatic, not optional, whenever `plannedEndDate`
   is sent to `PUT`:

`src/app/api/scopeplan/activities/[id]/route.ts:792-826`
```ts
    // CASCADE UPDATE: If plannedEndDate changed, update all dependent activities
    let cascadeUpdatedCount = 0;
    if (validatedData.plannedEndDate !== undefined) {
      const oldEndDate = parseLocalDate(existingActivity.plannedEndDate);
      const newEndDate = parseLocalDate(validatedData.plannedEndDate);

      if (formatDateString(oldEndDate) !== formatDateString(newEndDate)) {
        const dependentActivities = await getAllDependentActivities(db, activityId);

        const updatedEndDates = new Map<number, Date>();
        updatedEndDates.set(activityId, newEndDate);

        for (const depActivity of dependentActivities) {
          const parentNewEndDate = updatedEndDates.get(depActivity.dependsOnActivityId) || newEndDate;
          const durationType = (depActivity.durationType || 'DAYS') as 'WEEKS' | 'DAYS';
          const duration = depActivity.duration || 1;
          const newStartDate = calculateDependentStartDate(parentNewEndDate, durationType);
          const newEndDateForDep = calculateEndDate(newStartDate, duration, durationType);
          updatedEndDates.set(depActivity.id, newEndDateForDep);
```
   with the successor start rule at `:78-93`:
```ts
function calculateDependentStartDate(parentEndDate: Date, durationType: 'WEEKS' | 'DAYS'): Date {
  const dayAfterParent = new Date(parentEndDate);
  dayAfterParent.setDate(dayAfterParent.getDate() + 1);

  if (durationType === 'WEEKS') {
    let sunday = getSundayOfWeek(dayAfterParent);
    if (sunday <= parentEndDate) {
      sunday.setDate(sunday.getDate() + 7);
    }
    return sunday;
  } else {
    return dayAfterParent;
  }
}
```

2. **Preview before commit** — `POST /api/scopeplan/cascade-preview`, gated at
   `cascade-preview/route.ts:44-50` on `canManageScope`. **Server**, rendered by
   `components/scopeplan/CascadeWarningDialog.tsx`.

3. **Delete is blocked or explicit** — three modes at
   `activities/[id]/route.ts:995-1035`: `single` returns **409** listing the
   dependents; `cascade` deletes the whole chain; `unlink` nulls the links.

**What is not enforced — and I looked hard:**

- **No cycle check.** `dependsOnActivityId` is written straight through
  (`:446-449`) after `z.number().nullable().optional()` validation and nothing
  else. A → B → A is accepted. The traversal survives it only because
  `getAllDependentActivities` carries a `visited` Set (`:112-114`), so you get a
  silently truncated cascade rather than a hang.
- **No same-plan check.** Nothing verifies the predecessor belongs to the same
  phase, plan, or even the same client. You can point an activity at another
  client's activity, and the cascade will then reach across and rewrite dates
  there. **This is a real cross-tenant edge in SMP terms.**
- **No temporal check.** Nothing stops a successor's `planned_start_date` from
  preceding its predecessor's `planned_end_date` when dates are set directly.
  The relationship is only honoured at the moment of cascade.

### B5. Status values and allowed transitions

The literal enumeration, from `prisma/schema.prisma:1519-1528`:

```prisma
enum ActivityStatus {
  TODO // To Do
  IN_PROGRESS // In Progress
  DONE // Done
  COMPLETED // Completed (set by Scope Lead / Client Lead only)
  BLOCKED // Blocked
  ON_HOLD // On Hold
  CANCELLED // Cancelled
}
```

**Allowed transitions: all of them.** There is no state machine. I grepped for
`ALLOWED_TRANSITIONS`, `canTransition`, `transitionTo`, `validTransitions` across
`src/` — **zero hits**. The only constraints on a status change are:

| Guard | Where | Server/screen |
|---|---|---|
| must pass `canWorkOnActivity` | `activities/[id]/route.ts:330-337` | server |
| `COMPLETED` additionally needs `canManageActivity` | `activities/[id]/route.ts:370-383` | server |
| value must be in the enum | `updateActivitySchema`, `:43` | server (zod) |

So `CANCELLED → DONE`, `COMPLETED → TODO`, `DONE → BLOCKED` are all accepted. Phase
and work-package status carry the same 7-value enum and have no guard beyond
`canManageScope` — and note `bulk-create`'s phase/WP schemas omit `COMPLETED`
(`bulk-create/route.ts:24`, `:33`) while the activity schema includes it. Harmless
today, but it means the phase enum is effectively 6 values through that door and 7
through the other.

### B6. Auto-renumbering

`src/utils/scopeplan-numbering.ts` (502 lines) generates display IDs and renumbers
siblings:

`src/utils/scopeplan-numbering.ts:26-33`
```ts
export function generateActivityDisplayId(
  phaseNumber: number,
  workPackageNumber: number | null,
  activityNumber: number
): string {
  if (workPackageNumber !== null) {
    return `${phaseNumber}.${workPackageNumber}.${activityNumber}`;
  }
  return `${phaseNumber}.${activityNumber}`;
}
```

**Called from exactly one place:** `src/hooks/useScopePlanDraft.ts:36`. That is the
Planning Mode draft hook. **This runs on the screen only, against in-memory drafts.**

Consequently: deleting an activity through the ordinary `DELETE` route does **not**
renumber its siblings (read `activities/[id]/route.ts:1035-1042` — it deletes and
returns). Same for a phase (`phases/[id]/route.ts:330-333`). So an ordinary delete
leaves `1.1, 1.3, 1.4` and a stale `display_id` on every sibling. Only a Planning
Mode save cleans it up. `phase_number` is **supplied by the client**
(`phases/route.ts:19`, `:247`) — the server never computes it.

### B7. Planning Mode (draft-and-commit)

State lives in the browser: `src/hooks/useScopePlanDraft.ts` (1,040 lines) keeps a
`PlanningModeState` of phases/WPs/activities each tagged `'new' | 'modified' |
'deleted'` with a `tempId`, auto-saves to **localStorage** under a key derived from
`(clientId, assignmentId, scopeId)`:

`src/hooks/useScopePlanDraft.ts:172-194`
```ts
  const saveDraftToStorage = useCallback(() => {
    if (!planningState.isActive || planningState.phases.length === 0) {
      return;
    }
    try {
      const draft: StoredDraft = {
        clientId, assignmentId, scopeId,
        phases: planningState.phases,
        savedAt: new Date().toISOString(),
        version: DRAFT_STORAGE_VERSION,
      };
      localStorage.setItem(storageKey, JSON.stringify(draft));
```

Commit is one POST to `/api/scopeplan/bulk-create`
(`useScopePlanDraft.ts:792`), which runs the whole batch in one
`db.$transaction`. Recovery on reload is `DraftRecoveryDialog.tsx`.

**Screen-side only** for the draft itself — nothing is persisted server-side until
Save All. Two consequences for a port: the draft is lost if the user switches
browsers, and the localStorage key embeds the agreement and scope you are
removing.

### B8. Per-plan terminology

`src/app/api/clients/[clientId]/scopes/[id]/terminology/route.ts:5-9`
```ts
const DEFAULT_TERMINOLOGY = {
  phase: 'Phase',
  workPackage: 'WP',
  activity: 'Activity'
};
```
Write path (`:111-133`), and this one matters:
```ts
    const canEdit = hasMinimumLevel(getModuleLevel(user.modulePermissions, 'clients'), 'EDIT');

    if (!canEdit) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
```
- Gated on a **global** `clients` module level, **not** on any relationship to this
  client. The `clientId` path parameter is parsed out of `params` and then **never
  used** in the handler. Anyone with EDIT on `clients` can rewrite the vocabulary of
  any plan in the system. **Server.** (Low blast radius — it renames three labels —
  but it is a genuine missing ownership check.)
- Storage normalises a value equal to the default back to NULL (`:124-126`).

### B9. The Excel round trip

See §G — it is large enough to want its own section.

---

## §C. The six roles, at every enforcement point

### C.1 Where a role is held

**On the client.** `client_team_members(client_id, userId, team_role)` — one row per
person per client. There is no per-plan role and no per-activity role.

**Can one person hold different roles on two plans?** **No — not within a client.**
Two plans under the same client share one `client_team_members` row, so the role is
identical on both. Across *different clients*, yes, freely.

The exception is SCOPE_LEAD, and it is the awkward one: the role sits on the client
row, but *which* scopes it applies to sits in `scope_lead_assignments(scope_id,
user_id)`. So SCOPE_LEAD is the only role that is effectively per-plan today — and
it is the one whose anchor table you are deleting.

**Two ways to be CLIENT_LEAD without a team-member row at all:**

`src/lib/clients/permissions.ts:228-241`
```ts
  // CONTROL level: Full access as CLIENT_LEAD
  if (hasMinimumLevel(validatedLevel, 'CONTROL')) {
    ...
    return { allowed: true, teamRole: 'CLIENT_LEAD' };
  }
```
`src/lib/clients/permissions.ts:249-278`
```ts
    if (hasMinimumLevel(validatedLevel, 'EDIT')) {
      const client = await db.clientData.findUnique({
        where: { id: clientId },
        select: {
          leadConsultant: true,
          subdomains: {
            where: { leadConsultant: { not: null } },
            select: { leadConsultant: true }
          }
        }
      });

      if (client) {
        const isClientLead = client.leadConsultant === user.username;
        const isSubdomainLead = client.subdomains.some(sd => sd.leadConsultant === user.username);

        if (isClientLead || isSubdomainLead) {
          ...
          return { allowed: true, teamRole: 'CLIENT_LEAD' };
        }
      }
```
That is a **username string match against two columns you are deleting**. Both
grants vanish with `subdomains`; the `clients_data.lead_consultant` one should
probably come back as a real grant on the project.

Also note the fail-closed entry (`permissions.ts:186-203`): `validateModuleLevel`
returns `undefined` for anything not in `NONE|VIEW|EDIT|CONTROL`, and
`canAccessClient` then denies. This matters because 53 of the module's 92 type
errors are exactly `ModulePermissionLevel | undefined` being passed here (§H) —
**the types are wrong, the behaviour is right.**

### C.2 The vocabulary is declared twice and only one copy runs

`src/lib/clients/permissions.ts:52-88` defines `ROLE_PERMISSIONS`, an eight-verb
matrix per role. **It is never read.** Nor are these, all exported, all with zero
external callers (verified by grep):

```
hasClientPermission   : 0 external uses
roleHasPermission     : 0 external uses
getRolePermissions    : 0 external uses
requireClientRole     : 0 external uses
requireClientPermission: 0 external uses
isRoleAtLeast         : 0 external uses
compareRoles          : 0 external uses
getEffectiveRole      : 0 external uses
getClientPermissions  : 0 external uses
ROLE_PERMISSIONS      : 0 external uses
```
(`ROLE_HIERARCHY`, `ROLE_LABELS`, `ROLE_DESCRIPTIONS` *are* used — by the team
management UI, for sorting and display.)

**Do not map the collapse against `ROLE_PERMISSIONS`. It is decoration.** The real
rules are four hardcoded if-chains, below.

### C.3 Every branch — SERVER

All in `src/lib/clients/permissions.ts` unless stated. "→" is what the branch returns.

**`canManageScope` (:655-684)** — guards: phase create/update/delete, WP
create/update/delete, activity delete, Excel import, cascade-preview, bulk-create.
```
:673  CLIENT_LEAD                → true
:678  SCOPE_LEAD                 → isScopeLead(userId, scopeId)
:683  everything else            → false
```

**`getManageableScopeIds` (:694-722)** — feeds the UI permission bundle.
```
:711  CLIENT_LEAD                → 'all'
:716  SCOPE_LEAD                 → getUserScopeLeadAssignments(userId)
:721  everything else            → []
```

**`canManageActivity` (:791-812)** — guards the 15 structural fields and COMPLETED.
```
:804  CLIENT_LEAD                → true
:806  SCOPE_LEAD + isScopeLead   → true
:811  everything else            → false
```
The structural field list it guards, `activities/[id]/route.ts:345-351`:
```ts
    const STRUCTURAL_FIELDS = [
      'name', 'description', 'deliverables', 'deliverableType',
      'durationType', 'duration', 'plannedStartDate', 'plannedEndDate',
      'actualStartDate', 'actualEndDate', 'dependsOnActivityId',
      'assignedToUserId', 'assignedToUsername', 'isMilestone', 'isBillable',
      'triggerInvoice',
    ];
```

**`canWorkOnActivity` (:827-877)** — guards activity PUT, sub-activity write, file
POST/DELETE.
```
:848  CLIENT_LEAD                → true
:853  SCOPE_LEAD + isScopeLead   → true
:861  SENIOR_CONTRIBUTOR         → isActivityAssignee(...)
:866  CONTRIBUTOR                → isActivityAssignee(...)
:871  COLLABORATOR               → isActivityAssignee(...)      ← see below
:876  VIEWER                     → false
```
> **The code contradicts its own docstring.** Line 820 says *"COLLABORATOR/VIEWER:
> cannot work on activities"*. Line 871-873 lets a COLLABORATOR work on anything
> they are assigned to. The code wins.

**`canCommentOnActivity` (:892-946)** — guards comment GET/POST and file GET.
```
:913  CLIENT_LEAD                → true
:918  SCOPE_LEAD + isScopeLead   → true
:926  SENIOR_CONTRIBUTOR         → isActivityAssignee(...)
:931  CONTRIBUTOR                → isActivityAssignee(...)
:936  COLLABORATOR               → isActivityCollaborator(...)
:941  VIEWER                     → true                          ← see below
```
> **Second contradiction.** Line 885 says *"VIEWER: cannot comment"*; the matrix at
> :86 gives VIEWER only `['view']`; line 941-943 returns `true`. **A VIEWER can post
> comments.** Three sources, two of them wrong. The code wins.

**`getActivityPermissionLevel` (:962-1026)** — returns `full|work|comment|view|none`.
**One external caller.** Branches at :983, :988, :998, :1007, :1016. Its SCOPE_LEAD
arm returns `'view'` for scopes they don't lead (:994) — a fifth distinct outcome
that does not appear in any other function.

**`buildVisibilityContext` (`visibility.ts:87-175`)** — what rows you can see.
```
:98   CLIENT_LEAD | VIEWER | SENIOR_CONTRIBUTOR → visibleScopeIds:'all', activityFilter:null
:112  SCOPE_LEAD   → scopeIds from scope_lead_assignments, activityFilter:null
:127  CONTRIBUTOR  → getContributorVisibility: assigned OR collaborating
:145  COLLABORATOR → getCollaboratorVisibility: tagged only
:162  fallback     → no access
```

**`isActivityVisible` (`visibility.ts:460-502`)** — single-row check.
```
:470  CLIENT_LEAD | VIEWER | SENIOR_CONTRIBUTOR → true
:475  SCOPE_LEAD   → activity's scopeId ∈ visibleScopeIds
:486  CONTRIBUTOR  → assigned OR collaborator
:494  COLLABORATOR → assigned OR collaborator   ← note: same as CONTRIBUTOR here,
                                                   unlike buildVisibilityContext
:501  else         → false
```
> **Third inconsistency.** `getCollaboratorVisibility` builds a filter of *tagged
> only* (header comment at :311-312: *"NOT activities they are assigned to"*), but
> `isActivityVisible` gives COLLABORATOR **assigned OR tagged** (:494-498, with an
> apologetic inline comment). A list and a detail page disagree about the same row.

**`buildPhaseFilter` (`visibility.ts:410-425`)**, **`buildActivityFilter`
(:434-450)**, **`filterTeamMembers` (:607-...)** branch at :619-622, :628, :689-690,
:695, :699-700, and `canLogTimeToScope` at :777.

**Route-level `teamRole` literals (all server):**
```
scopeplan/phases/route.ts:236              !== 'CLIENT_LEAD' → 403     (phase create when scopeId null)
scopeplan/phases/[id]/route.ts:212, :318   !== 'CLIENT_LEAD' → 403     (phase update/delete, scopeId null)
scopeplan/phase-groups/route.ts:143        !== 'CLIENT_LEAD' → 403     (group create)
scopeplan/phase-groups/[id]/route.ts:55    !== 'CLIENT_LEAD' → 403     (group update/delete)
scopeplan/phase-groups/[id]/members/route.ts:73  !== 'CLIENT_LEAD' → 403 (assign phases to group)
scopeplan/phase-groups/reorder/route.ts:54 !== 'CLIENT_LEAD' → 403     (reorder groups)
scopeplan/activities/[id]/route.ts:989     !== 'CLIENT_LEAD' → 403     (delete when scopeId null)
scopeplan/activities/route.ts:391          === 'CLIENT_LEAD' → may create a new non-user assignee
scopeplan/activities/[id]/route.ts:467     === 'CLIENT_LEAD' → same
scopeplan/activities/[id]/collaborators/route.ts:158 === 'CLIENT_LEAD' → same
scopeplan/hierarchy/route.ts:281-283       CONTRIBUTOR|COLLABORATOR|(SCOPE_LEAD & partial) → hasRestrictedView banner
clients/[clientId]/permissions/route.ts:85-107  six is* booleans + canCreatePhases/canCreateActivities
clients/[clientId]/team-members/route.ts:169    !== 'CLIENT_LEAD' → 403 (add team member)
clients/[clientId]/team-members/[id]/route.ts:134 isNonUser && role !== 'VIEWER' → refuse
clients/[clientId]/scopes/[id]/leads/route.ts:88, :200  !== 'CLIENT_LEAD' → 403 (grant/revoke scope lead)
clients/[clientId]/scopes/[id]/leads/route.ts:152  writes teamRole:'SCOPE_LEAD' onto the member row
```

> **Note the three `CLIENT_LEAD` lines using the wrong module key.** `activities/route.ts:389`,
> `activities/[id]/route.ts:465` and `collaborators/route.ts:156` pass
> `modulePermissions?.['clients']`; the other 48 checks in the module pass
> `['scope_plan']`. So whether you may invent a non-user assignee is decided by a
> *different* module permission than everything else in the same handler.

**Non-user members are pinned to VIEWER** — `teamMembers.ts:66-88`:
```ts
export async function createNonUserTeamMember(params: {...}): Promise<ClientTeamMember> {
  ...
  return prisma.clientTeamMember.create({
    data: {
      clientId: params.clientId,
      userId: null,
      userName: trimmed,
      externalName: trimmed,
      isNonUser: true,
      teamRole: 'VIEWER',
      ...
```
Harmless (they cannot log in) but it means `team_role` on a non-user row is noise,
and VIEWER is the see-everything tier.

### C.4 Every branch — SCREEN

`src/lib/hooks/useClientVisibility.ts:60-154`. **This is advisory only** — the
server re-checks everything. But it decides which buttons exist.

```
:75   CLIENT_LEAD        → canCreate T, canEdit T, canDelete T, isReadOnly F
:87   VIEWER             → canCreate F, canEdit F, canDelete F, isReadOnly T
:99   SCOPE_LEAD         → canCreate T, canEdit T, canDelete T, isReadOnly F   (not scope-aware here)
:111  SENIOR_CONTRIBUTOR → canCreate F, canEdit T, canDelete F, isReadOnly F
:123  CONTRIBUTOR        → canCreate F, canEdit T, canDelete F, isReadOnly F
:135  COLLABORATOR       → canCreate F, canEdit F, canDelete F, isReadOnly T
:147  fallback           → all F, isReadOnly T
```
and, ahead of all of them:

`src/lib/hooks/useClientVisibility.ts:60-70`
```ts
    // Default: no context means full access (fallback for backward compatibility)
    if (!visibilityContext || !visibilityContext.teamRole) {
      return {
        teamRole: null,
        hasRestrictedView: false,
        canCreate: true,
        canEdit: true,
        canDelete: true,
        isReadOnly: false,
      };
    }
```
> **The screen fails OPEN.** A slow or failed permissions fetch renders the full
> editing UI. Server-side it all 403s, so this is a UX defect rather than a breach —
> but it is the opposite convention to the server's fail-closed
> `validateModuleLevel`, and it is the kind of thing that gets copied.

Also screen-side: `src/components/scopeplan/ScopePlanContext.tsx:125-135` defines
its own `canCreateActivity` / `canEditActivity`, and
`src/app/clients/[clientId]/scopeplan/ScopePlanHeader.tsx:160-162, :202-220` renders
role-named banners ("Assigned Activities Only", "Collaborator View", "Managed
Scopes Only").

### C.5 The collapse to Lead / Contributor / Viewer — branches that don't map

Taking Lead = manage, Contributor = work on own, Viewer = read:

| Role | Maps to | Clean? |
|---|---|---|
| CLIENT_LEAD | **Lead** | Yes. |
| SCOPE_LEAD | **Lead** | Only if you accept that Lead is now plan-wide. Every SCOPE_LEAD branch is `teamRole === 'SCOPE_LEAD' && isScopeLead(userId, scopeId)` — the scope narrowing dies with `scope_lead_assignments`. Anyone who was Lead of *one* scope becomes Lead of *everything*. **This is the widening to check.** |
| CONTRIBUTOR | **Contributor** | Yes. |
| SENIOR_CONTRIBUTOR | **Contributor** | Loses one real distinction: SENIOR_CONTRIBUTOR sees the *whole* plan (`visibility.ts:98`) while CONTRIBUTOR sees only their own rows (`:127`). Both can only work on assigned rows. If Contributor sees everything, SENIOR_CONTRIBUTOR is free and CONTRIBUTOR gains visibility. If Contributor sees only its own, SENIOR_CONTRIBUTOR's plan-wide view is lost. **You must pick; the two-role split exists precisely because someone wanted both.** |
| COLLABORATOR | **Contributor**? **Viewer**? | **This is the branch I cannot map.** It is neither: it can *comment* on tagged rows (`:936`), can *work on* assigned rows (`:871`), cannot *see* untagged rows (`:145`), but on a single-row fetch can see assigned ones too (`:494`). Under Viewer it loses the ability to work and comment; under Contributor it gains sight of the whole plan. **Flagging as a finding, as asked.** |
| VIEWER | **Viewer** | Almost — except VIEWER **can comment** (`:941`). If your Viewer is read-only, that capability disappears; if you keep it, Viewer is not read-only. Decide deliberately, because the docstring and the dead matrix both say the opposite of the code. |

Three further branches with nowhere obvious to go:

1. **`getActivityPermissionLevel`'s `'view'` for a SCOPE_LEAD outside their scopes**
   (`:994`) — a Lead who is a Viewer on part of the plan. Gone with scopes.
2. **The `scopeId == null` fallbacks** (`phases/route.ts:236`,
   `activities/[id]/route.ts:989`, `phases/[id]/route.ts:212,:318`) — each says
   "no scope → require CLIENT_LEAD", with an inline *"(shouldn't happen)"*. After
   the collapse, `scopeId` is *always* null, so **these paths become the only
   path** and the SCOPE_LEAD-equivalent tier loses phase and activity deletion
   entirely unless rewritten. Easy to miss.
3. **`filterTeamMembers` (`visibility.ts:689-700`)** — CONTRIBUTOR and COLLABORATOR
   see a roster narrowed to leads only. Purely cosmetic, but it is a role branch.

---

## §D. Files

**Nothing is uploaded. It is strictly a typed URL.** Verified four ways:

1. The POST body schema takes a URL string, never a file —
   `src/app/api/scopeplan/activities/[id]/files/route.ts:12-18`:
```ts
const createFileSchema = z.object({
  fileName: z.string().min(1, 'File name is required').max(255, 'File name too long'),
  fileUrl: z.string().url('Invalid file URL'),
  fileType: z.string().max(100).nullable().optional(),
  fileSize: z.number().nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
});
```
2. No `formData()`, no multipart, no storage client anywhere in the route (239 lines).
3. The UI is a "Links & Files" dialog that asks for a name and a URL —
   `src/app/clients/[clientId]/scopeplan/page.tsx:2044-2075`:
```ts
  const handleAddLink = async () => {
    if (!linksActivityId || !newLinkName.trim() || !newLinkUrl.trim()) {
      toast.error('Please enter both link name and URL');
      return;
    }
    // Basic URL validation
    try {
      new URL(newLinkUrl);
    } catch {
      toast.error('Please enter a valid URL');
      return;
    }
    ...
        body: JSON.stringify({
          fileName: newLinkName.trim(),
          fileUrl: newLinkUrl.trim(),
          fileType: 'link',
          description: newLinkDescription.trim() || null,
        }),
```
4. The only `<input type="file">` in the whole module is the Excel importer
   (`components/scopeplan/ImportPlanDialog.tsx:291`).

**Writes.** `POST` at `:85`, gated on `canWorkOnActivity` (`:106`). `uploaded_by`
is set from the session (`:130`). `fileType` is whatever the caller sends — the UI
always sends the literal `'link'`. `file_size` is caller-supplied and the UI never
sends it, so it is always NULL; the GET sums it anyway (`:62`).

**Reads.** `GET` at `:21`, gated on **`canCommentOnActivity`** (`:40`) — a looser
gate than the write. That means a VIEWER (who returns `true` from
`canCommentOnActivity`) can list links.

**Delete.** Yes — `DELETE ?fileId=` at `:167`, gated on `canWorkOnActivity`
(`:193`), with an ownership check that the file belongs to the activity
(`:207-209`) and a history row written (`:215-225`). Note the *author* is not
checked: anyone who can work on the activity can delete anyone's link.

**When an activity is deleted:** the rows go, via
`activity_files_activity_id_fkey ... ON DELETE CASCADE`. The `DELETE` handler
reports the count it destroyed (`activities/[id]/route.ts:1055`). Nothing external
is touched, because nothing external exists.

**Size or type limits:** **none, anywhere.** No max size (`fileSize` is a hint, not
a check), no MIME allow-list, no extension check, no count cap per activity. The
only validation is `z.string().url()`, which accepts `javascript:` and `data:` URIs —
worth a look when these become real uploads and the same field gets rendered as a
link.

**One confirmed dead counter:** `filesCount` is incremented in the page state
(`page.tsx:771`, `:777`) but **the API never returns that key** — it returns
`_count.files`. It is one of the module's type errors (TS2339). The badge always
counts up from zero within a session.

---

## §E. Comments and tagging

**A comment is** a row in `activity_comments`: `content TEXT NOT NULL` (raw text,
max 5000 chars per `createCommentSchema`), plus a denormalised `author_id` +
`author_name`. The schema calls it *"Rich text (markdown)"*
(`schema.prisma:1965`); nothing parses or sanitises markdown on the server.
`is_edited` is a flag, and there is no revision history.

**A tag is stored twice.** First as literal text inside `content` — `@aley` stays in
the body forever. Then, at write time, as a resolved row in `comment_mentions`.

**Resolution is a regex over free text against the global user table:**

`src/app/api/scopeplan/activities/[id]/comments/route.ts:22-27`
```ts
function extractMentions(content: string): string[] {
  const mentionRegex = /@(\w+)/g;
  const matches = content.match(mentionRegex);
  if (!matches) return [];
  return [...new Set(matches.map(m => m.substring(1)))];
}
```
`:180-205`
```ts
    const mentionedUsernames = extractMentions(validatedData.content);

    if (mentionedUsernames.length > 0) {
      // Find users by username
      const mentionedUsers = await db.user.findMany({
        where: {
          username: {
            in: mentionedUsernames,
          },
        },
        select: { id: true, username: true },
      });

      // Create mention records
      for (const user of mentionedUsers) {
        await db.commentMention.create({
          data: {
            commentId: newComment.id,
            mentionedUserId: user.id,
            mentionedUsername: user.username,
          },
        });
```

Three things follow, all verified:

- **`@(\w+)` cannot match most usernames.** `\w` is `[A-Za-z0-9_]`, so
  `@firstname.lastname` resolves to `firstname` and `@a-b` to `a`. ClientPlus
  usernames are dotted in the seed data and the Excel template's own examples
  (`john.smith`, `sarah.jones`). **A dotted username can never be tagged.** The
  screen's picker (`components/comments/MentionDropdown.tsx`) inserts a username
  the regex will then truncate.
- **The lookup is `db.user.findMany` with no client filter.** Tagging is not
  restricted to the team, the client, or even people who can see the activity.
  Anyone in the system resolves and gets notified.
- **`case` is exact here** but `usernameToId` in the importer lowercases. Different
  matching rules for the same concept in two files.

**Does a tag do anything beyond being drawn?** Yes — exactly one thing: it creates a
`MENTION` notification (`:207-220`). That is the whole payload. It does not grant
access, does not add the person to the activity or team, does not subscribe them to
the thread, and does not appear in any digest.

**A confirmed bug in the same handler.** After the mention notifications, the code
notifies the assignee and collaborators, and tries to skip people already
mentioned:

`src/app/api/scopeplan/activities/[id]/comments/route.ts:238-247`
```ts
    // Remove mentioned users from general notification (they already got a mention notification)
    mentionedUsernames.forEach(async (username) => {
      const user = await db.user.findUnique({
        where: { username },
        select: { id: true },
      });
      if (user) {
        usersToNotify.delete(user.id);
      }
    });
```
`forEach` with an `async` callback is not awaited. The `for (const userId of
usersToNotify)` loop immediately below runs before any of those deletes land, so
**a mentioned assignee reliably gets both a MENTION and a COMMENT notification.**
(Also: N+1 lookups for users already fetched twenty lines above.)

**Reactions** are `(comment_id, user_id, emoji)` with a unique key — one of each
emoji per person per comment. Written via `/api/comments/[id]/reactions`, which
sits **outside** the `/api/scopeplan` tree.

---

## §F. Notifications

**Yes — there is one channel, and it is a bell.** Not none.

**What it is:** rows in `in_app_notifications`, read by a header dropdown
(`src/components/notifications/NotificationDropdown.tsx`), with an unread badge
from `GET /api/notifications/unread-count` **polled every 30 seconds**
(`NotificationDropdown.tsx:64`: `const interval = setInterval(fetchUnreadCount, 30000)`).
The bell is mounted in three layouts including `components/clients/ClientsLayout.tsx:127`,
which is the one ScopePlan renders under.

**What triggers one.** Four types, all written inline in the route handlers, all
server-side:

| Type | Fires when | Lands on | Code |
|---|---|---|---|
| `ASSIGNMENT` | assignee changes and the new assignee isn't you | new assignee | `activities/[id]/route.ts:484-495` (descriptor path) and `:525-537` (legacy path); `activities/route.ts` on create |
| `STATUS_CHANGE` | status changes and the current assignee isn't you | current assignee | `activities/[id]/route.ts:620-632` |
| `MENTION` | `@name` resolves to a user who isn't you | mentioned user | `comments/route.ts:207-220` |
| `COMMENT` | a comment is posted | assignee + all user-backed collaborators, minus you | `comments/route.ts:249-262` |

A representative one, `activities/[id]/route.ts:620-632`:
```ts
      // Create notification for status change
      if (existingActivity.assignedToUserId && existingActivity.assignedToUserId !== session.user.id) {
        await db.inAppNotification.create({
          data: {
            userId: existingActivity.assignedToUserId,
            type: 'STATUS_CHANGE',
            title: 'Activity Status Updated',
            message: `Activity "${existingActivity.name}" status changed from ${existingActivity.status} to ${validatedData.status}`,
            activityId,
            createdByUserId: session.user.id,
            createdByName: session.user.username || session.user.name,
          },
        });
      }
```

**What does NOT happen, checked explicitly:**

- **No email.** `src/lib/email.ts` is never called from any ScopePlan path.
- **No push.** `push-service.ts` and `fcm-push-service.ts` only ever emit
  `DAILY_REMINDER` and `TASK_REMINDER` (`push-service.ts:91,114,173,225`). None of
  the four ScopePlan types reaches Firebase.
- **No Google Chat.** `src/lib/google-chat/` has no reference to any of the four
  types (its `MENTION` constant is an unrelated Chat event kind).
- **No digest, no batching, no per-user preference.** The four `notif*` columns on
  `users` govern the time-entry reminders, not these.
- **No deep link.** `activity_id` is stored but there is no FK and — **I could not
  find any route that resolves a notification's `activity_id` into a URL**; the
  plan page is addressed by client, agreement and scope, none of which the
  notification carries. So "open the thing that changed" is not implemented.
- **Non-user collaborators are skipped**, correctly and deliberately —
  `comments/route.ts:232-237`: `// Skip non-user collaborators (no User.id → no notification target, FR-021)`.

Nothing writes a notification when an activity is **deleted**, when a **dependency
cascade moves your dates**, or when something lands in the **pending-completions**
queue — the three events most worth telling somebody about.

---

## §G. The Excel round trip

**Library: `exceljs`, declared `^4.4.0` in `package.json:88`, resolved `4.4.0` in
`node_modules`.** Same library both directions. `csv-parse` and `csv-parser` are in
the tree but not used here.

### G.1 The builder — `src/app/api/scopeplan/template/route.ts` (769 lines)

`GET /api/scopeplan/template?clientId=&assignmentId=&scopeId=`. Auth is a session
check only (`:27`) — **no `canManageScope`, no team-membership check.** Any signed-in
user can download any client's context, team roster and existing plan. (Contrast the
importer, which does gate. Asymmetric.)

Seven sheets. The one you fill:

`src/app/api/scopeplan/template/route.ts:216-235`
```ts
    planSheet.columns = [
      { header: 'Phase', key: 'phase', width: 25 },
      { header: 'PhaseOrder', key: 'phaseOrder', width: 12 },
      { header: 'PhaseDescription', key: 'phaseDesc', width: 30 },
      { header: 'WorkPackage', key: 'workPackage', width: 25 },
      { header: 'WPOrder', key: 'wpOrder', width: 10 },
      { header: 'WPDescription', key: 'wpDesc', width: 30 },
      { header: 'Activity', key: 'activity', width: 30 },
      { header: 'ActivityOrder', key: 'activityOrder', width: 14 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Deliverables', key: 'deliverables', width: 40 },
      { header: 'DeliverableType', key: 'deliverableType', width: 15 },
      { header: 'DurationType', key: 'durationType', width: 14 },
      { header: 'Duration', key: 'duration', width: 10 },
      { header: 'PlannedStartDate', key: 'plannedStartDate', width: 16 },
      { header: 'PlannedEndDate', key: 'plannedEndDate', width: 16 },
      { header: 'Assignee', key: 'assignee', width: 20 },
      { header: 'IsMilestone', key: 'isMilestone', width: 12 },
      { header: 'IsBillable', key: 'isBillable', width: 12 },
    ];
```
The others: **Context** (`Field`/`Value`; carries client, agreement name and type
derived by regex from the agreement name at `:11-20`, scope, start date, end date,
budget hours — `:305-317`), **Team** (`Username`, `Full Name`, `Role`, `Email` —
**emails of the whole active user list, handed to anyone who can hit the URL**),
**Existing Plan**, **Reference**, **Instructions**, **GPT Instructions**.

And then:

`src/app/api/scopeplan/template/route.ts:740-746`
```ts
    // Hide internal sheets (Plan, Instructions, GPT Instructions) from end users
    const planWs = workbook.getWorksheet('Plan');
    if (planWs) planWs.state = 'hidden';
    const instrWs = workbook.getWorksheet('Instructions');
    if (instrWs) instrWs.state = 'hidden';
    const gptWs = workbook.getWorksheet('GPT Instructions');
    if (gptWs) gptWs.state = 'hidden';
```
> **The sheet the user is told to fill, and the sheet telling them how, are both
> hidden on the way out.** The importer then hard-requires a sheet named `Plan`
> (`import/route.ts:151-154`). I cannot tell from the code whether this was
> deliberate; it reads like a late change that was never reconciled.

**Who can reach the download button:** not a permission — a name list.
`src/app/clients/[clientId]/scopeplan/page.tsx:2255`
```ts
          ['aley', 'galal'].includes(session?.user?.username?.toLowerCase() ?? '')
```
with `ScopePlanHeader.tsx:66` and `:290` commented *"Import plan (SUPER_USER 'Aley'
only)"*. **Screen-side only** — the endpoints themselves don't check it.

### G.2 The AI instruction sheet, verbatim

`src/app/api/scopeplan/template/route.ts:530-708`, reproduced as the strings appear
(box-drawing rules elided):

```
                              HOW TO USE AI FOR SCOPE PLANNING

STEP 1: Upload This Template to ChatGPT
1. Go to chat.openai.com (ChatGPT Plus recommended)
2. Start a new conversation
3. Upload this entire Excel file
4. ChatGPT will read the Context and Team sheets automatically

STEP 2: Describe Your Project
Tell ChatGPT about:
• Project type and main objectives
• Key deliverables expected
• Any fixed milestones or deadlines
• Constraints (budget hours shown in Context sheet)

STEP 3: Review the Proposed Plan
ChatGPT will propose a plan structure. You can:
• Ask for more/fewer phases
• Request different activity breakdown
• Adjust team assignments
• Change timeline distribution

STEP 4: Generate the Excel
When satisfied, ask ChatGPT to:
"Fill the Plan sheet and give me the updated Excel file"

STEP 5: Import to ClientPlus
Upload the completed file using "Import Plan" in ClientPlus.

CUSTOM GPT SYSTEM PROMPT
Copy the text below to create a Custom GPT, or paste at the start of a ChatGPT conversation:

# ScopePlan Assistant

You are a project planning assistant for consultants. Your job is to help users create
detailed scope plans through conversation, then export them as Excel files.

## Your Capabilities

1. **Read Excel Templates**: Users will upload Excel templates containing:
   - Context sheet: Client name, agreement, scope, project dates, budget hours
   - Team sheet: Available team members with usernames
   - Existing Plan sheet: Current phases/activities if any exist
   - Reference sheet: Valid dropdown values

2. **Conversational Planning**: Guide users through creating a complete plan

3. **Generate Excel Output**: Fill the Plan sheet with the agreed structure

## Planning Structure

Every scope plan follows this hierarchy:

Phase (Required)
├── Work Package (Optional grouping)
│   └── Activity (with dates, assignee)
└── Activity (can be directly under phase without WP)

## Conversation Flow

### When user uploads the template:

1. Read and summarize the Context sheet
2. List available team members from Team sheet
3. Note if there's an existing plan (for merge scenarios)
4. Ask about project objectives and constraints

Example response:
"I've reviewed your template:

📋 Project Context
- Client: [Client Name]
- Agreement: [Name] ([Type])
- Scope: [Scope Name]
- Timeline: [Start] to [End]
- Budget: [X] hours

👥 Available Team
- [username1] ([Full Name] - [Role])
- [username2] ([Full Name] - [Role])

📊 Existing Plan: [Yes - X phases, Y activities / No existing plan]

What type of project is this? Tell me about the main objectives and any key milestones."

### Generate Plan:

Present plans in readable tree format:

📅 Proposed Plan

Phase 1: Discovery (Feb 1 - Feb 28)
├── WP 1.1: Requirements Gathering
│   ├── 1.1.1 Stakeholder interviews (Feb 15) → john.smith
│   ├── 1.1.2 Document processes (Feb 21) → sarah.jones
│   └── 1.1.3 Requirements sign-off ⭐ (Feb 28) → john.smith [Milestone]
└── WP 1.2: Technical Assessment
    ├── 1.2.1 System audit (Feb 20) → mike.wilson
    └── 1.2.2 Gap analysis (Feb 28) → sarah.jones

Phase 2: Design (Mar 1 - Mar 31)
├── 2.1 Solution architecture (Mar 15) → john.smith
└── 2.2 Design approval ⭐ (Mar 31) → john.smith [Milestone]

### Excel Output Format:

Fill the Plan sheet with these exact columns:
Phase, PhaseOrder, PhaseDescription, WorkPackage, WPOrder, WPDescription,
Activity, ActivityOrder, Description, Deliverables, DeliverableType,
DurationType, Duration, PlannedStartDate, PlannedEndDate, Assignee,
IsMilestone, IsBillable

## Important Rules

### Dates
- Use YYYY-MM-DD format
- PlannedEndDate is REQUIRED for every activity
- Stay within project timeline from Context sheet

### Assignees
- ONLY use usernames from the Team sheet (exact match)
- Distribute work reasonably across team

### Budget Constraint
- Consider Budget Hours from Context sheet
- Suggest realistic durations that fit within budget

### Ordering
- PhaseOrder: Sequential (1, 2, 3...)
- WPOrder: Sequential within phase
- ActivityOrder: Sequential within WP or Phase

### Milestones
- Mark key deliverables as milestones (IsMilestone = TRUE)
- Milestones typically have Duration = 0

EXAMPLE CONVERSATION

User: [Uploads Excel template]

GPT: I've reviewed your template:
[… worked example: ABC Manufacturing, AB&Associates-PRJ-2501-2512, ERP
Implementation Phase 1, Feb 1 – Jul 31 2026, 2000 hours, three named
consultants, then a two-phase SAP plan …]

User: Yes, looks good. Generate the Excel.

GPT: [Provides completed Excel file with Plan sheet filled]
```

Note what the prompt promises that the schema does not deliver: *"Stay within
project timeline"* and *"Suggest realistic durations that fit within budget"* are
requests to a model, checked by nobody. `Duration = 0` for milestones is honoured —
but only through the UI path (`activities/[id]/route.ts:737-740` forces
`duration = 0` when `isMilestone` is set); the importer writes whatever
`Duration` says. `PlannedStartDate` is absent from the "Important Rules" —
which is exactly the field that breaks the import (§I-2).

### G.3 The reader — `src/app/api/scopeplan/import/route.ts` (491 lines)

`POST` multipart with `file`, `clientId`, `assignmentId`, `scopeId`, `mode`
(`preview` | `import`) and `importMode` (`merge` | `replace`).
Gated at `:129-133` on `canManageScope` — **Scope Lead or above. Server.**

**What it does with a row it can't accept: it refuses the row, silently, and
imports the rest.** The file is never refused for bad rows. Inside
`planSheet.eachRow(...)`, a bare `return` skips that row — `errors[]` is declared
(`:156`) and **never pushed to**; everything goes into `warnings[]`:

`src/app/api/scopeplan/import/route.ts:193-216`
```ts
      // Validate required fields
      if (!phase) {
        warnings.push({ row: rowNumber, field: 'Phase', message: 'Phase is required' });
        return;
      }
      if (!phaseOrder) {
        warnings.push({ row: rowNumber, field: 'PhaseOrder', message: 'PhaseOrder is required' });
        return;
      }
      if (!activity) {
        warnings.push({ row: rowNumber, field: 'Activity', message: 'Activity is required' });
        return;
      }
      if (!activityOrder) {
        warnings.push({ row: rowNumber, field: 'ActivityOrder', message: 'ActivityOrder is required' });
        return;
      }
      if (!plannedEndDate) {
        warnings.push({ row: rowNumber, field: 'PlannedEndDate', message: 'PlannedEndDate is required' });
        return;
      }
```
Three further checks **warn but keep the row**:

`:220-241`
```ts
      // Validate assignee
      if (assignee && !validUsernames.has(assignee.toLowerCase())) {
        warnings.push({ row: rowNumber, field: 'Assignee', message: `Username "${assignee}" not found in system` });
      }

      // Validate deliverable type
      let deliverableType: 'TRANSITIONAL' | 'FINAL' | null = null;
      if (deliverableTypeRaw) {
        if (deliverableTypeRaw === 'TRANSITIONAL' || deliverableTypeRaw === 'FINAL') {
          deliverableType = deliverableTypeRaw;
        } else {
          warnings.push({ row: rowNumber, field: 'DeliverableType', message: `Invalid value "${deliverableTypeRaw}", must be TRANSITIONAL or FINAL` });
        }
      }

      // Validate duration type
      let durationType: 'DAYS' | 'WEEKS' = 'DAYS';
      if (durationTypeRaw === 'WEEKS') {
        durationType = 'WEEKS';
      } else if (durationTypeRaw && durationTypeRaw !== 'DAYS') {
        warnings.push({ row: rowNumber, field: 'DurationType', message: `Invalid value "${durationTypeRaw}", must be DAYS or WEEKS` });
      }
```
Note the defaulting: an unrecognised `DurationType` **silently becomes DAYS**, and
an unrecognised `DeliverableType` silently becomes NULL. An unknown assignee is
written through as an orphan string:

`:400-403`
```ts
                    assignedToUserId: userId || null,
                    assignedToUsername: act.assignee || null,
```
— `assigned_to_username` holds a name with no `assigned_to_user_id` and no
`assigned_to_team_member_id`. The interactive path would have gone through
`resolveAssignee` and either matched a team member or refused.

**Cells are read positionally** (`row.getCell(1)` … `getCell(18)`, `:168-185`) —
**the header row is skipped, never validated**. Insert a column and every field
shifts silently.

**`replace` mode** deletes the entire existing plan first, inside the transaction:

`:296-320`
```ts
          if (importMode === 'replace') {
            await tx.activity.deleteMany({
              where: {
                OR: [
                  { phase: { clientId: ..., assignmentId: ..., scopeId: ... } },
                  { workPackage: { phase: { clientId: ..., assignmentId: ..., scopeId: ... } } },
                ],
              },
            });
            await tx.workPackage.deleteMany({ where: { phase: {...} } });
            await tx.phase.deleteMany({ where: {...} });
          }
```
which cascades away every comment, mention, reaction, link, sub-activity and
history row under them.

**`merge` mode matches on number, not name** (`:351-358`): an existing phase with
`phaseNumber = 2` is reused **whatever it is called**, so re-importing a renamed
plan keeps the old names and grafts the new activities underneath.

**The import path skips almost every rule the interactive path enforces.** It does
not snap dates to Sunday, does not set `assignedToTeamMemberId`, does not call
`ensureTeamMember`, does not write `activity_history`, does not emit an
`ASSIGNMENT` notification, and does not compute `display_id` through the shared
helper (it string-builds it at `:406`, `:434`). Two doors, two behaviours.

---

## §H. Numbers

### H.1 Rows per table, and how many plans exist

**I could not find a single ScopePlan row anywhere in this repository.** This is a
verified negative, not a gap in my search:

- `Dump20251023.sql` — the one production dump in the repo, 1.4 MB, dated 23 Oct
  2025 — contains **19 tables and none of them are plan tables**. Its `CREATE TABLE`
  list: `analytics_settings, clients_data, consultant_deals, consultant_vacation,
  domains, feedback, hist_data, impersonation_logs, page_permissions,
  password_reset_tokens, public_holidays, scope_templates, scopes, subdomains,
  subtasks, super_users, task_timers, user_domains, users`. ScopePlan shipped in
  Dec 2025, after this dump was taken.
- `prisma/seed.ts` and `prisma/seed-demo.ts` create clients, domains, subdomains,
  scopes and users — **no phases, work packages or activities**.
- `prisma/seeds/` holds four role-system migration scripts, no plan data.
- `FFNT.sqlite` is the pre-Next.js R Shiny database; it predates all of this.
- No other `.sql` or `.csv` in the tree contains `INSERT INTO \`phases\`` or
  `INSERT INTO \`activities\``.

So: **how many plans exist, across how many clients, and the shape of the largest
plan are questions I cannot answer from this repository.** They need a query against
the live database. The four I would run:

```sql
SELECT COUNT(*) AS plans, COUNT(DISTINCT client_id) AS clients
FROM (SELECT DISTINCT client_id, assignment_id, scope_id FROM phases) p;

SELECT client_id, assignment_id, scope_id,
       COUNT(DISTINCT p.id) AS phases,
       COUNT(DISTINCT wp.id) AS work_packages,
       COUNT(DISTINCT a.id) AS activities
FROM phases p
LEFT JOIN scope_milestones wp ON wp.phase_id = p.id
LEFT JOIN activities a ON a.phase_id = p.id OR a.milestone_id = wp.id
GROUP BY client_id, assignment_id, scope_id
ORDER BY activities DESC LIMIT 5;

SELECT 'sub_activities' t, COUNT(*) c FROM sub_activities
UNION ALL SELECT 'activity_comments', COUNT(*) FROM activity_comments
UNION ALL SELECT 'comment_mentions', COUNT(*) FROM comment_mentions
UNION ALL SELECT 'comment_reactions', COUNT(*) FROM comment_reactions
UNION ALL SELECT 'activity_files', COUNT(*) FROM activity_files
UNION ALL SELECT 'activity_history', COUNT(*) FROM activity_history
UNION ALL SELECT 'activity_collaborators', COUNT(*) FROM activity_collaborators
UNION ALL SELECT 'client_team_members', COUNT(*) FROM client_team_members
UNION ALL SELECT 'scope_lead_assignments', COUNT(*) FROM scope_lead_assignments
UNION ALL SELECT 'phase_groups', COUNT(*) FROM phase_groups
UNION ALL SELECT 'scope_plan_terminology', COUNT(*) FROM scope_plan_terminology;

-- and the ones that decide how much of §I actually bit anyone:
SELECT COUNT(*) FROM activities WHERE phase_id IS NULL AND milestone_id IS NULL;
SELECT COUNT(*) FROM activities WHERE assigned_to_username IS NOT NULL AND assigned_to_user_id IS NULL;
SELECT team_role, COUNT(*) FROM client_team_members GROUP BY team_role;
```

For scale context from data that *does* exist: the dump has **54 clients, 151
scopes, 14 users, ~6,400 time entries**. A plan per active client at, say, 40–80
activities would put `activities` in the low thousands — but that is arithmetic,
not evidence.

### H.2 Lines per file

**Total for the module: ~30,700 lines**, of which ~27,700 are ScopePlan's own.

`src/app/api/scopeplan/` — 8,898 total, **8,500 excluding `/tasks/*`**:
```
1066  activities/[id]/route.ts
 769  template/route.ts
 747  analytics/route.ts
 540  activities/route.ts
 491  import/route.ts
 460  activities/[id]/comments/route.ts
 381  hierarchy/route.ts
 379  activities/[id]/collaborators/route.ts
 359  activities/[id]/sub-activities/[subId]/route.ts
 350  phases/[id]/route.ts
 338  bulk-create/route.ts
 304  phases/route.ts
 280  milestones/[id]/route.ts          ← work packages
 239  activities/[id]/files/route.ts
 235  activity/[id]/route.ts            ← note: singular; separate from activities/[id]
 233  milestones/route.ts               ← work packages
 223  activities/[id]/sub-activities/route.ts
 220  tasks/[id]/route.ts               ← NOT ScopePlan. Leave.
 199  phase-groups/route.ts
 192  pending-completions/route.ts
 178  tasks/route.ts                    ← NOT ScopePlan. Leave.
 172  phase-groups/[id]/route.ts
 152  phase-groups/[id]/members/route.ts
 143  activities/[id]/history/route.ts
 141  cascade-preview/route.ts
 107  phase-groups/reorder/route.ts
```

`src/app/clients/[clientId]/scopeplan/` — 9,405:
```
2970  page.tsx
1368  ScopePlanDialogs.tsx
 985  analytics/page.tsx
 751  GanttChart.tsx
 642  analytics/GroupsBuilder.tsx
 503  ActivityForms.tsx
 461  ScopePlanActivityRow.tsx
 449  pending-completions/page.tsx
 410  analytics/PendingCompletionsTab.tsx
 402  ScopePlanHeader.tsx
 241  types.ts
 223  utils.ts
```

`src/components/scopeplan/` — 4,791:
```
 615  ImportPlanDialog.tsx        528  ScopePlanPlanningMode.tsx
 434  ActivityDetailPanel.tsx     347  ActivityCommentsModal.tsx
 313  ActivityCard.tsx            254  DependencyArrows.tsx
 247  CascadeWarningDialog.tsx    218  DeleteActivityDialog.tsx
 209  TerminologySettingsModal.tsx 203  AssigneePicker.tsx
 197  ActivityTimeline.tsx        180  types.ts
 175  ScopePlanContext.tsx        162  utils.ts
 136  PlanningModeBanner.tsx      129  PlanningModeField.tsx
 114  DroppableContainer.tsx      109  DraggableActivity.tsx
  98  DraftRecoveryDialog.tsx      53  MilestoneBadge.tsx
  24  DeliverableTypeBadge.tsx     23  index.ts
  23  ActivityStatusBadge.tsx
```

`src/components/comments/` — 773: `CommentItem.tsx` 293, `CommentInput.tsx` 266,
`MentionDropdown.tsx` 125, `CommentsList.tsx` 89.

Logic and types:
```
1040  src/hooks/useScopePlanDraft.ts        ← Planning Mode
 708  src/types/scopeplan.ts
 502  src/utils/scopeplan-numbering.ts
 337  src/types/scopeplan-draft.ts
 217  src/lib/scopeplan/activityDates.ts    ← LIVE
  23  src/lib/scopeplan/phaseGroupColors.ts ← LIVE
 239  src/lib/scopeplan/dateUtils.ts        ← DEAD
 346  src/lib/scopeplan/dependencyUtils.ts  ← DEAD
 512  src/lib/scopeplan/permissionUtils.ts  ← DEAD
   6  src/lib/scopeplan/index.ts            ← DEAD
 150  src/app/api/clients/[clientId]/scopes/[id]/terminology/route.ts
```

Shared access layer (`src/lib/clients/`, 3,019 — needed, but not ScopePlan's alone):
`permissions.ts` 1026, `visibility.ts` 790, `types.ts` 366, `teamMembers.ts` 337,
`entryVisibility.ts` 274, `auth.ts` 95, `viewMode.ts` 86, `resolveVisibility.ts` 33,
`teamMemberKind.ts` 12. Plus `src/lib/hooks/useClientVisibility.ts` 156.

### H.3 TypeScript errors inside these files

`npx tsc --noEmit` on the clean tree: **762 errors repo-wide, 92 of them in module
files.** Note `next.config.ts` sets `typescript.ignoreBuildErrors: true` and
`eslint.ignoreDuringBuilds: true`, so none of this blocks a build.

By code: 66 × TS2345, 11 × TS2322, 9 × TS2339, 6 × TS2551.

**53 of the 92 are one thing** — `ModulePermissionLevel | undefined` passed to a
parameter typed `ModulePermissionLevel`, i.e. `session.user.modulePermissions?.['scope_plan']`
reaching `canAccessClient`. **The runtime is correct**: `validateModuleLevel(undefined)`
returns `undefined` and the caller denies (`permissions.ts:186-203`). Widening the
signature to `| undefined` clears roughly 57% of the module's errors in one edit.

The rest are real sloppiness worth triaging, not ignoring. The 19 in `page.tsx`
include two hits on `filesCount`, a property that **does not exist on the API
response** (§D) — the only one of the 92 I confirmed as a live defect. The 6 ×
TS2551 are in `dependencyUtils.ts`, which is dead.

Per file:
```
19  app/clients/[clientId]/scopeplan/page.tsx        8  api/scopeplan/activities/[id]/route.ts
 6  api/scopeplan/template/route.ts                  5  api/scopeplan/phases/[id]/route.ts
 4  lib/scopeplan/dependencyUtils.ts (dead)          4  .../sub-activities/[subId]/route.ts
 4  .../activities/[id]/collaborators/route.ts       3  components/scopeplan/ActivityCard.tsx
 3  api/scopeplan/phases/route.ts                    3  api/scopeplan/phase-groups/route.ts
 3  api/scopeplan/milestones/[id]/route.ts           3  api/scopeplan/activities/route.ts
 3  .../sub-activities/route.ts                      3  .../activities/[id]/files/route.ts
 2  each: phase-groups/reorder, phase-groups/[id]/members, pending-completions,
        milestones, activity/[id], activities/[id]/comments
 1  each: permissionUtils(dead), clients/visibility, ImportPlanDialog, import,
        hierarchy, cascade-preview, bulk-create, analytics, activities/[id]/history
```

### H.4 Does anything test any of this?

**No. Zero.** The repo has 9 test files and **not one touches ScopePlan**:
```
src/app/api/finance/client-costs/__tests__/route.test.ts
src/app/api/finance/cost-types/__tests__/route.test.ts
src/lib/__tests__/permissions.test.ts          ← src/lib/permissions.ts (module levels),
                                                  NOT src/lib/clients/permissions.ts
src/lib/finance/__tests__/{assignment-breakdown, client-cost-validation,
  cost-reconciliation, cost-types, direct-costs-reconciliation, lead-consultant}.test.ts
```
`npx jest` on this tree: **38 tests pass, 3 suites fail to run** (they need
`DATABASE_URL`). All 38 are finance arithmetic or the module-permission comparator.

So every rule in §B — the roll-up, the floor, the DONE/COMPLETED gate, the date
resolution, the cascade — is **unverified by any test**. `resolveActualDates` and
`calculateProgressFromSubActivities` are pure functions with no I/O; they are the
cheapest possible tests and they do not exist. Write them against the current
behaviour *before* you port, so the port has something to disagree with.

---

## §I. Traps

Ordered by what would hurt most. Every one confirmed by reading the code.

**1. `bulk-create` will delete any row in the system for any signed-in user.**

`src/app/api/scopeplan/bulk-create/route.ts:107-113`
```ts
    // Phase 5: Require SCOPE_LEAD+ for bulk create
    if (validatedData.scopeId) {
      const canManage = await canManageScope(session.user.id, validatedData.clientId, validatedData.scopeId, session.user.modulePermissions?.['scope_plan']);
      if (!canManage) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }
    }
```
`scopeId` is `z.number().nullable()` (`:63`). **Send it as `null` and the entire
permission check is skipped** — the only remaining gate is the session check at
`:91`. Then:

`:134-150`
```ts
      if (validatedData.deletedActivityIds.length > 0) {
        await tx.activity.deleteMany({
          where: { id: { in: validatedData.deletedActivityIds } },
        });
      }
      if (validatedData.deletedWorkPackageIds.length > 0) {
        await tx.workPackage.deleteMany({
          where: { id: { in: validatedData.deletedWorkPackageIds } },
        });
      }
      if (validatedData.deletedPhaseIds.length > 0) {
        await tx.phase.deleteMany({
          where: { id: { in: validatedData.deletedPhaseIds } },
        });
      }
```
The ID arrays are `z.array(z.number())` (`:83-85`) and **are never checked against
the client, the scope, or anything else** — not even in the guarded path. So:
(a) any authenticated user can destroy arbitrary plans by posting
`{clientId: <any>, scopeId: null, deletedPhaseIds: [...]}`; and (b) even a
legitimately-authorised Scope Lead can delete phases belonging to scopes they do
not lead. Cascades take comments, files, history and sub-activities with them.
**Do not port this route's shape. Check ownership of every ID, and never make a
permission check conditional on an optional field.**

**2. Any Excel import with a blank `PlannedStartDate` crashes the whole transaction.**

The importer only requires `PlannedEndDate` (`:212-216`) and writes:
`:394` — `plannedStartDate: act.plannedStartDate ? new Date(act.plannedStartDate) : null,`
against `planned_start_date DATE **NOT NULL**` (§A.1). The GPT instruction sheet's
"Important Rules" section lists `PlannedEndDate is REQUIRED` and says nothing about
the start date, so a model following the prompt will produce exactly this file.
Everything rolls back with a Prisma error. **Either make the column nullable or
derive the start from duration at import time.**

**3. `src/lib/scopeplan/` is 82% dead code, and the dead files are the ones that
look most authoritative.** `permissionUtils.ts` (512 lines of role logic),
`dateUtils.ts` (239 lines of date logic) and `dependencyUtils.ts` (346) have **zero
importers**. They read like the spec and they are not the implementation. Anyone
porting "the rules" from the obvious filenames ports fiction. The real logic is
`activityDates.ts` plus inline code in `activities/[id]/route.ts`.

**4. `calculateEndDate` exists four times, and the live copies disagree.**
`api/scopeplan/activities/[id]/route.ts:98` does **not** snap to Sunday;
`components/scopeplan/utils.ts:36` and `app/clients/[clientId]/scopeplan/utils.ts:28`
(identical to each other) **do**; `lib/scopeplan/dateUtils.ts:41` snaps and sets
`23:59:59.999`, and is dead. Whatever start date the server receives is what it
uses. Collapse to one server-side function and have the screen ask.

**5. The role vocabulary contradicts itself in three places.** `ROLE_PERMISSIONS`
(`permissions.ts:52-88`) says VIEWER can only `view`; the docstring at `:885` says
VIEWER cannot comment; `canCommentOnActivity:941` returns `true`. Same pattern for
COLLABORATOR at `:820` vs `:871`. And `getCollaboratorVisibility` (tagged only)
disagrees with `isActivityVisible` (tagged **or** assigned, `:494`), so a list and
a detail view differ on the same row. **When you collapse to three roles, derive
the mapping from the four live `canX` functions, not from the matrix or the
comments.**

**6. The client-side permission hook fails open.** `useClientVisibility.ts:60-70`
returns `canCreate/canEdit/canDelete: true` when the context is missing. The server
refuses, so this is buttons-that-403 rather than a breach — but it is the inverse of
the server's fail-closed convention and it will be copied if nobody notices.

**7. `phases.scope_id` has no foreign key — and neither do five other columns.**
No FK on `phases.scope_id`, `phase_groups.scope_id`,
`scope_plan_terminology.scope_id`, `activities.assigned_to_user_id`,
`activity_collaborators.user_id`, `comment_mentions.mentioned_user_id`, or anything
on `scope_lead_assignments` or `in_app_notifications`. There is **no referential
integrity to inherit**; assume orphans exist and check for them during migration
(the queries in §H.1 will tell you).

**8. Two nullable parents, no constraint.** `activities.phase_id` and
`activities.milestone_id` are both nullable with no CHECK and no application guard
that exactly one is set. Add the constraint in the new schema; you will not get a
cleaner moment.

**9. `NULL` in a unique index constrains nothing (MySQL).**
`phases_client_id_assignment_id_scope_id_phase_number_key` includes two nullable
columns, so today a plan with a NULL scope has **no phase-number uniqueness at
all**; same for the two `activity_collaborators` keys. After the collapse those
nullables disappear and the constraint suddenly starts biting — **existing
duplicate phase numbers will block the migration.** Check before you add the key.

**10. Delete never renumbers.** The 502-line renumbering engine runs only against
Planning Mode drafts (`useScopePlanDraft.ts:36` is its sole importer). Ordinary
DELETE leaves gaps and stale `display_id` strings on every sibling
(`activities/[id]/route.ts:1035`, `phases/[id]/route.ts:330`). `phase_number` is
supplied by the client, never computed by the server.

**11. `/api/scopeplan/tasks/*` is not ScopePlan.** 398 lines under the ScopePlan
URL prefix implementing personal to-dos. The schema is explicit —
`schema.prisma:2073`: `// Task - Standalone task management (NOT linked to ScopePlan)`.
It hangs off `subdomain_id`, which you are deleting. Leave it behind.

**12. `/api/scopeplan/milestones/*` *is* ScopePlan — it is work-package CRUD** under
the pre-rename name. Conversely `/clients/[clientId]/milestones` and the
`milestone_clusters` / `milestone_actions` / `milestone_weekly_tasks` tables are the
**superseded** planning model. And `activities.is_milestone` is a third, unrelated
sense of the word. Three meanings of "milestone" in one module; name them apart now.

**13. The template endpoint is unauthorised and leaks the user directory.**
`template/route.ts:27` checks for a session and nothing else — no `canManageScope`,
no team membership. The workbook it returns includes a **Team** sheet with
`Username, Full Name, Role, Email` for every active user (`:337-341`), plus the
client's agreement, budget and existing plan. The importer *is* gated; the
exporter is not. The only thing standing in front of it is a hardcoded name list on
the screen: `['aley', 'galal'].includes(...)` (`page.tsx:2255`).

**14. `@(\w+)` cannot match a dotted username.** `comments/route.ts:23`. The
system's own usernames are `first.last` — the template's examples are `john.smith`,
`sarah.jones` — so `@john.smith` resolves to `john`. **Mentions are substantially
broken today**, which also means the MENTION notification volume in production is
not evidence of anything. Fix the pattern *and* the mention picker together.

**15. Mentioned users get double-notified.** `comments/route.ts:238-247` — an
`async` callback inside `forEach`, never awaited, racing the loop below it. Both a
MENTION and a COMMENT row are created for the same person.

**16. Reopening a COMPLETED activity silently wipes the sign-off date.** Rule 4 in
`resolveActualDates` clears `actual_end_date` on *any* transition away from
COMPLETED, and that path requires only `canWorkOnActivity` — so a Contributor can
undo a Lead's sign-off. `last_done_at` survives. If the two-step completion is the
governance feature you are keeping, gate the reopen the same way you gate the
completion.

**17. `progress_percent` on `phases` and `scope_milestones` is a lie.** Non-null,
defaulted to 0, never written by ScopePlan, but read and written by the *old*
MilestoneCluster UI. A naive port carries two columns that will always read 0.00
and will be believed.

**18. Three checks use the wrong module key.** `activities/route.ts:389`,
`activities/[id]/route.ts:465`, `collaborators/route.ts:156` pass
`modulePermissions?.['clients']` where the other 48 checks pass `['scope_plan']`.
Whether you may create a non-user assignee is governed by a different module than
the action containing it.

**19. Terminology can be rewritten by anyone with global EDIT on `clients`.**
`terminology/route.ts:111-117` never uses the `clientId` it parses. Small blast
radius, but it is a missing ownership check and it sits on the feature you are
keeping (decision 4).

**20. Planning Mode drafts live in `localStorage`, keyed by
`(clientId, assignmentId, scopeId)`** (`useScopePlanDraft.ts:150, :187`). Nothing
is server-side until Save All. Two consequences: a draft does not follow the user
between devices, and the key embeds two identifiers you are deleting. Also
`useScopePlanDraft.ts:792` hardcodes `'/forefront'` as a basePath fallback.

**21. `activity_history` dies with its activity** (ON DELETE CASCADE). If the audit
trail is meant to outlive the record — and for a sign-off workflow it usually is —
change that on the way in.

---

## Two things I could not verify

1. **Whether any of this has ever run against real data.** No plan rows exist in the
   repository (§H.1). Every behaviour above is read from source, not observed. The
   traps in §I are code-confirmed; whether they have *fired* needs the live database.
2. **Whether the timezone handling actually misbehaves.** The pattern that produced
   BUG-001 in the sibling module (local-time `getDay()` mixed with UTC
   `toISOString()`) is present throughout §B3, but confirming it needs a server
   running in a non-UTC zone. Worth one afternoon before porting the date logic
   verbatim.
