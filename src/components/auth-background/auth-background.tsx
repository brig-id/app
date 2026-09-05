import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import {
  getDailyBackgroundPhoto,
  UNSPLASH_HOME,
  type UnsplashPhoto,
} from "~/lib/unsplash";

/** Fixed full-viewport background for the login/register pages: a
 * daily-rotating Unsplash photo with a dark scrim (guaranteeing text
 * contrast on its own, regardless of the photo) and the attribution
 * Unsplash's API Guidelines require. Degrades to a plain dark background
 * (no image) if no access key is configured or the request fails. */
export const AuthBackground = component$(() => {
  const photo = useSignal<UnsplashPhoto | null>(null);
  // Separate from `photo`: fetching the photo record only proves the API
  // call succeeded, not that the (much heavier) actual JPEG has finished
  // downloading — fade in on the image's own load event, not a fixed
  // timer, so a slow connection never shows a half-loaded flash-in.
  const imageLoaded = useSignal(false);

  useVisibleTask$(async () => {
    photo.value = await getDailyBackgroundPhoto();
  });

  return (
    <div class="auth-bg">
      {photo.value && (
        <img
          class={
            imageLoaded.value ? "auth-bg-image is-loaded" : "auth-bg-image"
          }
          src={photo.value.url}
          alt=""
          onLoad$={() => {
            imageLoaded.value = true;
          }}
        />
      )}
      <div class="auth-bg-scrim"></div>
      {photo.value && (
        <span class="auth-bg-credit">
          Photo by{" "}
          <a
            href={photo.value.photographerLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            {photo.value.photographerName}
          </a>{" "}
          on{" "}
          <a href={UNSPLASH_HOME} target="_blank" rel="noopener noreferrer">
            Unsplash
          </a>
        </span>
      )}
    </div>
  );
});
