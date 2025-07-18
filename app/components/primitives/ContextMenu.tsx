import * as ContextMenuPrimitive from "@radix-ui/react-context-menu";
import { LocationDescriptor } from "history";
import * as React from "react";
import styled from "styled-components";
import { depths, s } from "@shared/styles";
import Scrollable from "~/components/Scrollable";
import { fadeAndScaleIn } from "~/styles/animations";
import {
  MenuButton,
  MenuExternalLink,
  MenuHeader,
  MenuInternalLink,
  MenuLabel,
  MenuSeparator,
} from "./components/Menu";

const ContextMenu = ContextMenuPrimitive.Root;

const ContextMenuTrigger = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Trigger>
>((props, ref) => {
  const { children, ...rest } = props;
  return (
    <ContextMenuPrimitive.Trigger ref={ref} {...rest} asChild>
      {children}
    </ContextMenuPrimitive.Trigger>
  );
});
ContextMenuTrigger.displayName = ContextMenuPrimitive.Trigger.displayName;

const ContextMenuContent = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Content>
>((props, ref) => {
  const { children, ...rest } = props;

  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.Content ref={ref} {...rest} asChild>
        <StyledScrollable hiddenScrollbars>{children}</StyledScrollable>
      </ContextMenuPrimitive.Content>
    </ContextMenuPrimitive.Portal>
  );
});
ContextMenuContent.displayName = ContextMenuPrimitive.Content.displayName;

type ContextMenuGroupProps = {
  label: string;
  items: React.ReactNode[];
} & Omit<
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Group>,
  "children" | "asChild"
>;

const ContextMenuGroup = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Group>,
  ContextMenuGroupProps
>((props, ref) => {
  const { label, items, ...rest } = props;

  return (
    <ContextMenuPrimitive.Group ref={ref} {...rest}>
      <ContextMenuLabel>{label}</ContextMenuLabel>
      {items}
    </ContextMenuPrimitive.Group>
  );
});
ContextMenuGroup.displayName = ContextMenuPrimitive.Group.displayName;

type BaseContextMenuItemProps = {
  label: string;
  icon?: React.ReactElement;
  disabled?: boolean;
};

type ContextMenuButtonProps = BaseContextMenuItemProps & {
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  dangerous?: boolean;
} & Omit<
    React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Item>,
    "children" | "asChild" | "onClick"
  >;

const ContextMenuButton = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Item>,
  ContextMenuButtonProps
>((props, ref) => {
  const { label, icon, disabled, dangerous, onClick, ...rest } = props;

  return (
    <ContextMenuPrimitive.Item ref={ref} {...rest} asChild>
      <MenuButton disabled={disabled} $dangerous={dangerous} onClick={onClick}>
        {icon}
        <MenuLabel>{label}</MenuLabel>
      </MenuButton>
    </ContextMenuPrimitive.Item>
  );
});
ContextMenuButton.displayName = "ContextMenuButton";

type ContextMenuInternalLinkProps = BaseContextMenuItemProps & {
  to: LocationDescriptor;
} & Omit<
    React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Item>,
    "children" | "asChild" | "onClick"
  >;

const ContextMenuInternalLink = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Item>,
  ContextMenuInternalLinkProps
>((props, ref) => {
  const { label, icon, disabled, to, ...rest } = props;

  return (
    <ContextMenuPrimitive.Item ref={ref} {...rest} asChild>
      <MenuInternalLink to={to} disabled={disabled}>
        {icon}
        <MenuLabel>{label}</MenuLabel>
      </MenuInternalLink>
    </ContextMenuPrimitive.Item>
  );
});
ContextMenuInternalLink.displayName = "ContextMenuInternalLink";

type ContextMenuExternalLinkProps = BaseContextMenuItemProps & {
  href: string;
  target?: string;
} & Omit<
    React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Item>,
    "children" | "asChild" | "onClick"
  >;

const ContextMenuExternalLink = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Item>,
  ContextMenuExternalLinkProps
>((props, ref) => {
  const { label, icon, disabled, href, target, ...rest } = props;

  return (
    <ContextMenuPrimitive.Item ref={ref} {...rest} asChild>
      <MenuExternalLink href={href} target={target} disabled={disabled}>
        {icon}
        <MenuLabel>{label}</MenuLabel>
      </MenuExternalLink>
    </ContextMenuPrimitive.Item>
  );
});
ContextMenuExternalLink.displayName = "ContextMenuExternalLink";

const ContextMenuSeparator = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Separator>
>((props, ref) => (
  <ContextMenuPrimitive.Separator ref={ref} {...props} asChild>
    <MenuSeparator />
  </ContextMenuPrimitive.Separator>
));
ContextMenuSeparator.displayName = "ContextMenuSeparator";

const ContextMenuLabel = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Label>
>(({ className, children, ...props }, ref) => (
  <ContextMenuPrimitive.Label ref={ref} {...props} asChild>
    <MenuHeader>{children}</MenuHeader>
  </ContextMenuPrimitive.Label>
));
ContextMenuLabel.displayName = ContextMenuPrimitive.Label.displayName;

/** Styled components */
const StyledScrollable = styled(Scrollable)`
  z-index: ${depths.menu};
  min-width: 180px;
  max-width: 276px;
  min-height: 44px;
  max-height: 75vh;
  font-weight: normal;

  background: ${s("menuBackground")};
  box-shadow: ${s("menuShadow")};
  border-radius: 6px;
  padding: 6px;
  outline: none;

  transform-origin: var(--radix-context-menu-content-transform-origin);

  &[data-state="open"] {
    animation: ${fadeAndScaleIn} 150ms ease-out;
  }

  @media print {
    display: none;
  }
`;

export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuButton,
  ContextMenuInternalLink,
  ContextMenuExternalLink,
  ContextMenuSeparator,
  ContextMenuGroup,
  ContextMenuLabel,
};
