
import * as React from "react"
import { Check, ChevronDown, X, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

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
    searchPlaceholder = "Ara...",
    emptyText = "Sonuç bulunamadı.",
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
      
      return option.label
    }

    const selectedCount = selected.length

    return (
      <div ref={ref} className={cn("w-full", className)} {...props}>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className={cn(
                "w-full justify-between min-h-11 h-auto px-3 py-2",
                "bg-background hover:bg-accent/50 border-input",
                "transition-all duration-200",
                open && "ring-2 ring-primary/20 border-primary",
                selectedCount === 0 && "text-muted-foreground"
              )}
            >
              <div className="flex gap-1.5 flex-wrap items-center flex-1 min-w-0">
                {selectedCount === 0 ? (
                  <span className="text-muted-foreground text-sm">{placeholder}</span>
                ) : selectedCount <= maxDisplay ? (
                  selected.map((item) => (
                    <Badge
                      key={item}
                      variant="secondary"
                      className={cn(
                        "px-2 py-0.5 text-xs font-medium rounded-md",
                        "bg-primary/10 text-primary border-0",
                        "hover:bg-primary/20 transition-colors cursor-pointer",
                        "flex items-center gap-1 max-w-[180px]"
                      )}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleUnselect(item)
                      }}
                    >
                      <span className="truncate">{getDisplayLabel(item)}</span>
                      <X className="h-3 w-3 shrink-0 opacity-60 hover:opacity-100" />
                    </Badge>
                  ))
                ) : (
                  <Badge
                    variant="secondary"
                    className={cn(
                      "px-2.5 py-1 text-xs font-medium rounded-md",
                      "bg-primary/10 text-primary border-0"
                    )}
                  >
                    {selectedCount} kurum seçildi
                  </Badge>
                )}
              </div>
              <ChevronDown className={cn(
                "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                open && "rotate-180"
              )} />
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-full p-0 shadow-lg border-border/50" 
            style={{ width: 'var(--radix-popover-trigger-width)' }}
            align="start"
          >
            <Command className="rounded-lg">
              <CommandInput 
                placeholder={searchPlaceholder} 
                className="h-10 border-0 ring-0 outline-none focus:ring-0 focus:outline-none placeholder:text-muted-foreground/60"
              />
              <CommandList>
                <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                  {emptyText}
                </CommandEmpty>
                <ScrollArea className="h-[280px]">
                  <CommandGroup className="p-1.5">
                    {options.map((option) => {
                      const isSelected = selected.includes(option.value)
                      return (
                        <CommandItem
                          key={option.value}
                          onSelect={() => handleSelect(option.value)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer",
                            "transition-colors duration-150",
                            isSelected 
                              ? "bg-primary/10 text-foreground" 
                              : "hover:bg-accent"
                          )}
                        >
                          <div className={cn(
                            "flex items-center justify-center w-5 h-5 rounded border-2 shrink-0 transition-all duration-200",
                            isSelected 
                              ? "bg-primary border-primary" 
                              : "border-muted-foreground/30 bg-background"
                          )}>
                            <Check className={cn(
                              "h-3.5 w-3.5 text-primary-foreground transition-all duration-200",
                              isSelected ? "opacity-100 scale-100" : "opacity-0 scale-75"
                            )} />
                          </div>
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className={cn(
                              "text-sm truncate",
                              isSelected && "font-medium"
                            )}>
                              {option.label}
                            </span>
                            {option.description && (
                              <span className="text-xs text-muted-foreground truncate">
                                {option.description}
                              </span>
                            )}
                          </div>
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                </ScrollArea>
              </CommandList>
            </Command>
            {selectedCount > 0 && (
              <div className="border-t border-border/50 px-3 py-2 bg-muted/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {selectedCount} kurum seçildi
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation()
                      onChange([])
                    }}
                  >
                    Temizle
                  </Button>
                </div>
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>
    )
  }
)

MultiSelect.displayName = "MultiSelect"
