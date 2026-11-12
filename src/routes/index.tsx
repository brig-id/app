import { component$, useVisibleTask$ } from "@builder.io/qwik";
import { type DocumentHead, useNavigate } from "@builder.io/qwik-city";
import { checkSession } from "~/lib/api";

export default component$(() => {
  const nav = useNavigate();

  useVisibleTask$(async () => {
    const signedIn = await checkSession().then(
      () => true,
      () => false,
    );
    await nav(signedIn ? "/identities/" : "/login/");
  });

  return null;
});

export const head: DocumentHead = {
  title: "brig·id",
};
