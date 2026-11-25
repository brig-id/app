import { $, component$, useSignal, useVisibleTask$ } from "@qwik.dev/core";
import { type DocumentHead, useNavigate } from "@qwik.dev/router";
import { Callout } from "~/components/ui/callout";
import { Said, T, titled } from "~/i18n";
import { limitsSettings, setLimits } from "~/lib/admin";
import { done, type Notice, notDone } from "~/lib/admin-notice";
import { SessionEndedError } from "~/lib/api";
import { failure } from "~/lib/errors";
import type { ServerLimit } from "~/lib/api-types";
import {
  limitChanges,
  limitFields,
  limitWords,
  parseLimit,
} from "~/lib/limits";

/** An id for a limit's elements, whatever its name. */
const fieldId = (name: string) =>
  `limit-${name.replace(/[^A-Za-z0-9_-]/g, "-")}`;

/**
 * The limits of this server: what one account, or one network address, may
 * do. Each is a whole number from 1 to a maximum the server sets; the
 * changes are sent together, with one Save.
 */
export default component$(() => {
  const nav = useNavigate();
  const limits = useSignal<ServerLimit[] | null>(null);
  /** What each field holds, by the limit's name. */
  const typed = useSignal<Record<string, string>>({});
  const notice = useSignal<Notice>(null);
  const busy = useSignal(false);

  const failed = $(async (err: unknown) => {
    if (err instanceof SessionEndedError) await nav("/");
    else notice.value = notDone(err);
  });

  /** Shows what the server holds, in the list and in the fields. */
  const show = $((held: ServerLimit[]) => {
    limits.value = held;
    typed.value = limitFields(held);
  });

  useVisibleTask$(async ({ cleanup }) => {
    cleanup(titled("title.admin"));
    try {
      const settings = await limitsSettings();
      if (settings === null) {
        // A server older than this page: it has no limits to change.
        notice.value = { kind: "info", message: { id: "admin.limits.absent" } };
      } else {
        await show(settings.limits);
      }
    } catch (err) {
      if (err instanceof SessionEndedError) await nav("/");
      else {
        notice.value = {
          kind: "danger",
          message: failure(err, "admin.limits.load-failed"),
        };
      }
    }
  });

  const type = $((name: string, value: string) => {
    typed.value = { ...typed.value, [name]: value };
  });

  const save = $(async () => {
    const held = limits.value;
    if (held === null) return;
    notice.value = null;
    const { changes, invalid } = limitChanges(held, typed.value);
    if (invalid.length > 0) {
      notice.value = { kind: "danger", message: { id: "admin.limits.check" } };
      document.getElementById(fieldId(invalid[0]!))?.focus();
      return;
    }
    if (Object.keys(changes).length === 0) {
      notice.value = {
        kind: "info",
        message: { id: "admin.limits.unchanged" },
      };
      return;
    }
    busy.value = true;
    try {
      // The server answers with every limit as it now holds them.
      await show((await setLimits(changes)).limits);
      notice.value = done({ id: "common.saved" });
    } catch (err) {
      // What was typed stays, to be saved again; the page says it was not.
      await failed(err);
    } finally {
      busy.value = false;
    }
  });

  return (
    <>
      <div class="stack stack--tight">
        <h1>
          <T id="admin.limits.title" />
        </h1>
        <p class="quiet">
          <T id="admin.limits.lead" />
        </p>
      </div>

      {notice.value && (
        <Callout kind={notice.value.kind} alert>
          <Said message={notice.value.message} />
        </Callout>
      )}

      {limits.value === null && !notice.value && (
        <output class="quiet">
          <T id="common.loading" />
        </output>
      )}
      {limits.value?.length === 0 && (
        <p class="quiet">
          <T id="admin.limits.none" />
        </p>
      )}

      {limits.value !== null && limits.value.length > 0 && (
        <form
          class="stack stack--loose"
          noValidate
          preventdefault:submit
          onSubmit$={save}
        >
          <ul class="limits">
            {limits.value.map((limit) => {
              const id = fieldId(limit.name);
              const words = limitWords(limit.name);
              const value = typed.value[limit.name] ?? "";
              const valid = parseLimit(value, limit.max) !== null;
              const described = [
                `${id}-about`,
                `${id}-range`,
                ...(valid ? [] : [`${id}-error`]),
              ].join(" ");
              return (
                <li key={limit.name} class="card field" data-limit={limit.name}>
                  <label class="field-control">
                    <span class="field-label" id={`${id}-label`}>
                      {words ? (
                        <T id={words.label} />
                      ) : (
                        <span class="mono">{limit.name}</span>
                      )}
                    </span>
                    <input
                      id={id}
                      class="input limit-value"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={limit.max}
                      step={1}
                      required
                      value={value}
                      disabled={busy.value}
                      aria-invalid={valid ? undefined : "true"}
                      aria-describedby={described}
                      onInput$={(_, input) => type(limit.name, input.value)}
                    />
                  </label>
                  <span id={`${id}-about`} class="field-hint">
                    <T id={words ? words.about : "admin.limits.unknown"} />
                  </span>
                  {!valid && (
                    <span id={`${id}-error`} class="field-error">
                      <T id="admin.limits.not-valid" p={{ max: limit.max }} />
                    </span>
                  )}
                  <div class="split">
                    <span id={`${id}-range`} class="quiet small">
                      <T
                        id="admin.limits.range"
                        p={{ default: limit.default, max: limit.max }}
                      />
                    </span>
                    <button
                      type="button"
                      class="button button--small"
                      disabled={busy.value || value === String(limit.default)}
                      aria-describedby={`${id}-label`}
                      onClick$={() => type(limit.name, String(limit.default))}
                    >
                      <T id="admin.limits.reset" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
          <div class="cluster">
            <button
              type="submit"
              class="button button--primary"
              disabled={busy.value}
            >
              <T id="common.save" />
            </button>
          </div>
        </form>
      )}

      <p class="quiet small">
        <T id="admin.confirm.hint" />
      </p>
    </>
  );
});

export const head: DocumentHead = {
  title: "Administration · brig·id",
};
