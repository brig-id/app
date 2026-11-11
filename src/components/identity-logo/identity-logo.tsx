import { component$ } from "@builder.io/qwik";
import { logoLabel, parseLogo } from "~/lib/icons";

/** An identity's logo, drawn from its `icon:<style>:<name>` reference. */
export const IdentityLogo = component$<{
  logo: string;
  size?: "s" | "m" | "l";
}>(({ logo, size = "m" }) => {
  const icon = parseLogo(logo) ?? { name: "circle-user", variant: "solid" };
  return (
    <span class={`identity-logo identity-logo--${size}`}>
      <wa-icon
        name={icon.name}
        family={icon.family}
        variant={icon.variant}
        label={logoLabel(logo)}
      ></wa-icon>
    </span>
  );
});
