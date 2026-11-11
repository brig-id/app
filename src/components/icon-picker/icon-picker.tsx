import { component$, type Signal } from "@builder.io/qwik";
import { ICON_GROUPS, parseLogo } from "~/lib/icons";

/**
 * Picks a logo from the predefined library. Native buttons (not wa-button)
 * so Qwik's onClick$ works directly; `aria-pressed` marks the choice.
 */
export const IconPicker = component$<{ value: Signal<string> }>(({ value }) => (
  <div class="icon-picker">
    {ICON_GROUPS.map((group) => (
      <fieldset key={group.title} class="icon-picker-group">
        <legend>{group.title}</legend>
        <div class="icon-picker-grid">
          {group.icons.map((icon) => {
            const attrs = parseLogo(icon.ref)!;
            return (
              <button
                key={icon.ref}
                type="button"
                class="icon-picker-option"
                aria-pressed={value.value === icon.ref}
                title={icon.label}
                aria-label={icon.label}
                onClick$={() => {
                  value.value = icon.ref;
                }}
              >
                <wa-icon
                  name={attrs.name}
                  family={attrs.family}
                  variant={attrs.variant}
                  label={icon.label}
                ></wa-icon>
              </button>
            );
          })}
        </div>
      </fieldset>
    ))}
  </div>
));
