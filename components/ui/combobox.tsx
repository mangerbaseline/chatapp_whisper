"use client";

import * as React from "react";
import { Combobox as ComboboxPrimitive } from "@base-ui/react";
import { CheckIcon, ChevronDownIcon, XIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

const Combobox = ComboboxPrimitive.Root;

type BaseUIComponentProps<State> = {
  render?:
    | React.ReactElement
    | ((props: any, state: State) => React.ReactElement);
  className?: string | ((state: State) => string);
  asChild?: boolean;
  children?: React.ReactNode;
};

const Trigger = ComboboxPrimitive.Trigger as React.ComponentType<
  BaseUIComponentProps<any> & any
>;
const Input = ComboboxPrimitive.Input as React.ComponentType<
  BaseUIComponentProps<any> & any
>;
const Popup = ComboboxPrimitive.Popup as React.ComponentType<
  BaseUIComponentProps<any> & any
>;
const Clear = ComboboxPrimitive.Clear as React.ComponentType<
  BaseUIComponentProps<any> & any
>;
const ItemIndicator = ComboboxPrimitive.ItemIndicator as React.ComponentType<
  BaseUIComponentProps<any> & any
>;
const Group = ComboboxPrimitive.Group as React.ComponentType<
  BaseUIComponentProps<any> & any
>;
const GroupLabel = ComboboxPrimitive.GroupLabel as React.ComponentType<
  BaseUIComponentProps<any> & any
>;
const Empty = ComboboxPrimitive.Empty as React.ComponentType<
  BaseUIComponentProps<any> & any
>;
const Chips = ComboboxPrimitive.Chips as React.ComponentType<
  BaseUIComponentProps<any> & any
>;
const Chip = ComboboxPrimitive.Chip as React.ComponentType<
  BaseUIComponentProps<any> & any
>;
const ChipRemove = ComboboxPrimitive.ChipRemove as React.ComponentType<
  BaseUIComponentProps<any> & any
>;
const Portal = ComboboxPrimitive.Portal as React.ComponentType<any>;
const Positioner = ComboboxPrimitive.Positioner as React.ComponentType<
  BaseUIComponentProps<any> & any
>;

function ComboboxValue({
  className,
  children,
  placeholder,
  ...props
}: ComboboxPrimitive.Value.Props & React.ComponentProps<"span">) {
  return (
    <span
      data-slot="combobox-value"
      className={cn("text-sm", className)}
      {...props}
    >
      <ComboboxPrimitive.Value placeholder={placeholder}>
        {children}
      </ComboboxPrimitive.Value>
    </span>
  );
}

function ComboboxTrigger({
  className,
  children,
  ...props
}: ComboboxPrimitive.Trigger.Props & {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <Trigger
      {...props}
      render={
        <button
          type="button"
          data-slot="combobox-trigger"
          className={cn("[&_svg:not([class*='size-'])]:size-4", className)}
        >
          {children}
          <ChevronDownIcon
            data-slot="combobox-trigger-icon"
            className="text-muted-foreground pointer-events-none size-4"
          />
        </button>
      }
    />
  );
}

function ComboboxClear({
  className,
  children,
  ...props
}: ComboboxPrimitive.Clear.Props & {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <Clear
      {...props}
      render={
        <InputGroupButton
          size="icon-xs"
          variant="ghost"
          data-slot="combobox-clear"
          className={cn("data-pressed:bg-transparent", className)}
        >
          <XIcon className="pointer-events-none" />
          {children}
        </InputGroupButton>
      }
    />
  );
}

function ComboboxInput({
  className,
  children,
  disabled = false,
  showTrigger = true,
  showClear = false,
  ...props
}: ComboboxPrimitive.Input.Props & {
  showTrigger?: boolean;
  showClear?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <InputGroup className={cn("w-auto", className)}>
      <Input render={<InputGroupInput disabled={disabled} />} {...props} />
      <InputGroupAddon align="inline-end">
        {showTrigger && (
          <InputGroupButton
            size="icon-xs"
            variant="ghost"
            asChild
            data-slot="input-group-button"
            className="group-has-data-[slot=combobox-clear]/input-group:hidden data-pressed:bg-transparent"
            disabled={disabled}
          >
            <ComboboxTrigger />
          </InputGroupButton>
        )}
        {showClear && <ComboboxClear disabled={disabled} />}
      </InputGroupAddon>
      {children}
    </InputGroup>
  );
}

function ComboboxContent({
  className,
  side = "bottom",
  sideOffset = 6,
  align = "start",
  alignOffset = 0,
  anchor,
  ...props
}: ComboboxPrimitive.Popup.Props & {
  className?: string;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  alignOffset?: number;
  anchor?: any;
}) {
  return (
    <Portal>
      <Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        anchor={anchor}
        className="isolate z-50"
      >
        <Popup
          {...props}
          render={
            <div
              data-slot="combobox-content"
              data-chips={!!anchor}
              className={cn(
                "bg-popover text-popover-foreground data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 ring-foreground/10 *:data-[slot=input-group]:bg-input/30 *:data-[slot=input-group]:border-input/30 group/combobox-content relative max-h-96 w-(--anchor-width) max-w-(--available-width) min-w-[calc(var(--anchor-width)+--spacing(7))] origin-(--transform-origin) overflow-hidden rounded-md shadow-md ring-1 duration-100 data-[chips=true]:min-w-(--anchor-width) *:data-[slot=input-group]:m-1 *:data-[slot=input-group]:mb-0 *:data-[slot=input-group]:h-8 *:data-[slot=input-group]:shadow-none",
                className,
              )}
            />
          }
        />
      </Positioner>
    </Portal>
  );
}

function ComboboxList({ className, ...props }: ComboboxPrimitive.List.Props) {
  return (
    <ComboboxPrimitive.List
      data-slot="combobox-list"
      className={cn(
        "max-h-[min(calc(--spacing(96)---spacing(9)),calc(var(--available-height)---spacing(9)))] scroll-py-1 overflow-y-auto p-1 data-empty:p-0",
        className,
      )}
      {...props}
    />
  );
}

function ComboboxItem({
  className,
  children,
  ...props
}: ComboboxPrimitive.Item.Props & {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <ComboboxPrimitive.Item
      {...props}
      render={
        <div
          data-slot="combobox-item"
          className={cn(
            "data-highlighted:bg-accent data-highlighted:text-accent-foreground relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
            className,
          )}
        >
          {children}
          <ItemIndicator
            render={
              <span
                data-slot="combobox-item-indicator"
                className="pointer-events-none absolute right-2 flex size-4 items-center justify-center"
              >
                <CheckIcon className="pointer-events-none size-4 pointer-coarse:size-5" />
              </span>
            }
          />
        </div>
      }
    />
  );
}

function ComboboxGroup({
  className,
  ...props
}: ComboboxPrimitive.Group.Props & { className?: string }) {
  return (
    <Group
      {...props}
      render={<div data-slot="combobox-group" className={cn(className)} />}
    />
  );
}

function ComboboxLabel({
  className,
  ...props
}: ComboboxPrimitive.GroupLabel.Props & { className?: string }) {
  return (
    <GroupLabel
      {...props}
      render={
        <div
          data-slot="combobox-label"
          className={cn(
            "text-muted-foreground px-2 py-1.5 text-xs pointer-coarse:px-3 pointer-coarse:py-2 pointer-coarse:text-sm",
            className,
          )}
        />
      }
    />
  );
}

function ComboboxCollection({ ...props }: ComboboxPrimitive.Collection.Props) {
  return <ComboboxPrimitive.Collection {...props} />;
}

function ComboboxEmpty({
  className,
  ...props
}: ComboboxPrimitive.Empty.Props & { className?: string }) {
  return (
    <Empty
      {...props}
      render={
        <div
          data-slot="combobox-empty"
          className={cn(
            "text-muted-foreground hidden w-full justify-center py-2 text-center text-sm group-data-empty/combobox-content:flex",
            className,
          )}
        />
      }
    />
  );
}

function ComboboxSeparator({
  className,
  ...props
}: ComboboxPrimitive.Separator.Props & { className?: string }) {
  return (
    <ComboboxPrimitive.Separator
      {...props}
      render={
        <div
          data-slot="combobox-separator"
          className={cn("bg-border -mx-1 my-1 h-px", className)}
        />
      }
    />
  );
}

function ComboboxChips({
  className,
  ...props
}: React.ComponentPropsWithRef<typeof ComboboxPrimitive.Chips> &
  ComboboxPrimitive.Chips.Props & { className?: string }) {
  return (
    <Chips
      {...props}
      render={
        <div
          data-slot="combobox-chips"
          className={cn(
            "dark:bg-input/30 border-input focus-within:border-ring focus-within:ring-ring/50 has-aria-invalid:ring-destructive/20 dark:has-aria-invalid:ring-destructive/40 has-aria-invalid:border-destructive dark:has-aria-invalid:border-destructive/50 flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border bg-transparent bg-clip-padding px-2.5 py-1.5 text-sm shadow-xs transition-[color,box-shadow] focus-within:ring-[3px] has-aria-invalid:ring-[3px] has-data-[slot=combobox-chip]:px-1.5",
            className,
          )}
        />
      }
    />
  );
}

function ComboboxChip({
  className,
  children,
  showRemove = true,
  ...props
}: ComboboxPrimitive.Chip.Props & {
  showRemove?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <Chip
      {...props}
      render={
        <div
          data-slot="combobox-chip"
          className={cn(
            "bg-muted text-foreground flex h-[calc(--spacing(5.5))] w-fit items-center justify-center gap-1 rounded-sm px-1.5 text-xs font-medium whitespace-nowrap has-disabled:pointer-events-none has-disabled:cursor-not-allowed has-disabled:opacity-50 has-data-[slot=combobox-chip-remove]:pr-0",
            className,
          )}
        >
          {children}
          {showRemove && (
            <ChipRemove
              render={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="-ml-1 opacity-50 hover:opacity-100"
                  data-slot="combobox-chip-remove"
                >
                  <XIcon className="pointer-events-none" />
                </Button>
              }
            />
          )}
        </div>
      }
    />
  );
}

function ComboboxChipsInput({
  className,
  children,
  ...props
}: ComboboxPrimitive.Input.Props & {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <Input
      {...props}
      render={
        <input
          data-slot="combobox-chip-input"
          className={cn("min-w-16 flex-1 outline-none", className)}
        />
      }
    />
  );
}

function useComboboxAnchor() {
  return React.useRef<HTMLDivElement | null>(null);
}

export {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxGroup,
  ComboboxLabel,
  ComboboxCollection,
  ComboboxEmpty,
  ComboboxSeparator,
  ComboboxChips,
  ComboboxChip,
  ComboboxChipsInput,
  ComboboxTrigger,
  ComboboxValue,
  useComboboxAnchor,
};
