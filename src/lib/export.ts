/**
 * The export of a person's data: their identities, with their labels and
 * attributes, and the applications each one signed in to. Produced in the
 * browser from what the account's pages already read; the server has no
 * endpoint for it. The format is documented in `docs/export-format.md`.
 */
import type { Identity, IdentityApplication } from "./api-types";

export const EXPORT_FORMAT = "brigid-export";
export const EXPORT_VERSION = 1;

export interface ExportedApplication {
  /** The name the application is registered under on the server. */
  name: string;
  /** Its identifier on the server. Not the identifier it knows you by. */
  client_id: string;
  first_sign_in: string;
  last_sign_in: string;
  /** What the identity accepted to share with it. */
  shared: Array<{ attribute: string; value: string; accepted_at: string }>;
  /** What the identity refused to share with it. */
  refused: string[];
}

export interface ExportedIdentity {
  id: string;
  /** The label: never sent to an application. */
  name: string;
  icon: string;
  description: string | null;
  /** What the identity can share: claim name to value. */
  attributes: Record<string, string>;
  created_at: string;
  updated_at: string;
  applications: ExportedApplication[];
}

export interface AccountExport {
  format: typeof EXPORT_FORMAT;
  version: typeof EXPORT_VERSION;
  /** The server the data comes from. */
  server: string;
  exported_at: string;
  identities: ExportedIdentity[];
}

const iso = (unixSeconds: number) =>
  new Date(unixSeconds * 1000).toISOString().replace(".000Z", "Z");

/** Builds the export. `applications` maps an identity's id to what it gave
 * each application. */
export function buildExport(
  server: string,
  now: Date,
  identities: readonly Identity[],
  applications: Readonly<Record<string, readonly IdentityApplication[]>>,
): AccountExport {
  return {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    server,
    exported_at: now.toISOString().replace(/\.\d{3}Z$/, "Z"),
    identities: identities.map((identity) => ({
      id: identity.id,
      name: identity.name,
      icon: identity.logo,
      description: identity.description,
      attributes: Object.fromEntries(
        Object.entries(identity.attributes).filter(
          (entry): entry is [string, string] => entry[1] !== undefined,
        ),
      ),
      created_at: identity.created_at,
      updated_at: identity.updated_at,
      applications: (applications[identity.id] ?? []).map((application) => ({
        name: application.name,
        client_id: application.client_id,
        first_sign_in: iso(application.linked_at),
        last_sign_in: iso(application.last_used_at),
        shared: application.shared.map((shared) => ({
          attribute: shared.name,
          value: shared.value,
          accepted_at: iso(shared.since),
        })),
        refused: [...application.refused],
      })),
    })),
  };
}

/** The file's name: what it is, where from, and when. */
export function exportFileName(server: string, now: Date): string {
  return `brigid-export-${server}-${now.toISOString().slice(0, 10)}.json`;
}
