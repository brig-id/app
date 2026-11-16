import { component$ } from "@qwik.dev/core";
import { T } from "~/i18n";
import type { Need } from "~/lib/api-types";
import {
  ATTRIBUTES,
  type AttributeName,
  attributeLabel,
} from "~/lib/attributes";

export type Needs = Record<AttributeName, Need | "">;

/** Every attribute, with nothing an application may ask. */
export function noNeeds(): Needs {
  return Object.fromEntries(ATTRIBUTES.map((name) => [name, ""])) as Needs;
}

/** The needs of a registration, as the form holds them. */
export function needsOf(attributes: Partial<Record<string, Need>>): Needs {
  const needs = noNeeds();
  for (const name of ATTRIBUTES) needs[name] = attributes[name] ?? "";
  return needs;
}

/** What the form holds, as a registration takes it. */
export function toAttributes(needs: Needs): Partial<Record<string, Need>> {
  return Object.fromEntries(
    Object.entries(needs).filter((entry): entry is [string, Need] =>
      Boolean(entry[1]),
    ),
  );
}

/**
 * What an application may ask people to share: for each attribute, whether
 * it may ask at all, and whether it cannot work without it. `needs` is a
 * store the parent reads when the form is sent.
 */
export const AttributeNeeds = component$<{ needs: Needs; group: string }>(
  ({ needs, group }) => (
    <fieldset class="field" aria-describedby={`${group}-hint`}>
      <legend class="field-label">
        <T id="admin.app.attributes" />
      </legend>
      <ul class="needs">
        {ATTRIBUTES.map((name) => (
          <li key={name} class="need" data-attribute={name}>
            <span class="need-name" aria-hidden="true">
              <T id={attributeLabel(name)} />
            </span>
            <label class="need-choice">
              <input
                type="checkbox"
                checked={needs[name] !== ""}
                onChange$={(_, input) => {
                  needs[name] = input.checked ? "optional" : "";
                }}
              />
              <span>
                <span class="sr-only">
                  <T id={attributeLabel(name)} />
                  {": "}
                </span>
                <T id="admin.app.need.ask" />
              </span>
            </label>
            <label class="need-choice">
              <input
                type="checkbox"
                checked={needs[name] === "required"}
                disabled={needs[name] === ""}
                onChange$={(_, input) => {
                  needs[name] = input.checked ? "required" : "optional";
                }}
              />
              <span>
                <span class="sr-only">
                  <T id={attributeLabel(name)} />
                  {": "}
                </span>
                <T id="admin.app.need.required" />
              </span>
            </label>
          </li>
        ))}
      </ul>
      <span id={`${group}-hint`} class="field-hint">
        <T id="admin.app.attributes.hint" />
      </span>
    </fieldset>
  ),
);
