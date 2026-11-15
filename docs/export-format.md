# The export of an account

A person can take their data away: the account page (`/account/`) has **Download my data**.
The file is made **in the browser**, from what the account's pages already read; the server
has no endpoint that produces it, and it is not sent anywhere.

It is a JSON file, indented, named `brigid-export-<server>-<YYYY-MM-DD>.json`. Anyone who
holds it can read it: it is not encrypted.

This page describes **version 1**. The code is `src/lib/export.ts`; its tests are
`src/lib/export.spec.ts`, and the end-to-end suite downloads a real one
(`e2e/leaving.spec.ts`).

## What it holds

The identities of the account, with their labels and what they can share, and the
applications each one signed in to.

```json
{
  "format": "brigid-export",
  "version": 1,
  "server": "id.example.org",
  "exported_at": "2026-11-15T12:34:56Z",
  "identities": [
    {
      "id": "11111111-1111-4111-8111-111111111111",
      "name": "Work",
      "icon": "icon:ph:briefcase",
      "description": "Work accounts and tools.",
      "attributes": {
        "given_name": "Ada",
        "email": "ada@work.example"
      },
      "created_at": "2026-11-14T10:00:00Z",
      "updated_at": "2026-11-15T09:00:00Z",
      "applications": [
        {
          "name": "Shop",
          "client_id": "2e506702-4703-4bf6-a651-299a634f53ed",
          "first_sign_in": "2026-11-14T23:46:40Z",
          "last_sign_in": "2026-11-15T12:16:40Z",
          "shared": [
            {
              "attribute": "email",
              "value": "ada@work.example",
              "accepted_at": "2026-11-14T23:48:20Z"
            }
          ],
          "refused": ["given_name"]
        }
      ]
    }
  ]
}
```

| Field                                            | Meaning                                                                                                                                                                                    |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `format`, `version`                              | `"brigid-export"` and `1`. A change that removes or renames a field raises the version; a new field does not                                                                               |
| `server`                                         | The domain of the server the data comes from                                                                                                                                               |
| `exported_at`                                    | When the file was made, UTC                                                                                                                                                                |
| `identities[].id`                                | The identity's identifier on that server. No application knows it                                                                                                                          |
| `identities[].name`, `.icon`, `.description`     | The label: what the person sees. Never sent to an application. `icon` is a reference into the interface's icon library, `icon:ph:<name>`; `description` is `null` when there is none       |
| `identities[].attributes`                        | What the identity can share: OpenID Connect claim name to value (`given_name`, `family_name`, `preferred_username`, `email`, `locale`, `zoneinfo`). An attribute without a value is absent |
| `identities[].created_at`, `.updated_at`         | RFC 3339                                                                                                                                                                                   |
| `identities[].applications[]`                    | The applications this identity signed in to, the latest first                                                                                                                              |
| `…applications[].name`, `.client_id`             | The application as it is registered on the server                                                                                                                                          |
| `…applications[].first_sign_in`, `.last_sign_in` | RFC 3339, UTC                                                                                                                                                                              |
| `…applications[].shared[]`                       | What the person accepted to share with it: the attribute, **the value that was accepted** (it can differ from the identity's value today, which is then no longer sent), and when          |
| `…applications[].refused[]`                      | The attributes the person refused to share with it                                                                                                                                         |

All dates are RFC 3339 in UTC.

## What it does not hold

- **The account's secrets**: passkeys cannot be exported (the private part never leaves the
  authenticator), and the recovery code is shown once and kept by the person, not by the
  server.
- **The identifier each application knows an identity by.** It is derived on the server from
  a secret of the server, for each application; it is not the person's data to carry, and
  another server would give other identifiers.
- **The account's sessions**, and anything about other accounts.

## What it is for

Reading, keeping, and moving by hand. There is no import: an account, its passkeys and its
identifiers belong to one server, and a passkey works only on the domain that created it.
Moving a whole server to another edition is the operator's export, a different thing
(brig-id/core#89).
