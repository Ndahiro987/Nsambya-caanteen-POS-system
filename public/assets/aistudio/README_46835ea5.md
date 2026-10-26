# Nsambya Hospital Canteen POS

A browser-based canteen POS for staff sign-in, menu management, sales, payment verification, receipts, corrections/refunds, daily reconciliation, reports, and audit history. It is not a medical-records system.

## Deployment architecture

- **Netlify** serves the browser interface from `public/` and routes `/api/*` to Node.js Functions.
- **TiDB Cloud Starter (MySQL-compatible)** stores production POS data. It supports SQL transactions and can use the MySQL wire protocol from Netlify Functions.
- **XAMPP/MariaDB** can run the same schema for local development. Import `db/netlify_schema.sql` into a local database; do not expose a local XAMPP server to the public internet.
- Passwords are hashed with BCrypt. Server functions enforce roles, recalculate order totals from active menu prices, use idempotency keys, record audit events, and keep completed sale snapshots immutable.

Netlify Functions do not run the existing Rails server. Netlify deployment uses the JavaScript application under `public/` and `netlify/functions/`; the Rails code remains in the repository as the earlier local implementation during migration.

## Local development with XAMPP

1. Start **MySQL** from the XAMPP Control Panel and open phpMyAdmin.
2. Create a database named `nsambya_canteen_development` using `utf8mb4_unicode_ci`.
3. Import [`db/netlify_schema.sql`](db/netlify_schema.sql) into that database.
4. Merge the variables from `.env.example` into the existing `.env`, preserving its other settings. If no `.env` exists, copy the example. The sample connection points to XAMPP's local MariaDB; update it if you set a MySQL root password. Replace the setup-token placeholder with a random token.
5. Install Node packages and start Netlify's local server:

   ```powershell
   npm install
   npm run dev
   ```

6. Open the local URL printed by Netlify CLI (normally `http://localhost:8888`). Generate a token with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`, set it as `INITIAL_SETUP_TOKEN` in `.env`, then use the **First-time setup** link and that token to create the first administrator.

Alternatively, after starting XAMPP and setting `DATABASE_URL`, initialize a local schema with:

```powershell
npm run db:init
```

Never use a production database connection string in a public repository or chat.

## Deploy on Netlify

1. Create a MySQL-compatible TiDB Cloud Starter database in the region closest to the Netlify site. Copy its TLS-enabled connection URL. The free tier has published storage and request-unit quotas; requests may be denied after quota limits are reached. Check the provider's current limits before deployment. [TiDB free tier](https://docs.pingcap.com/tidbcloud/select-cluster-tier/)
2. Push this repository to GitHub, GitLab, or another Git provider supported by Netlify, then import it as a Netlify project. The repository-root `netlify.toml` publishes `public/` and routes `/api/*` to the Functions API.
3. In Netlify's environment-variable settings, add:
   - `DATABASE_URL`: the TiDB MySQL URL (store as a secret).
   - `DB_SSL=true`.
   - `INITIAL_SETUP_TOKEN`: a unique random secret of at least 32 characters.
   - Optional R2 settings below if enabling object-storage photos.
4. Create the database tables by running `db/netlify_schema.sql` in the TiDB SQL editor. To add this feature to an existing database, run the updated schema again; it creates the new signup-request table without replacing existing tables. Netlify deploys do not run database schema changes automatically.
5. Deploy the site. Open its public URL plus `/setup`, enter the setup token, and create the first administrator. Remove `INITIAL_SETUP_TOKEN` from Netlify after setup.
6. Add approved staff accounts and menu prices before testing. Confirm role permissions, payment review, receipt printing, reports, and reconciliation using fictional demo records.

The free Netlify and database tiers are for a demo, not dependable canteen operations. Free instances can have runtime, quota, and backup limits. Do not use this setup for real transactions until you have reviewed data-handling requirements and arranged monitored hosting, database backups, and tested restoration.

## Environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | MySQL-compatible database URL. Local example: `mysql://root@127.0.0.1:3306/nsambya_canteen_development`. |
| `DB_SSL` | Set `true` for hosted database connections; local XAMPP uses `false`. |
| `INITIAL_SETUP_TOKEN` | One-time secret for first administrator creation. Remove after setup. |
| `R2_ENDPOINT` | Optional Cloudflare R2 S3 endpoint, e.g. `https://<account-id>.r2.cloudflarestorage.com`. |
| `R2_BUCKET` | Optional existing R2 bucket name. |
| `R2_ACCESS_KEY_ID` | Optional R2 API token access key. |
| `R2_SECRET_ACCESS_KEY` | Optional R2 API token secret. |

Store hosted values in Netlify's environment-variable settings. Do not commit `.env`, database passwords, database exports, or secret keys.

For R2 photo uploads, configure the bucket's CORS policy to allow `PUT` from your Netlify site origin, allow the `Content-Type` request header, and expose any response headers your browser needs. The app uses short-lived signed URLs; the R2 secret stays in Netlify Functions.

## POS features

- **Staff signup:** staff can submit a worker-account request; administrators review and approve or reject requests before the person can sign in. Public signup cannot grant supervisor or administrator access.
- **Roles:** workers process sales and see only their own sales; supervisors review sales and verify non-cash payments; administrators manage staff and the menu.
- **Checkout:** the server validates quantities and current menu prices, calculates UGX totals, records cash change, and requires references for non-cash payments.
- **Receipts:** paid sales receive one permanent receipt. Reprints are audited and do not create another sale.
- **Corrections:** supervisors and administrators can record reasoned partial or full refunds; original sale records remain intact.
- **Daily close:** supervisors and administrators compare expected payment totals with counts. Differences need an explanation; saved closes are permanent.
- **Reports and audit:** date-filtered sales totals and CSV export are available, and administrators can review the audit trail.
- **Account recovery:** staff can request an administrator-approved temporary password. SMTP settings can be added if email delivery is enabled later.

## Data and backups

The production database is the authoritative source for operational data. Export and store database backups in an access-controlled location, then test restoring them periodically. If photos are enabled, back up the R2 bucket as well. The free deployment configuration does not create a backup service.
