import { component$, type Signal } from "@qwik.dev/core";
import { LogoIcon } from "~/components/ui/icon";
import { isMessage, T } from "~/i18n";
import { ICON_GROUPS, logoRef } from "~/lib/icons";

/**
 * Picks a logo from the library. Buttons that stay pressed: `aria-pressed`
 * marks the choice, and each icon has its name for a screen reader.
 */
export const IconPicker = component$<{ value: Signal<string> }>(({ value }) => (
  <div class="icon-picker">
    {ICON_GROUPS.map((group) => (
      <fieldset key={group.key}>
        <legend>
          <T id={`icons.group.${group.key}`} />
        </legend>
        <div class="icon-picker-grid">
          {group.icons.map((name) => {
            const label = `icon.${name}`;
            return (
              <button
                key={name}
                type="button"
                class="icon-option"
                aria-pressed={value.value === logoRef(name)}
                onClick$={() => {
                  value.value = logoRef(name);
                }}
              >
                <LogoIcon name={name} />
                <span class="sr-only">
                  <T id={isMessage(label) ? label : "icon.unknown"} />
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>
    ))}
  </div>
));
