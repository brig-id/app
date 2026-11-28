import { describe, expect, it } from "vitest";
import { isMessage } from "~/i18n";
import type { AuthorizationRequest, Identity } from "./api-types";
import {
  askedRows,
  ATTRIBUTES,
  attributeLabel,
  AUTOCOMPLETE,
  blocking,
  identitiesSharingMailbox,
  isAttribute,
  mailbox,
  sharedAtFirst,
  toShare,
} from "./attributes";

const identity = (
  id: string,
  attributes: Identity["attributes"] = {},
): Identity => ({
  id,
  name: id,
  logo: "icon:ph:user",
  description: null,
  attributes,
  created_at: "2026-11-15T00:00:00Z",
  updated_at: "2026-11-15T00:00:00Z",
});

const request = (
  overrides: Partial<AuthorizationRequest> = {},
): AuthorizationRequest => ({
  client: { name: "Shop" },
  signed_in: true,
  must_sign_in: false,
  silent: false,
  force_choice: false,
  needs_recovery_code: false,
  identities: [
    identity("work", { email: "ada@work.example", given_name: "Ada" }),
    identity("bare"),
  ],
  chosen: null,
  asked: [
    { name: "given_name", required: false },
    { name: "email", required: true },
    { name: "locale", required: false },
  ],
  decisions: {},
  ...overrides,
});

describe("attributes", () => {
  it("each has a name for a person and a hint for the browser", () => {
    for (const name of ATTRIBUTES) {
      expect(isMessage(attributeLabel(name)), name).toBe(true);
      expect(AUTOCOMPLETE[name], name).toBeTruthy();
    }
  });

  it("a label is not an attribute", () => {
    expect(isAttribute("email")).toBe(true);
    expect(isAttribute("name")).toBe(false);
    expect(isAttribute("toString")).toBe(false);
  });
});

describe("the same mailbox", () => {
  it("ignores case and the +tag", () => {
    expect(mailbox(" Ada+Work@Example.org ")).toBe("ada@example.org");
    expect(mailbox("ada@example.org")).toBe("ada@example.org");
    expect(mailbox("not an address")).toBe("not an address");
  });

  it("is found on the other identities of the account", () => {
    const identities = [
      identity("a", { email: "ada@example.org" }),
      identity("b", { email: "Ada+shop@example.org" }),
      identity("c", { email: "someone@example.org" }),
      identity("d"),
    ];
    const names = (id: string, email: string) =>
      identitiesSharingMailbox(identities, id, email).map((i) => i.id);
    expect(names("a", "ada@example.org")).toEqual(["b"]);
    expect(names("d", "ADA@example.org")).toEqual(["a", "b"]);
    expect(names("d", "other@example.org")).toEqual([]);
    expect(names("d", "  ")).toEqual([]);
  });
});

describe("what an application asks for", () => {
  it("is shown with the value of the chosen identity", () => {
    expect(askedRows(request(), "work")).toEqual([
      { name: "given_name", required: false, value: "Ada", decided: null },
      {
        name: "email",
        required: true,
        value: "ada@work.example",
        decided: null,
      },
      { name: "locale", required: false, value: null, decided: null },
    ]);
    expect(askedRows(request(), "bare").map((row) => row.value)).toEqual([
      null,
      null,
      null,
    ]);
  });

  it("is empty when the application asks for the identifier only", () => {
    expect(askedRows(request({ asked: [] }), "work")).toEqual([]);
  });

  it("leaves out an attribute this interface cannot name", () => {
    const rows = askedRows(
      request({ asked: [{ name: "from_a_newer_server", required: true }] }),
      "work",
    );
    expect(rows).toEqual([]);
  });

  it("shares every optional attribute the identity has, unless refused before", () => {
    // Nothing decided yet: the first name is shared, the address is not a
    // choice (required), and the identity has no language.
    expect(sharedAtFirst(askedRows(request(), "work"))).toEqual(["given_name"]);
    // Refused last time for this application: it stays off.
    const rows = askedRows(
      request({ decisions: { work: { email: true, given_name: false } } }),
      "work",
    );
    expect(rows.map((row) => row.decided)).toEqual([
      "refused",
      "accepted",
      null,
    ]);
    expect(sharedAtFirst(rows)).toEqual([]);
    // An identity with nothing to share shares nothing.
    expect(sharedAtFirst(askedRows(request(), "bare"))).toEqual([]);
  });

  it("is stopped by a required attribute the identity lacks, and by that only", () => {
    expect(blocking(askedRows(request(), "work"))).toEqual([]);
    expect(blocking(askedRows(request(), "bare"))).toEqual(["email"]);
  });

  it("always sends what is required, and the optional attributes left shared", () => {
    const rows = askedRows(request(), "work");
    expect(toShare(rows, ["given_name"])).toEqual(["given_name", "email"]);
    // Everything optional turned off: the required address still goes.
    expect(toShare(rows, [])).toEqual(["email"]);
    // What is not asked, or absent from the identity, never goes.
    expect(toShare(rows, ["locale", "family_name"])).toEqual(["email"]);
    expect(toShare(askedRows(request(), "bare"), ["given_name"])).toEqual([]);
  });
});
