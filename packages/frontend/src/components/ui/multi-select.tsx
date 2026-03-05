'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Check, ChevronDown, X } from 'lucide-react'

export interface MultiSelectOption {
  id: string
  name: string
  parentId?: string | null
  atlasId?: string | null
}

export interface MultiSelectProps {
  options: MultiSelectOption[]
  value: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  hierarchical?: boolean
}

const MultiSelect = React.forwardRef<HTMLDivElement, MultiSelectProps>(
  ({ options, value, onChange, placeholder = 'Select options...', disabled, className, hierarchical }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false)
    const containerRef = React.useRef<HTMLDivElement>(null)

    // Close dropdown when clicking outside
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false)
        }
      }

      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const selectedOptions = options.filter((opt) => value.includes(opt.id))

    const toggleOption = (optionId: string) => {
      if (value.includes(optionId)) {
        onChange(value.filter((id) => id !== optionId))
      } else {
        onChange([...value, optionId])
      }
    }

    const removeOption = (optionId: string, e: React.MouseEvent) => {
      e.stopPropagation()
      onChange(value.filter((id) => id !== optionId))
    }

    return (
      <div ref={containerRef} className={cn('relative', className)}>
        <div
          ref={ref}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-disabled={disabled}
          className={cn(
            'flex min-h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
            'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
            disabled && 'cursor-not-allowed opacity-50',
            !disabled && 'cursor-pointer'
          )}
          onClick={() => !disabled && setIsOpen(!isOpen)}
        >
          <div className="flex flex-wrap gap-1 flex-1">
            {selectedOptions.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              selectedOptions.map((option) => (
                <span
                  key={option.id}
                  className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs font-medium"
                >
                  {option.name}
                  <button
                    type="button"
                    onClick={(e) => removeOption(option.id, e)}
                    className="rounded-full hover:bg-secondary-foreground/10"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))
            )}
          </div>
          <ChevronDown className={cn('h-4 w-4 shrink-0 opacity-50 transition-transform', isOpen && 'rotate-180')} />
        </div>

        {isOpen && (
          <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover p-1 shadow-md">
            {options.length === 0 ? (
              <div className="py-2 px-3 text-sm text-muted-foreground">No options available</div>
            ) : hierarchical ? (
              (() => {
                const roots = options.filter((o) => !o.parentId)
                const children = options.filter((o) => o.parentId)
                return roots.map((root) => {
                  const rootSelected = value.includes(root.id)
                  const rootChildren = children.filter((c) => c.parentId === root.atlasId)
                  return (
                    <React.Fragment key={root.id}>
                      <div
                        role="option"
                        aria-selected={rootSelected}
                        className={cn(
                          'relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm font-semibold outline-none',
                          'hover:bg-accent hover:text-accent-foreground',
                          rootSelected && 'bg-accent/50'
                        )}
                        onClick={() => toggleOption(root.id)}
                      >
                        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                          {rootSelected && <Check className="h-4 w-4" />}
                        </span>
                        {root.name}
                      </div>
                      {rootChildren.map((child) => {
                        const childSelected = value.includes(child.id)
                        return (
                          <div
                            key={child.id}
                            role="option"
                            aria-selected={childSelected}
                            className={cn(
                              'relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-12 pr-2 text-sm text-muted-foreground outline-none',
                              'hover:bg-accent hover:text-accent-foreground',
                              childSelected && 'bg-accent/50 text-foreground'
                            )}
                            onClick={() => toggleOption(child.id)}
                          >
                            <span className="absolute left-6 flex h-3.5 w-3.5 items-center justify-center">
                              {childSelected && <Check className="h-4 w-4" />}
                            </span>
                            {child.name}
                          </div>
                        )
                      })}
                    </React.Fragment>
                  )
                })
              })()
            ) : (
              options.map((option) => {
                const isSelected = value.includes(option.id)
                return (
                  <div
                    key={option.id}
                    role="option"
                    aria-selected={isSelected}
                    className={cn(
                      'relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none',
                      'hover:bg-accent hover:text-accent-foreground',
                      isSelected && 'bg-accent/50'
                    )}
                    onClick={() => toggleOption(option.id)}
                  >
                    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                      {isSelected && <Check className="h-4 w-4" />}
                    </span>
                    {option.name}
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    )
  }
)
MultiSelect.displayName = 'MultiSelect'

export { MultiSelect }
