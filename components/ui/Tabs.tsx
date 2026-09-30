'use client';

import React from 'react';
import * as RadixTabs from '@radix-ui/react-tabs';

export interface TabItem {
  id: string;
  label: string;
  badge?: string | number;
  content: React.ReactNode;
  icon?: React.ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  variant?: 'underline' | 'pill';
}

export function Tabs({
  items,
  defaultValue,
  value,
  onValueChange,
  className = '',
  variant = 'underline',
}: TabsProps) {
  const initialValue = defaultValue || items[0]?.id;

  return (
    <RadixTabs.Root
      defaultValue={initialValue}
      value={value}
      onValueChange={onValueChange}
      className={['w-full flex flex-col', className].join(' ')}
    >
      <RadixTabs.List
        className={[
          'flex items-center gap-1 border-b border-[var(--line)]',
          variant === 'pill' ? 'p-1 bg-[var(--paper-2)] rounded-[var(--r-md)] border-b-0 inline-flex self-start' : '',
        ].join(' ')}
      >
        {items.map((tab) => (
          <RadixTabs.Trigger
            key={tab.id}
            value={tab.id}
            className={[
              'flex items-center gap-2 font-medium text-sm transition-all select-none cursor-pointer',
              variant === 'underline'
                ? 'pb-2.5 pt-1 px-3 border-b-2 -mb-[1px] border-transparent text-[var(--ink-3)] hover:text-[var(--ink)] data-[state=active]:border-[var(--signal)] data-[state=active]:text-[var(--ink)]'
                : 'px-3 py-1.5 rounded-[var(--r-sm)] text-[var(--ink-3)] hover:text-[var(--ink)] data-[state=active]:bg-[var(--surface)] data-[state=active]:text-[var(--ink)] data-[state=active]:shadow-[var(--sh-1)]',
            ].join(' ')}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-[var(--paper-2)] text-[var(--ink-2)] data-[state=active]:bg-[var(--signal-wash)] data-[state=active]:text-[var(--signal-ink)]">
                {tab.badge}
              </span>
            )}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>

      {items.map((tab) => (
        <RadixTabs.Content
          key={tab.id}
          value={tab.id}
          className="pt-4 focus-visible:outline-none"
        >
          {tab.content}
        </RadixTabs.Content>
      ))}
    </RadixTabs.Root>
  );
}
