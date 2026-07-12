'use client';

import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

  return (
    <Select
      value={value}
      onValueChange={onChange}
      open={open}
      onOpenChange={onOpenChange}
      className={className}
    >
      <SelectTrigger id={id}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className={maxListHeight}>
        {props.groups
          ? props.groups.map((group, gi) => (
              <React.Fragment key={group.label}>
                {gi > 0 ? <SelectSeparator /> : null}
                <SelectGroup>
                  <SelectLabel>{group.label}</SelectLabel>
                  {group.options.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      description={option.description}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </React.Fragment>
            ))
          : props.options.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                description={option.description}
              >
                {option.label}
              </SelectItem>
            ))}
      </SelectContent>
    </Select>
  );
}