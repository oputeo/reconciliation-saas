'use client';

import * as React from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ExpandableOption = {
  value: string;
  label: string;
  description?: string;
};

export type ExpandableOptionGroup = {
  label: string;
  options: ExpandableOption[];
};

type BaseProps = {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  placeholder?: string;
  className?: string;
  maxListHeight?: string;
};

type FlatProps = BaseProps & {
  options: ExpandableOption[];
  groups?: never;
};

type GroupedProps = BaseProps & {
  groups: ExpandableOptionGroup[];
  options?: never;
};

export type ExpandableOptionPickerProps = FlatProps | GroupedProps;

function OptionButton({
  option,
  selected,
  onSelect,
}: {
  option: ExpandableOption;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onSelect}
      className={cn(
        'flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors',
        'hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
        selected && 'bg-accent/80 font-medium',
      )}
    >
      <span className="flex-1 min-w-0">
        <span className="block leading-snug">{option.label}</span>
        {option.description ? (
          <span className="mt-0.5 block text-xs text-muted-foreground leading-relaxed">
            {option.description}
          </span>
        ) : null}
      </span>
      {selected ? <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden /> : null}
    </button>
  );
}

export function ExpandableOptionPicker(props: ExpandableOptionPickerProps) {
  const {
    id,
    value,
    onChange,
    open,
    onOpenChange,
    placeholder = 'Choose an option',
    className,
    maxListHeight = 'max-h-72',
  } = props;

  const flatOptions = props.groups
    ? props.groups.flatMap((g) => g.options)
    : props.options;

  const selectedLabel =
    flatOptions.find((o) => o.value === value)?.label ?? placeholder;

  const toggle = () => onOpenChange(!open);

  const select = (next: string) => {
    onChange(next);
    onOpenChange(false);
  };

  return (
    <div
      className={cn(
        'rounded-md border border-input bg-background shadow-sm transition-shadow',
        open && 'ring-2 ring-ring/30',
        className,
      )}
    >
      <button
        id={id}
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={toggle}
        className={cn(
          'flex w-full min-h-10 items-center justify-between gap-3 px-3 py-2.5 text-sm',
          'hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-inset',
        )}
      >
        <span className={cn('text-left leading-snug', value ? 'text-foreground' : 'text-muted-foreground')}>
          {selectedLabel}
        </span>
        <ChevronDown
          className={cn('size-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label={props.label}
          className={cn('border-t bg-muted/20', maxListHeight, 'overflow-y-auto')}
        >
          {props.groups ? (
            <div className="space-y-1 p-2">
              {props.groups.map((group, gi) => (
                <div key={group.label}>
                  {gi > 0 ? <div className="my-2 border-t" /> : null}
                  <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {group.label}
                  </p>
                  <div className="space-y-0.5">
                    {group.options.map((option) => (
                      <OptionButton
                        key={option.value}
                        option={option}
                        selected={option.value === value}
                        onSelect={() => select(option.value)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-0.5 p-2">
              {props.options.map((option) => (
                <OptionButton
                  key={option.value}
                  option={option}
                  selected={option.value === value}
                  onSelect={() => select(option.value)}
                />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}