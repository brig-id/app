import { $, component$, useSignal, useVisibleTask$ } from "@qwik.dev/core";
import { type DocumentHead, useNavigate } from "@qwik.dev/router";
import { Callout } from "~/components/ui/callout";
import { dateParam, type MessageId, Said, T, titled } from "~/i18n";
import {
  invitationAddress,
  invite,
  revokeInvitation,
  setSignupPolicy,
  signupSettings,
} from "~/lib/admin";
import { done, type Notice, notDone } from "~/lib/admin-notice";
import { SessionEndedError } from "~/lib/api";
import type { Invitation, SignupPolicy } from "~/lib/api-types";

const POLICIES: readonly {
  value: SignupPolicy;
  label: MessageId;
  about: MessageId;
}[] = [
  {
    value: "open",
    label: "admin.signup.open",
    about: "admin.signup.open.about",
  },
  {
    value: "invitation",
    label: "admin.signup.invitation",
    about: "admin.signup.invitation.about",
  },
  {
    value: "closed",
    label: "admin.signup.closed",
    about: "admin.signup.closed.about",
  },
];

/**
 * Who may create an account on this server, and the invitations: links
 * that create as many accounts as their maker says.
 */
export default component$(() => {
  const nav = useNavigate();
  const policy = useSignal<SignupPolicy | null>(null);
  const invitations = useSignal<Invitation[]>([]);
  const notice = useSignal<Notice>(null);
  const busy = useSignal(false);
  const uses = useSignal("1");
  const days = useSignal("7");
  /** The address of the invitation just made: shown once. */
  const address = useSignal<string | null>(null);

  const failed = $(async (err: unknown) => {
    if (err instanceof SessionEndedError) await nav("/");
    else notice.value = notDone(err);
  });

  const refresh = $(async () => {
    try {
      const settings = await signupSettings();
      policy.value = settings.policy;
      invitations.value = settings.invitations;
    } catch (err) {
      await failed(err);
    }
  });

  useVisibleTask$(async ({ cleanup }) => {
    cleanup(titled("title.admin"));
    await refresh();
  });

  const choose = $(async (value: SignupPolicy) => {
    busy.value = true;
    notice.value = null;
    // The choice shown is the one being asked for; if it is refused, reading
    // the server's again below puts the earlier one back on the page.
    policy.value = value;
    try {
      await setSignupPolicy(value);
      notice.value = done({ id: "common.saved" });
    } catch (err) {
      await failed(err);
    } finally {
      busy.value = false;
      // What the server holds, whether the change was made or not.
      await refresh();
    }
  });

  const create = $(async () => {
    busy.value = true;
    notice.value = null;
    address.value = null;
    try {
      const made = await invite(Number(uses.value), Number(days.value));
      address.value = invitationAddress(window.location.origin, made.link);
      await refresh();
    } catch (err) {
      await failed(err);
    } finally {
      busy.value = false;
    }
  });

  const revoke = $(async (invitation: Invitation) => {
    busy.value = true;
    notice.value = null;
    try {
      await revokeInvitation(invitation.id);
      notice.value = done({ id: "admin.invite.revoked" });
      await refresh();
    } catch (err) {
      await failed(err);
    } finally {
      busy.value = false;
    }
  });

  return (
    <>
      <h1>
        <T id="admin.signup.title" />
      </h1>

      {notice.value && (
        <Callout kind={notice.value.kind} alert>
          <Said message={notice.value.message} />
        </Callout>
      )}

      {policy.value === null ? (
        <output class="quiet">
          <T id="common.loading" />
        </output>
      ) : (
        <fieldset class="choices policy">
          <legend class="sr-only">
            <T id="admin.signup.title" />
          </legend>
          {POLICIES.map((option) => (
            <label key={option.value} class="choice">
              <input
                type="radio"
                name="policy"
                value={option.value}
                checked={policy.value === option.value}
                disabled={busy.value}
                onChange$={() => choose(option.value)}
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
      )}

      <section class="card stack" aria-labelledby="invitations-title">
        <div class="stack stack--tight">
          <h2 id="invitations-title">
            <T id="admin.invite.title" />
          </h2>
          <p class="quiet">
            <T id="admin.invite.lead" />
          </p>
        </div>
        {policy.value === "closed" && (
          <Callout kind="info">
            <T id="admin.invite.closed-note" />
          </Callout>
        )}

        {address.value && (
          <div class="stack stack--tight">
            <Callout kind="success" alert>
              <T id="admin.invite.created" />
            </Callout>
            <p class="once mono" data-value="invitation">
              {address.value}
            </p>
          </div>
        )}

        <form class="cluster" preventdefault:submit onSubmit$={create}>
          <label class="field-control">
            <span class="field-label small">
              <T id="admin.invite.uses" />
            </span>
            <input
              class="input"
              type="number"
              min={1}
              max={100}
              required
              bind:value={uses}
            />
          </label>
          <label class="field-control">
            <span class="field-label small">
              <T id="admin.invite.days" />
            </span>
            <input
              class="input"
              type="number"
              min={1}
              max={90}
              required
              bind:value={days}
            />
          </label>
          <button type="submit" class="button" disabled={busy.value}>
            <T id="admin.invite.create" />
          </button>
        </form>

        {invitations.value.length === 0 ? (
          <p class="quiet small">
            <T id="admin.invite.none" />
          </p>
        ) : (
          <ul class="shared-list">
            {invitations.value.map((invitation) => (
              <li key={invitation.id} class="shared-row">
                <span class="grow">
                  <T
                    id="admin.invite.left"
                    p={{
                      count: invitation.uses_left,
                      date: dateParam(invitation.expires_at),
                    }}
                  />
                </span>
                <button
                  type="button"
                  class="button button--small"
                  disabled={busy.value}
                  onClick$={() => revoke(invitation)}
                >
                  <T id="admin.invite.revoke" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p class="quiet small">
        <T id="admin.confirm.hint" />
      </p>
    </>
  );
});

export const head: DocumentHead = {
  title: "Administration · brig·id",
};
