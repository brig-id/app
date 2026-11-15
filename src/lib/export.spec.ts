import { describe, expect, it } from "vitest";
import type { Identity, IdentityApplication } from "./api-types";
import { buildExport, exportFileName } from "./export";

const NOW = new Date("2026-11-15T12:34:56.789Z");

const work: Identity = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Work",
  logo: "icon:ph:briefcase",
  description: "Work accounts and tools.",
  attributes: { email: "ada@work.example", given_name: "Ada" },
  created_at: "2026-11-14T10:00:00Z",
  updated_at: "2026-11-15T09:00:00Z",
};
const bare: Identity = {
  ...work,
  id: "22222222-2222-4222-8222-222222222222",
  name: "Personal",
  description: null,
  attributes: {},
};
const shop: IdentityApplication = {
  client_id: "c1",
  name: "Shop",
  linked_at: 1_794_700_000,
  last_used_at: 1_794_745_000,
  shared: [{ name: "email", value: "ada@work.example", since: 1_794_700_100 }],
  refused: ["given_name"],
};

describe("the export of an account", () => {
  it("holds every identity with its label, its attributes and its applications", () => {
    const file = buildExport("id.example.org", NOW, [work, bare], {
      [work.id]: [shop],
    });
    expect(file).toEqual({
      format: "brigid-export",
      version: 1,
      server: "id.example.org",
      exported_at: "2026-11-15T12:34:56Z",
      identities: [
        {
          id: work.id,
          name: "Work",
          icon: "icon:ph:briefcase",
          description: "Work accounts and tools.",
          attributes: { email: "ada@work.example", given_name: "Ada" },
          created_at: "2026-11-14T10:00:00Z",
          updated_at: "2026-11-15T09:00:00Z",
          applications: [
            {
              name: "Shop",
              client_id: "c1",
              first_sign_in: "2026-11-14T23:46:40Z",
              last_sign_in: "2026-11-15T12:16:40Z",
              shared: [
                {
                  attribute: "email",
                  value: "ada@work.example",
                  accepted_at: "2026-11-14T23:48:20Z",
                },
              ],
              refused: ["given_name"],
            },
          ],
        },
        {
          id: bare.id,
          name: "Personal",
          icon: "icon:ph:briefcase",
          description: null,
          attributes: {},
          created_at: "2026-11-14T10:00:00Z",
          updated_at: "2026-11-15T09:00:00Z",
          applications: [],
        },
      ],
    });
  });

  it("is plain JSON: reading it back gives the same thing", () => {
    const file = buildExport("id.example.org", NOW, [work], { [work.id]: [shop] });
    expect(JSON.parse(JSON.stringify(file, null, 2))).toEqual(file);
  });

  it("is named after the server and the day", () => {
    expect(exportFileName("id.example.org", NOW)).toBe(
      "brigid-export-id.example.org-2026-11-15.json",
    );
  });
});
