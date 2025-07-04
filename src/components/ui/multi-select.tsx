
import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"

export interface MultiSelectOption {
  label: string
  value: string
  description?: string
}

interface MultiSelectProps {
  options: MultiSelectOption[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  className?: string
  maxDisplay?: number
  formatLabel?: (option: MultiSelectOption) => string
}

export const MultiSelect = React.forwardRef<HTMLDivElement, MultiSelectProps>(
  ({ 
    options, 
    selected, 
    onChange, 
    placeholder = "Select items...",
    searchPlaceholder = "Search...",
    emptyText = "No items found.",
    className,
    maxDisplay = 3,
    formatLabel,
    ...props 
  }, ref) => {
    const [open, setOpen] = React.useState(false)

    const handleUnselect = (item: string) => {
      onChange(selected.filter((i) => i !== item))
    }

    const handleSelect = (item: string) => {
      const isSelected = selected.includes(item)
      if (isSelected) {
        onChange(selected.filter((i) => i !== item))
      } else {
        onChange([...selected, item])
      }
    }

    const getDisplayLabel = (value: string) => {
      const option = options.find(opt => opt.value === value)
      if (!option) return value
      
      if (formatLabel) {
        return formatLabel(option)
      }
      
      return option.description ? `${option.label} - ${option.description}` : option.label
    }

    return (
      <div ref={ref} className={cn("w-full", className)} {...props}>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between min-h-10 h-auto"
            >
              <div className="flex gap-1 flex-wrap">
                {selected.length === 0 && (
                  <span className="text-muted-foreground">{placeholder}</span>
                )}
                {selected.slice(0, maxDisplay).map((item) => (
                  <Badge
                    variant="secondary"
                    key={item}
                    className="mr-1 mb-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleUnselect(item)
                    }}
                  >
                    {getDisplayLabel(item)}
                    <X className="ml-1 h-3 w-3 hover:bg-muted rounded-full" />
                  </Badge>
                ))}
                {selected.length > maxDisplay && (
                  <Badge variant="secondary" className="mr-1 mb-1">
                    +{selected.length - maxDisplay} more
                  </Badge>
                )}
              </div>
              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" style={{ width: 'var(--radix-popover-trigger-width)' }}>
            <Command>
              <CommandInput placeholder={searchPlaceholder} />
              <CommandList>
                <CommandEmpty>{emptyText}</CommandEmpty>
                <CommandGroup className="max-h-64 overflow-auto">
                  {options.map((option) => (
                    <CommandItem
                      key={option.value}
                      onSelect={() => handleSelect(option.value)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selected.includes(option.value) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col">
                        <span>{option.label}</span>
                        {option.description && (
                          <span className="text-xs text-muted-foreground">{option.description}</span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    )
  }
)

MultiSelect.displayName = "MultiSelect"
