import { $, component$, useSignal, useVisibleTask$ } from "@qwik.dev/core";
import { type DocumentHead, useNavigate } from "@qwik.dev/router";
import { Callout } from "~/components/ui/callout";
import { Icon } from "~/components/ui/icon";
import { type MessageId, Said, T, titled } from "~/i18n";
import { describedSettings, listWebsite, setDescribed } from "~/lib/admin";
import { done, type Notice, notDone } from "~/lib/admin-notice";
import { SessionEndedError } from "~/lib/api";
import type { DescribedPolicy, DescribedSettings } from "~/lib/api-types";
import { ATTRIBUTES, attributeLabel } from "~/lib/attributes";

const POLICIES: readonly {
  value: DescribedPolicy;
  label: MessageId;
  about: MessageId;
}[] = [
  {
    value: "open",
    label: "admin.websites.open",
    about: "admin.websites.open.about",
  },
  {
    value: "listed",
    label: "admin.websites.listed",
    about: "admin.websites.listed.about",
  },
  {
    value: "registered",
    label: "admin.websites.registered",
    about: "admin.websites.registered.about",
  },
];

/** A `client_id` a website could have: the https URL of its document. */
function looksLikeDocument(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.pathname !== "/";
  } catch {
    return false;
  }
}

/**
 * Websites that describe themselves: they publish a document and sign people
 * in with no registration. Which of them this server accepts, what they may
 * ask for at most, and the two lists.
 */
export default component$(() => {
  const nav = useNavigate();
  const settings = useSignal<DescribedSettings | null>(null);
  const notice = useSignal<Notice>(null);
  const busy = useSignal(false);
  const address = useSignal("");

  const failed = $(async (err: unknown) => {
    if (err instanceof SessionEndedError) await nav("/");
    else notice.value = notDone(err);
  });

  const refresh = $(async () => {
    try {
      settings.value = await describedSettings();
    } catch (err) {
      await failed(err);
    }
  });

  useVisibleTask$(async ({ cleanup }) => {
    cleanup(titled("title.admin"));
    await refresh();
  });

  /** Runs a change, says how it went, then shows what the server holds. */
  const change = $(async (run: () => Promise<void>, message: MessageId) => {
    busy.value = true;
    notice.value = null;
    try {
      await run();
      notice.value = done({ id: message });
    } catch (err) {
      await failed(err);
    } finally {
      busy.value = false;
      await refresh();
    }
  });

  const s = settings.value;
  return (
    <>
      <div class="stack stack--tight">
        <h1>
          <T id="admin.websites.title" />
        </h1>
        <p class="quiet">
          <T id="admin.websites.lead" />
        </p>
      </div>

      {notice.value && (
        <Callout kind={notice.value.kind} alert>
          <Said message={notice.value.message} />
        </Callout>
      )}

      {s === null ? (
        <output class="quiet">
          <T id="common.loading" />
        </output>
      ) : (
        <>
          <fieldset class="choices policy">
            <legend class="field-label">
              <T id="admin.websites.which" />
            </legend>
            {POLICIES.map((option) => (
              <label key={option.value} class="choice">
                <input
                  type="radio"
                  name="described-policy"
                  value={option.value}
                  checked={s.policy === option.value}
                  disabled={busy.value}
                  onChange$={() =>
                    change(
                      () => setDescribed({ policy: option.value }),
                      "common.saved",
                    )
                  }
                />
                <span class="choice-name">
                  <T id={option.label} />
                </span>
                <span class="choice-about quiet small">
                  <T id={option.about} />
                </span>
              </label>
            ))}
          </fieldset>

          <section class="card stack" aria-labelledby="cap-title">
            <div class="stack stack--tight">
              <h2 id="cap-title">
                <T id="admin.websites.cap" />
              </h2>
              <p class="quiet small">
                <T id="admin.websites.cap.lead" />
              </p>
            </div>
            <div class="cluster">
              {ATTRIBUTES.map((name) => (
                <label key={name} class="check">
                  <input
                    type="checkbox"
                    checked={s.attributes.includes(name)}
                    disabled={busy.value}
                    onChange$={(_, input) => {
                      const next = input.checked
                        ? [...s.attributes, name]
                        : s.attributes.filter((a) => a !== name);
                      return change(
                        () => setDescribed({ attributes: next }),
                        "common.saved",
                      );
                    }}
                  />
                  <span>
                    <T id={attributeLabel(name)} />
                  </span>
                </label>
              ))}
            </div>
          </section>

          <section class="card stack" aria-labelledby="lists-title">
            <div class="stack stack--tight">
              <h2 id="lists-title">
                <T id="admin.websites.lists" />
              </h2>
              <p class="quiet small">
                <T id="admin.websites.lists.lead" />
              </p>
            </div>
            <form class="stack" preventdefault:submit>
              <label class="field-control">
                <span class="field-label">
                  <T id="admin.websites.address" />
                </span>
                <input
                  class="input input--mono"
                  type="url"
                  bind:value={address}
                  spellcheck={false}
                  aria-describedby="website-address-hint"
                />
              </label>
              <span id="website-address-hint" class="field-hint">
                <T id="admin.websites.address.hint" />
              </span>
              <div class="cluster">
                <button
                  type="button"
                  class="button button--small"
                  disabled={busy.value || !looksLikeDocument(address.value)}
                  onClick$={async () => {
                    await change(
                      () => listWebsite(address.value.trim(), "accepted"),
                      "admin.websites.accepted.done",
                    );
                    address.value = "";
                  }}
                >
                  <Icon name="check" />
                  <T id="admin.websites.accept" />
                </button>
                <button
                  type="button"
                  class="button button--small button--danger"
                  disabled={busy.value || !looksLikeDocument(address.value)}
                  onClick$={async () => {
                    await change(
                      () => listWebsite(address.value.trim(), "refused"),
                      "admin.websites.refused.done",
                    );
                    address.value = "";
                  }}
                >
                  <Icon name="x" />
                  <T id="admin.websites.refuse" />
                </button>
              </div>
            </form>
            {(["accepted", "refused"] as const).map((list) => {
              const entries = s[list];
              return (
                <div key={list} class="stack stack--tight">
                  <h3>
                    <T
                      id={
                        list === "accepted"
                          ? "admin.websites.accepted"
                          : "admin.websites.refused"
                      }
                    />
                  </h3>
                  {entries.length === 0 ? (
                    <p class="quiet small">
                      <T id="admin.websites.empty" />
                    </p>
                  ) : (
                    <ul class="stack stack--tight">
                      {entries.map((clientId) => (
                        <li key={clientId} class="split">
                          <span class="mono small grow">{clientId}</span>
                          <button
                            type="button"
                            class="button button--small"
                            disabled={busy.value}
                            onClick$={() =>
                              change(
                                () => listWebsite(clientId, null),
                                "admin.websites.unlisted",
                              )
                            }
                          >
                            <T id="admin.websites.unlist" />
                            <span class="sr-only"> {clientId}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </section>
        </>
      )}
    </>
  );
});

export const head: DocumentHead = {
  title: "Websites · Administration · brig·id",
};
