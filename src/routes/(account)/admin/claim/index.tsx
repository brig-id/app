import { $, component$, useSignal, useVisibleTask$ } from "@qwik.dev/core";
import { type DocumentHead, Link, useNavigate } from "@qwik.dev/router";
import { Callout } from "~/components/ui/callout";
import { type Message, Said, T, titled } from "~/i18n";
import { claimAdministrator } from "~/lib/admin";
import { SessionEndedError } from "~/lib/api";
import { failure } from "~/lib/errors";
import { linkFromAddress, reloadOnLink } from "~/lib/links";

/**
 * Becoming an administrator with a link made on the server's machine: for a
 * server that has accounts and no administrator. The account that opens the
 * link, signed in, gets the role. Reaching the machine is the proof.
 */
export default component$(() => {
  const nav = useNavigate();
  const link = useSignal<string | null>(null);
  const read = useSignal(false);
  const busy = useSignal(false);
  const claimed = useSignal(false);
  const error = useSignal<Message | null>(null);

  useVisibleTask$(({ cleanup }) => {
    cleanup(titled("title.claim"));
    link.value = linkFromAddress("link");
    cleanup(reloadOnLink("link", () => link.value));
    read.value = true;
  });

  const claim = $(async () => {
    if (!link.value) return;
    busy.value = true;
    error.value = null;
    try {
      await claimAdministrator(link.value);
      claimed.value = true;
    } catch (err) {
      if (err instanceof SessionEndedError) await nav("/");
      else error.value = failure(err, "error.unexpected");
    } finally {
      busy.value = false;
    }
  });

  return (
    <div class="page stack stack--loose">
      <h1>
        <T id="claim.title" />
      </h1>
      {error.value && (
        <Callout kind="danger" alert>
          <Said message={error.value} />
        </Callout>
      )}
      {claimed.value ? (
        <>
          <Callout kind="success" alert>
            <T id="claim.done" />
          </Callout>
          <p>
            <Link href="/admin/" class="button button--primary">
              <T id="claim.go" />
            </Link>
          </p>
        </>
      ) : !read.value ? null : link.value ? (
        <>
          <p>
            <T id="claim.lead" />
          </p>
          <div class="cluster">
            <button
              type="button"
              class="button button--primary"
              disabled={busy.value}
              onClick$={claim}
            >
              <T id="claim.button" />
            </button>
          </div>
        </>
      ) : (
        <Callout kind="info">
          <T id="claim.no-link" />
        </Callout>
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: "Become an administrator · brig·id",
};
