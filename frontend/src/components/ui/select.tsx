import * as React from "react"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface SelectProps {
  children: React.ReactNode
  value?: string
  onValueChange?: (value: string) => void
  [key: string]: unknown
}

// Functional Select components with state management
const Select = ({ children, value, onValueChange, ...props }: SelectProps) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [selectedValue, setSelectedValue] = React.useState(value || "")

  // Synchroniser avec la valeur externe
  React.useEffect(() => {
    setSelectedValue(value || "")
  }, [value])

  const handleValueChange = (newValue: string) => {
    setSelectedValue(newValue)
    onValueChange?.(newValue)
    setIsOpen(false)
  }

  return (
    <div className="relative" {...props}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          // Only pass the props that the child component expects
          if (child.type === SelectTrigger) {
            return React.cloneElement(child as React.ReactElement<{ isOpen: boolean; setIsOpen: (open: boolean) => void }>, {
              isOpen,
              setIsOpen
            })
          } else if (child.type === SelectValue) {
            return React.cloneElement(child as React.ReactElement<{ selectedValue: string }>, {
              selectedValue
            })
          } else if (child.type === SelectContent) {
            return React.cloneElement(child as React.ReactElement<{ isOpen: boolean; setIsOpen: (open: boolean) => void; onValueChange: (value: string) => void }>, {
              isOpen,
              setIsOpen,
              onValueChange: handleValueChange
            })
          }
          return child
        }
        return child
      })}
    </div>
  )
}

interface SelectGroupProps {
  children: React.ReactNode
  [key: string]: unknown
}

const SelectGroup = ({ children, ...props }: SelectGroupProps) => {
  return <div {...props}>{children}</div>
}

interface SelectValueProps {
  placeholder?: string
  selectedValue?: string
  [key: string]: unknown
}

const SelectValue = ({ placeholder, selectedValue, ...props }: SelectValueProps) => {
  // Filter out custom props - selectedValue is already extracted as parameter
  return <span {...props}>{selectedValue || placeholder}</span>
}

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    children: React.ReactNode
    isOpen?: boolean
    setIsOpen?: (open: boolean) => void
  }
>(({ className, children, isOpen, setIsOpen, ...props }, ref) => {
  // Filter out custom props that shouldn't be passed to DOM
  const { ...domProps } = props
  return (
    <button
      ref={ref}
      type="button"
      onClick={() => setIsOpen?.(!isOpen)}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
        className
      )}
      {...domProps}
    >
      {children}
      <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform", isOpen && "rotate-180")} />
    </button>
  )
})

const SelectContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    isOpen?: boolean
    setIsOpen?: (open: boolean) => void
    onValueChange?: (value: string) => void
  }
>(({ className, children, isOpen, setIsOpen, onValueChange, ...props }, ref) => {
  // Filter out custom props that shouldn't be passed to DOM
  const domProps = props

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref && 'current' in ref && ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen?.(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, setIsOpen, ref])

  if (!isOpen) return null

  return (
    <div
      ref={ref}
      className={cn(
        "absolute z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95",
        className
      )}
      {...domProps}
    >
      <div className="p-1">
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<{ onValueChange?: (value: string) => void }>, {
              onValueChange
            })
          }
          return child
        })}
      </div>
    </div>
  )
})

const SelectLabel = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
    {...props}
  />
))

const SelectItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value: string
    onValueChange?: (value: string) => void
  }
>(({ className, children, value, onValueChange, ...props }, ref) => {
  return (
    <div
      ref={ref}
      onClick={() => onValueChange?.(value)}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
        className
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <Check className="h-4 w-4" />
      </span>
      {children}
    </div>
  )
})

const SelectSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))

SelectTrigger.displayName = "SelectTrigger"
SelectContent.displayName = "SelectContent"
SelectLabel.displayName = "SelectLabel"
SelectItem.displayName = "SelectItem"
SelectSeparator.displayName = "SelectSeparator"

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
}