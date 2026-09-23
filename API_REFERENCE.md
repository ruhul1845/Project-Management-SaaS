# TaskFlow API reference

Base URL:

```text
https://project-management-saa-s-six.vercel.app/api/v1
```

Private routes require `Authorization: Bearer <accessToken>`. JSON request bodies use `Content-Type: application/json`. IDs are UUIDs. List routes support `page` and `limit` unless noted otherwise.

## Authentication and profile

| Method | Route | Access | Body or query |
|---|---|---|---|
| POST | `/auth/register` | Public | `name`, `email`, `password` |
| POST | `/auth/login` | Public | `email`, `password` |
| POST | `/auth/google` | Public | Google `idToken` |
| POST | `/auth/refresh-token` | Public | `refreshToken` |
| POST | `/auth/logout` | Signed in | — |
| GET | `/users/me` | Signed in | — |
| PATCH | `/users/me` | Signed in | Optional `name`, `avatarUrl` |

## Organizations and members

| Method | Route | Access | Body or query |
|---|---|---|---|
| POST | `/organizations` | Signed in | `name`, optional `description` |
| GET | `/organizations/mine` | Signed in | — |
| GET | `/organizations/:organizationId` | Organization member | — |
| PATCH | `/organizations/:organizationId` | Owner | Optional `name`, `description`, `logoUrl` |
| DELETE | `/organizations/:organizationId` | Owner | — |
| POST | `/organizations/:organizationId/members` | Owner/manager | `email`, `role`: `MANAGER`, `MEMBER`, or `GUEST` |
| GET | `/organizations/:organizationId/members` | Organization member | `page`, `limit`, `search` |
| PATCH | `/organizations/:organizationId/members/:memberId` | Owner | `role` |
| DELETE | `/organizations/:organizationId/members/:memberId` | Owner/manager | — |

## Teams and team permissions

Organization owners/managers can manage all teams. A team `LEAD` can update their team and its membership. `MEMBER` and `VIEWER` can read their team. Organization members only see team-linked projects for teams they belong to; guests only see team-linked projects for teams they belong to.

| Method | Route | Access | Body or query |
|---|---|---|---|
| POST | `/teams` | Owner/manager | `organizationId`, `name`, optional `description` |
| GET | `/teams` | Organization member | `organizationId`, optional `search` |
| GET | `/teams/:id` | Organization manager or team member | — |
| PATCH | `/teams/:id` | Organization manager or team lead | Optional `name`, `description` |
| DELETE | `/teams/:id` | Owner/manager | — |
| POST | `/teams/:id/members` | Organization manager or team lead | `email`, `role`: `LEAD`, `MEMBER`, or `VIEWER` |
| PATCH | `/teams/:id/members/:memberId` | Organization manager or team lead | `role` |
| DELETE | `/teams/:id/members/:memberId` | Organization manager or team lead | — |

## Projects, sprints, tasks, and Kanban

| Method | Route | Access | Body or query |
|---|---|---|---|
| POST | `/projects` | Owner/manager | `organizationId`, `name`, `key`, optional `description`, `startDate`, `dueDate`, `teamId` |
| GET | `/projects` | Permitted organization member | `organizationId`; optional `search`, `status`, `teamId`, `sortBy`, `sortOrder`, pagination |
| GET | `/projects/:id` | Permitted project member | — |
| PATCH | `/projects/:id` | Owner/manager | Optional project fields; `teamId` may be `null` |
| DELETE | `/projects/:id` | Owner/manager | — |
| POST | `/sprints` | Owner/manager | `projectId`, `name`, `goal`, `startDate`, `endDate` |
| GET | `/sprints` | Permitted project member | `projectId` |
| PATCH | `/sprints/:id/start` | Owner/manager | — |
| PATCH | `/sprints/:id/complete` | Owner/manager | — |
| POST | `/tasks` | Owner/manager/member | `projectId`, `title`; optional `description`, `priority`, `dueDate`, `sprintId`, `assigneeId`, `parentId` |
| GET | `/tasks` | Permitted project member | `projectId`; optional `search`, `status`, `priority`, `assigneeId`, `sprintId`, `labelId`, pagination |
| GET | `/tasks/mine` | Signed in | Optional `organizationId`, `status`, pagination |
| GET | `/tasks/kanban` | Permitted project member | `projectId`; optional `sprintId`, `assigneeId`, `labelId` |
| GET | `/tasks/:id` | Permitted project member | Includes subtasks, comments/mentions, attachments, labels, and activity |
| PATCH | `/tasks/:id` | Owner/manager/member | Optional editable task fields |
| PATCH | `/tasks/:id/status` | Owner/manager/member | `status`: `TODO`, `IN_PROGRESS`, `IN_REVIEW`, `DONE`, or `CANCELLED` |
| PATCH | `/tasks/:id/assign` | Owner/manager | `assigneeId` or `null` |
| POST | `/tasks/:id/attachments` | Owner/manager/member | Multipart form-data field `file` |
| DELETE | `/tasks/:id` | Owner/manager | — |

A subtask is a task created with `parentId`. Task status changes are transition-validated and exposed as Kanban columns.

## Comments, mentions, labels, notifications, and calendar

| Method | Route | Access | Body or query |
|---|---|---|---|
| POST | `/comments` | Owner/manager/member | `taskId`, `content`, optional `mentionedUserIds[]` |
| GET | `/comments` | Permitted project member | `taskId`, pagination |
| PATCH | `/comments/:id` | Comment author | `content`, optional `mentionedUserIds[]` |
| DELETE | `/comments/:id` | Author or owner/manager | — |
| POST | `/labels` | Owner/manager | `organizationId`, `name`, optional six-digit hex `color` |
| GET | `/labels` | Organization member | `organizationId` |
| PATCH | `/labels/:id` | Owner/manager | Optional `name`, `color` |
| DELETE | `/labels/:id` | Owner/manager | — |
| POST | `/labels/:id/tasks/:taskId` | Owner/manager/member | — |
| DELETE | `/labels/:id/tasks/:taskId` | Owner/manager/member | — |
| GET | `/notifications` | Signed in | Optional `unread=true`, pagination |
| GET | `/notifications/unread-count` | Signed in | — |
| PATCH | `/notifications/read-all` | Signed in | — |
| PATCH | `/notifications/:id/read` | Notification owner | — |
| GET | `/calendar` | Organization member | `organizationId`; optional ISO `from`, `to`, `projectId` |

Calendar ranges are limited to one year and return due tasks, overlapping sprints, and project dates.

## Analytics, payments, and administration

| Method | Route | Access | Body or query |
|---|---|---|---|
| GET | `/analytics/dashboard` | Owner/manager | `organizationId` |
| GET | `/analytics/audit-logs` | Owner/manager | `organizationId`, pagination |
| POST | `/payments/checkout` | Owner | `organizationId` |
| GET | `/payments/:id` | Organization owner/manager | — |
| POST | `/payments/webhook` | Stripe signature | Raw Stripe event body |
| GET | `/admin/dashboard` | System admin | — |
| GET | `/admin/users` | System admin | Optional `search`, `status`, pagination |
| GET | `/admin/organizations` | System admin | Optional `search`, pagination |
| PATCH | `/admin/users/:id/status` | System admin | `status`: `ACTIVE` or `BLOCKED` |
| PATCH | `/admin/users/:id/role` | System admin | `role`: `ADMIN` or `MEMBER` |

## Health endpoints

These are outside `/api/v1` and do not require authentication:

- `GET /`
- `GET /health`
