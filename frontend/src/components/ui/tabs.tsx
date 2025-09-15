import * as React from "react"
import { cn } from "@/lib/utils"

interface TabsProps {
  children: React.ReactNode
  className?: string
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
}

interface TabListProps {
  children: React.ReactNode
  className?: string
  "aria-label"?: string
}

interface TabProps {
  children: React.ReactNode
  className?: string
  id: string
  value?: string
}

interface TabPanelProps {
  children: React.ReactNode
  className?: string
  id: string
  value?: string
}

const TabsContext = React.createContext<{
  value: string
  onValueChange: (value: string) => void
} | null>(null)

function Tabs({ children, className, defaultValue, value, onValueChange }: TabsProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue || "")
  
  const currentValue = value !== undefined ? value : internalValue
  const handleValueChange = onValueChange || setInternalValue

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
      <div className={cn("group flex flex-col gap-2", className)}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

const TabList = React.forwardRef<HTMLDivElement, TabListProps>(
  ({ children, className, "aria-label": ariaLabel }, ref) => (
    <div
      ref={ref}
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "flex flex-wrap gap-1 rounded-md bg-muted p-1 text-muted-foreground",
        className
      )}
    >
      {children}
    </div>
  )
)
TabList.displayName = "TabList"

const Tab = React.forwardRef<HTMLButtonElement, TabProps>(
  ({ children, className, id, value }, ref) => {
    const context = React.useContext(TabsContext)
    if (!context) {
      throw new Error("Tab must be used within Tabs")
    }

    const isSelected = context.value === value
    const handleClick = () => context.onValueChange(value || id)

    return (
      <button
        ref={ref}
        role="tab"
        aria-selected={isSelected}
        aria-controls={`panel-${id}`}
        id={id}
        onClick={handleClick}
        className={cn(
          "flex-shrink-0 cursor-pointer justify-center rounded-sm px-3 py-1.5 text-sm font-medium outline-none ring-offset-background transition-all",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          "min-w-0 max-w-full truncate",
          isSelected && "bg-background text-foreground shadow-sm",
          className
        )}
      >
        <span className="truncate">{children}</span>
      </button>
    )
  }
)
Tab.displayName = "Tab"

const TabPanel = React.forwardRef<HTMLDivElement, TabPanelProps>(
  ({ children, className, id, value }, ref) => {
    const context = React.useContext(TabsContext)
    if (!context) {
      throw new Error("TabPanel must be used within Tabs")
    }

    const isSelected = context.value === value

    if (!isSelected) {
      return null
    }

    return (
      <div
        ref={ref}
        role="tabpanel"
        id={`panel-${id}`}
        aria-labelledby={id}
        className={cn("mt-2 ring-offset-background", className)}
      >
        {children}
      </div>
    )
  }
)
TabPanel.displayName = "TabPanel"

export { Tabs, TabList, TabPanel, Tab }
