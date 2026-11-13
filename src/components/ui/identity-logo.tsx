import { logoName } from "~/lib/icons";
import { LogoIcon } from "./icon";

/**
 * An identity's logo, drawn from its `icon:ph:<name>` reference. Decoration:
 * the identity's name is always written next to it.
 */
export const IdentityLogo = (props: {
  logo: string;
  size?: "s" | "m" | "l";
}) => (
  <span class={`identity-logo identity-logo--${props.size ?? "m"}`}>
    <LogoIcon name={logoName(props.logo)} />
  </span>
);
