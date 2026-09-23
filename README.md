# TaskFlow — Project Management SaaS Backend

TaskFlow is the Category 8 Assignment 6 backend: a secure, multi-tenant project management API for organizations, teams, projects, sprints, tasks, subtasks, labels, comments, mentions, attachments, notifications, payments, and audit history.

## Roles

- `OWNER`: creates and controls an organization, manages all members and billing.
- `MANAGER`: manages members, projects, sprints, assignments, and analytics.
- `MEMBER`: works with unassigned projects and projects belonging to their teams.
- `GUEST`: has read-only access to projects belonging to their teams.
- `ADMIN`: system-level account that can inspect users/organizations and manage user status.

Authorization is evaluated from each organization's membership, so one account can belong to several organizations with different roles.

Teams add another permission layer: `LEAD`, `MEMBER`, and `VIEWER`. Organization owners/managers can manage every team; a team lead can manage their own team.

## Stack and architecture

- Node.js, TypeScript, Express 5
- PostgreSQL and Prisma 7
- JWT access/refresh authentication, bcrypt, Google OAuth ID tokens
- Zod validation, Helmet, CORS, request rate limiting
- Stripe Checkout with signed webhooks
- Multer and Cloudinary attachments
- Optional Redis project-list caching
- In-app assignment, mention, and membership notifications
- Kanban grouping, calendar aggregation, organization analytics, and audit logs
- Route → controller → service → Prisma architecture

## Local setup

1. Install Node.js 20+ and PostgreSQL.
2. Copy `.env.example` to `.env` and fill in the required values.
3. Run:

```bash
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

The server uses `http://localhost:5000` by default. Health check: `GET /health`.

## Environment variables

Required to start the core API:

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | PostgreSQL provider such as Neon, Supabase, Railway, or local PostgreSQL |
| `JWT_ACCESS_SECRET` | Generate a random 32+ character secret |
| `JWT_REFRESH_SECRET` | Generate a different random 32+ character secret |
| `FRONTEND_URL` | Frontend origin; use `http://localhost:3000` locally |
| `BACKEND_URL` | Deployed API URL or `http://localhost:5000` |

Required for mandatory assignment integrations:

| Variable | Where to get it |
|---|---|
| `GOOGLE_CLIENT_ID` | Google Cloud Console → APIs & Services → Credentials → OAuth Web Client |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API keys (`sk_test_...` for demo) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook/CLI signing secret (`whsec_...`) |

Required only for attachment upload:

| Variable | Where to get it |
|---|---|
| `CLOUDINARY_CLOUD_NAME` | Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | Cloudinary dashboard |

Optional: `REDIS_URL` enables 60-second project-list caching. Without it the API uses PostgreSQL normally.

Never commit `.env`. The checked-in `.env.example` contains no real secret.

### Stripe webhook for local development

```bash
stripe listen --forward-to localhost:5000/api/v1/payments/webhook
```

Copy the printed `whsec_...` into `STRIPE_WEBHOOK_SECRET`. Use Stripe's `4242 4242 4242 4242` test card with any future expiry and CVC in test mode.

## Main workflows

1. Register or sign in with Google.
2. Create an organization; the creator becomes its `OWNER`.
3. Registered users can be added as `MANAGER`, `MEMBER`, or `GUEST`.
4. Owners/managers create teams, add team members, and link projects to teams.
5. Owners/managers create projects and sprints; permitted members create tasks and subtasks.
6. Tasks move through validated Kanban transitions; labels, comments, mentions, attachments, notifications, and audit logs preserve collaboration history.
7. Calendar and analytics endpoints summarize work across the organization.
8. The owner starts Stripe Checkout; a verified webhook marks payment and activates the plan.

## API documentation

- Import [TaskFlow.postman_collection.json](./TaskFlow.postman_collection.json) into Postman.
- See [API_REFERENCE.md](./API_REFERENCE.md) for all routes, permissions, filters, and bodies.

All private endpoints expect `Authorization: Bearer <accessToken>`. Every response follows:

```json
{ "success": true, "message": "Operation successful", "data": {} }
```

or:

```json
{ "success": false, "message": "Something went wrong", "errors": [] }
```

## Quality checks

```bash
npm run typecheck
npm run build
npm run lint
```

## Demo seed

`npm run db:seed` creates a demo owner and system admin using the `DEMO_OWNER_*` and `DEMO_ADMIN_*` variables. Change both example passwords before deployment and submit only dedicated demo credentials to the evaluator.

## Deployment

`render.yaml` is included, and Vercel uses its zero-configuration Node/Express deployment. Add all required environment variables in the host dashboard, use a hosted PostgreSQL `DATABASE_URL`, and deploy migrations before the new application version:

```bash
npm run db:deploy
```

Configure Stripe's webhook endpoint as:

```text
https://YOUR-LIVE-API/api/v1/payments/webhook
```

For Render, the included blueprint runs migrations before starting. For Vercel, run `npm run db:deploy` against the production database from a trusted environment. After deployment, verify `/health`, Google sign-in, Stripe Checkout, and the Stripe webhook in the live environment.
