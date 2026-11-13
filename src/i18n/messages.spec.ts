import { describe, expect, it } from "vitest";
import { dateParam, format, isMessage, raw, segments } from "./index";
import { MESSAGES, type MessageId } from "./messages";

const ids = Object.keys(MESSAGES) as MessageId[];
const marks = (text: string) => text.split("**").length - 1;
const placeholders = (text: string) =>
  [...text.matchAll(/\{([a-z-]+)\}/g)].map((m) => m[1]).sort();

describe("messages", () => {
  it("are written in both languages", () => {
    for (const id of ids) {
      const [en, fr] = MESSAGES[id];
      expect(en.trim(), `${id} (en)`).not.toBe("");
      expect(fr.trim(), `${id} (fr)`).not.toBe("");
    }
  });

  it("take the same parameters in both languages", () => {
    for (const id of ids) {
      const [en, fr] = MESSAGES[id];
      expect(placeholders(fr), id).toEqual(placeholders(en));
    }
  });

  it("mark the same number of bold passages, each one closed", () => {
    for (const id of ids) {
      const [en, fr] = MESSAGES[id];
      expect(marks(en) % 2, id).toBe(0);
      expect(marks(fr), id).toBe(marks(en));
    }
  });

  it("use typographic apostrophes, never a straight one", () => {
    for (const id of ids) {
      for (const text of MESSAGES[id]) expect(text, id).not.toContain("'");
    }
  });
});

describe("format", () => {
  it("fills parameters and drops the bold marks", () => {
    expect(format("signin.on", "en", { server: "id.example.org" })).toBe(
      "on id.example.org",
    );
    expect(format("signin.on", "fr", { server: "id.example.org" })).toBe(
      "sur id.example.org",
    );
  });

  it("takes a parameter that differs by language", () => {
    const date = dateParam("2026-11-13T10:00:00Z");
    expect(format("recovery.has", "en", { date })).toContain("13 November 2026");
    expect(format("recovery.has", "fr", { date })).toContain("13 novembre 2026");
  });

  it("leaves an unknown placeholder as it is", () => {
    expect(format("signin.on", "en")).toBe("on {server}");
  });

  it("puts non-breaking spaces where French wants them", () => {
    expect(raw("signin.lost", "fr")).toBe("Clés d’accès perdues ?");
    expect(raw("identity.delete.confirm", "fr")).toContain("« {name} »");
    expect(raw("error.server-said", "fr")).toBe("Le serveur a répondu :");
    expect(raw("signin.lost", "en")).toBe("Lost your passkeys?");
  });
});

describe("segments", () => {
  it("cuts a message at its bold marks", () => {
    expect(segments("continue.title", "en", { app: "Shop" })).toEqual([
      { text: "Continue to ", strong: false },
      { text: "Shop", strong: true },
    ]);
  });

  it("never lets a value add a mark", () => {
    expect(segments("continue.title", "en", { app: "**x** {app}" })).toEqual([
      { text: "Continue to ", strong: false },
      { text: "**x** {app}", strong: true },
    ]);
  });
});

describe("isMessage", () => {
  it("tells an id built from data", () => {
    expect(isMessage("template.work")).toBe(true);
    expect(isMessage("template.from-a-newer-server")).toBe(false);
    expect(isMessage("toString")).toBe(false);
  });
});
