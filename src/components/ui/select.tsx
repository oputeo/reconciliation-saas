'use client';

import * as React from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

type SelectContextValue = {
  value: string;
  setValue: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  itemLabels: Map<string, string>;
};

const SelectContext = React.createContext<SelectContextValue | null>(null);

function useSelectContext() {
  const ctx = React.useContext(SelectContext);
  if (!ctx) throw new Error('Select components must be used within <Select>');
  return ctx;
}

function itemLabelFromChildren(children: React.ReactNode): string {
  if (typeof children === 'string' || typeof children === 'number') return String(children);
  if (Array.isArray(children)) return children.map(itemLabelFromChildren).join('');
  return '';
}

function collectItemLabels(node: React.ReactNode, map: Map<string, string>) {
  React.Children.forEach(node, (child) => {
    if (!React.isValidElement(child)) return;
    const type = child.type as { displayName?: string };
    if (type === SelectItem || type.displayName === 'SelectItem') {
      const props = child.props as { value: string; children: React.ReactNode };
      map.set(props.value, itemLabelFromChildren(props.children));
      return;
    }
    if (
      type === SelectContent ||
      type === SelectGroup ||
      type.displayName === 'SelectContent' ||
      type.displayName === 'SelectGroup'
    ) {
      collectItemLabels((child.props as { children: React.ReactNode }).children, map);
    }
  });
}

function Select({
  value: valueProp,
  defaultValue,
  onValueChange,
  open: openProp,
  onOpenChange,
  children,
  disabled,
  className,
}: {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const openControlled = openProp !== undefined;
  const open = openControlled ? openProp : uncontrolledOpen;
  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!openControlled) setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [openControlled, onOpenChange],
  );
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue ?? '');
  const isControlled = valueProp !== undefined;
  const value = isControlled ? valueProp : uncontrolled;

  const itemLabels = React.useMemo(() => {
    const map = new Map<string, string>();
    collectItemLabels(children, map);
    return map;
  }, [children]);

  const setValue = React.useCallback(
    (next: string) => {
      if (!isControlled) setUncontrolled(next);
      onValueChange?.(next);
      setOpen(false);
    },
    [isControlled, onValueChange, setOpen],
  );

  let trigger: React.ReactNode = null;
  let content: React.ReactNode = null;

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    const type = child.type as { displayName?: string };
    if (type === SelectTrigger || type.displayName === 'SelectTrigger') trigger = child;
    if (type === SelectContent || type.displayName === 'SelectContent') content = child;
  });

  const contextValue = React.useMemo(
    () => ({
      value,
      setValue,
      open,
      setOpen,
      itemLabels,
    }),
    [value, setValue, open, setOpen, itemLabels],
  );

  return (
    <SelectContext.Provider value={contextValue}>
      <div
        data-slot="select"
        data-disabled={disabled ? '' : undefined}
        className={cn(
          'w-full rounded-md border border-input bg-background shadow-sm transition-shadow',
          open && 'ring-2 ring-ring/30',
          disabled && 'pointer-events-none opacity-50',
          className,
        )}
      >
        {trigger}
        {open && content}
      </div>
    </SelectContext.Provider>
  );
}

function SelectTrigger({
  className,
  children,
  size = 'default',
  id,
}: {
  className?: string;
  children?: React.ReactNode;
  size?: 'sm' | 'default';
  id?: string;
}) {
  const { open, setOpen } = useSelectContext();

  return (
    <button
      id={id}
      type="button"
      data-slot="select-trigger"
      data-size={size}
      aria-expanded={open}
      aria-haspopup="listbox"
      onClick={() => setOpen(!open)}
      className={cn(
        'flex w-full min-h-10 items-center justify-between gap-2 px-3 py-2.5 text-sm text-left',
        'hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-inset',
        size === 'sm' && 'min-h-8 text-xs',
        className,
      )}
    >
      <span className="flex-1 min-w-0">{children}</span>
      <ChevronDown
        className={cn('size-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')}
        aria-hidden
      />
    </button>
  );
}
SelectTrigger.displayName = 'SelectTrigger';

function SelectValue({ placeholder = 'Select an option' }: { placeholder?: string }) {
  const ctx = useSelectContext();
  const label = ctx.itemLabels.get(ctx.value) ?? '';

  return (
    <span
      data-slot="select-value"
      className={cn('block leading-snug line-clamp-2', label ? 'text-foreground' : 'text-muted-foreground')}
    >
      {label || placeholder}
    </span>
  );
}
SelectValue.displayName = 'SelectValue';

function SelectContent({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      role="listbox"
      data-slot="select-content"
      className={cn(
        'border-t bg-muted/20 max-h-72 overflow-y-auto',
        className,
      )}
    >
      <div className="space-y-0.5 p-2">{children}</div>
    </div>
  );
}
SelectContent.displayName = 'SelectContent';

function SelectGroup({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return <div data-slot="select-group" className={cn('space-y-0.5', className)}>{children}</div>;
}
SelectGroup.displayName = 'SelectGroup';

function SelectLabel({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <p
      data-slot="select-label"
      className={cn(
        'px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground',
        className,
      )}
    >
      {children}
    </p>
  );
}
SelectLabel.displayName = 'SelectLabel';

function SelectItem({
  className,
  children,
  value,
  disabled,
  description,
}: {
  className?: string;
  children?: React.ReactNode;
  value: string;
  disabled?: boolean;
  description?: string;
}) {
  const ctx = useSelectContext();
  const selected = ctx.value === value;

  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      data-slot="select-item"
      disabled={disabled}
      onClick={() => !disabled && ctx.setValue(value)}
      className={cn(
        'flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors',
        'hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
        selected && 'bg-accent/80 font-medium',
        disabled && 'pointer-events-none opacity-50',
        className,
      )}
    >
      <span className="flex-1 min-w-0">
        <span className="block leading-snug whitespace-normal">{children}</span>
        {description ? (
          <span className="mt-0.5 block text-xs text-muted-foreground leading-relaxed">
            {description}
          </span>
        ) : null}
      </span>
      {selected ? <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden /> : null}
    </button>
  );
}
SelectItem.displayName = 'SelectItem';

function SelectSeparator({ className }: { className?: string }) {
  return <div data-slot="select-separator" className={cn('my-2 border-t', className)} />;
}
SelectSeparator.displayName = 'SelectSeparator';

/** @deprecated Inline select no longer uses scroll buttons */
function SelectScrollUpButton() {
  return null;
}

/** @deprecated Inline select no longer uses scroll buttons */
function SelectScrollDownButton() {
  return null;
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};