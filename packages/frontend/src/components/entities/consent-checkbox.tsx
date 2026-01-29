'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { Label } from '@/components/ui/label';

export interface ConsentCheckboxProps {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
}

export function ConsentCheckbox({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  required,
  disabled,
  error,
  className,
}: ConsentCheckboxProps) {
  const handleClick = () => {
    if (!disabled) {
      onCheckedChange(!checked);
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-start gap-3">
        <button
          type="button"
          role="checkbox"
          aria-checked={checked}
          aria-required={required}
          aria-invalid={!!error}
          disabled={disabled}
          onClick={handleClick}
          className={cn(
            'mt-0.5 h-5 w-5 shrink-0 rounded border border-primary',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            checked && 'bg-primary',
            error && 'border-destructive'
          )}
        >
          {checked && <Check className="h-4 w-4 text-primary-foreground" />}
        </button>
        <div className="space-y-1.5">
          <Label
            htmlFor={id}
            className={cn(
              'text-sm font-medium leading-none cursor-pointer',
              disabled && 'cursor-not-allowed opacity-70'
            )}
            onClick={handleClick}
          >
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
          {description && (
            <div
              className="text-sm text-muted-foreground leading-relaxed prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: description }}
            />
          )}
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
