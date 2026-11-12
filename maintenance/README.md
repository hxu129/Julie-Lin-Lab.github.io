# Member maintenance

The public website stays static. A separate Python service provides a private, mobile-friendly editor and a JSON API. Saving a record updates the public People pages and profile immediately; no Git commit or manual JavaScript editing is needed.

## Everyday use

Open the private maintenance address while connected to Tailscale. A configured administrator can search current members and alumni, add a member, update a record, or export a JSON backup. Existing records with unknown membership dates keep those dates blank. Start and end dates use calendar months, independently of education dates.

To let a member update their own record, select that member and generate their personal edit link. Give that link only to its intended recipient, who also needs Tailscale access to the host. It grants access to one record. Generating another link revokes the previous one. A link does not add someone to the tailnet or share the host with them.

The editor removes the token from the address bar and keeps it only in memory. Refreshing a personal editing session requires reopening its original link. All editable profile fields are intended for the public website. Uploading a portrait stages the image; saving the record attaches it to the profile.

Set a member's status to alumni when appropriate, supply an end month, and choose the alumni group. The public directory moves the entry into Alumni and preserves its profile. Future or planned end dates do not independently change membership status. Missing translations fall back to the supplied language.

## Running the service

Python 3.10 or newer is sufficient; there are no third-party dependencies.

Keep this entire `maintenance` directory outside the directory served by the public static web server. Keep the private data directory outside both the public release and the source checkout. The service refuses a non-loopback listener or a database below the public site root.

Create the initial seed from the existing website:

```sh
node maintenance/seed_from_site.mjs /path/to/site /private/path/initial-seed.json
```

Run the service with the deployment's actual paths, administrator Tailscale login and private origin:

```sh
python3 maintenance/server.py \
  --site-root /path/to/site/current \
  --data-dir /private/path/member-data \
  --seed /private/path/initial-seed.json \
  --admin-login owner@example.com \
  --origin https://lab-host.example.ts.net:9443
```

Proxy the loopback service with Tailscale Serve on a dedicated private HTTPS port. Do not enable Funnel for this port. The backend trusts Tailscale's identity headers only because it listens on loopback behind that proxy. Multiple `--admin-login` arguments permit multiple administrators. The configured HTTPS origin must match the editor address exactly.

The initial seed is used only for an empty database. Once initialized, SQLite is the canonical member store; editing or recopying the seed does not replace live records. Collaborator records are retained from the initial source and included unchanged in exports.

## Deployments and backups

Keep the database directory when deploying a new public release. Switch the public release, then restart the maintenance service with `--site-root` pointing at the new release. Startup regenerates `js/people-data.js` from the live database and restores referenced uploaded portraits from its durable private portrait store. Do not overwrite the generated JavaScript after starting the service. Preserve prior releases for rollback.

`members.sqlite3` stores member records, versions, hashed personal tokens and a before/after audit history. `portraits/` stores uploaded originals. Back up both outside the public web directory. The administrator's export button downloads all current member records and collaborators, without token hashes or audit records; that export can also initialize a fresh database. It does not include portrait image files.

## JSON API

All API endpoints except health require a Tailscale proxy identity. A personal token, sent as `Authorization: Bearer TOKEN`, restricts even an administrator to that member. Write requests also require the exact configured `Origin` and `X-Lin-Lab-Request: 1`. The service provides no cross-origin access.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Service availability |
| GET | `/api/session` | Current scope and administrator status |
| GET | `/api/members` | Administrator's member list |
| POST | `/api/members` | Administrator creates a member |
| GET | `/api/members/{id}` | Read an authorized member |
| PUT | `/api/members/{id}` | Save `{version, record}` |
| POST | `/api/members/{id}/edit-link` | Administrator rotates the personal link; send `{}` |
| POST | `/api/members/{id}/photo` | Stage JPEG, PNG or WebP bytes, at most 5 MB |
| GET | `/api/export` | Administrator exports records without secrets |

Member fields include bilingual name, role, biography, education and destinations; professional email; academic links; portrait; `status`; `startMonth`; `endMonth`; and `alumniGroup`. IDs are stable. Month values are `YYYY-MM` or empty. End month cannot precede start month, and alumni require an end month. A stale version returns HTTP 409; reload and reconcile instead of overwriting the other edit.

## Verification

```sh
python3 -m unittest discover -s maintenance -p 'test_server.py' -v
node --check maintenance/editor.js
```

The behavior tests cover scope isolation and token rotation, rejected cross-origin writes, invalid records, concurrent-version conflicts, durable publication, private-file isolation, and portrait restoration into another release.
