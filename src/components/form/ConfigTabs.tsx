import { useEffect, useState } from "react"
import type { ComponentType, ReactNode } from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { get, useFormState } from "react-hook-form"
import { cn } from "@/lib/utils"
import { useCreateFormContext } from "./createFormContext"

export interface ConfigTab {
  id: string
  label: string
  icon: ComponentType<{ className?: string }>
  /** Short state next to the label: "On", "2", … — omitted when there's nothing to say. */
  badge?: ReactNode
  /** Field paths inside the tab; an error on one marks the tab and can switch to it. */
  fields?: string[]
  content: ReactNode
}

/**
 * The advanced-configuration tray: one card, a row of folder tabs (writing, SEO, media, brand,
 * publishing…), one panel at a time — so a form's power-user settings stay in one place
 * without a wall of switches.
 *
 * Every panel stays mounted (hidden while inactive) so its fields keep their react-hook-form
 * registration. When a submit fails, the tray switches to the first tab holding an error,
 * so the field `onInvalidSubmit` is about to focus is actually on screen; the summary rail's
 * checklist can also ask for a tab through `CreateFormContext`.
 */
export function ConfigTabs({ tabs, className }: { tabs: ConfigTab[]; className?: string }) {
  const { errors, submitCount } = useFormState()
  const { openRequest } = useCreateFormContext()
  const [active, setActive] = useState(tabs[0]?.id)

  const tabErrors = Object.fromEntries(
    tabs.map((tab) => [tab.id, (tab.fields ?? []).some((path) => get(errors, path))])
  )
  const erroredTabs = tabs.filter((tab) => tabErrors[tab.id]).map((tab) => tab.id)
  const erroredKey = erroredTabs.join(",")

  // A tab that disappears (e.g. Media in a YouTube blog) must not stay selected.
  const current = tabs.some((tab) => tab.id === active) ? active : tabs[0]?.id

  // biome-ignore lint/correctness/useExhaustiveDependencies: keyed on the errored set and each submit
  useEffect(() => {
    if (erroredTabs.length && !erroredTabs.includes(current ?? "")) setActive(erroredTabs[0])
  }, [erroredKey, submitCount])

  // biome-ignore lint/correctness/useExhaustiveDependencies: only re-run on a new request
  useEffect(() => {
    if (openRequest?.tab && tabs.some((tab) => tab.id === openRequest.tab)) {
      setActive(openRequest.tab)
    }
  }, [openRequest])

  return (
    <TabsPrimitive.Root value={current} onValueChange={setActive} className={className}>
      <TabsPrimitive.List
        aria-label="Advanced configuration"
        className="flex gap-1 overflow-x-auto border-b border-border bg-muted/40 px-3 pt-2 [scrollbar-width:none]"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon
          const hasError = tabErrors[tab.id]
          return (
            <TabsPrimitive.Trigger
              key={tab.id}
              value={tab.id}
              className={cn(
                "-mb-px flex shrink-0 items-center gap-2 rounded-t-xl border border-b-0 border-transparent border-t-2 px-3.5 py-2.5 text-[13px] font-medium text-muted-foreground transition-colors",
                "hover:bg-background/60 hover:text-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30",
                "data-[state=active]:border-x-border data-[state=active]:border-t-primary data-[state=active]:bg-card data-[state=active]:font-semibold data-[state=active]:text-primary"
              )}
            >
              <Icon className="size-4" />
              <span>{tab.label}</span>
              {hasError ? (
                <>
                  <span className="size-2 rounded-full bg-destructive" aria-hidden />
                  <span className="sr-only">(has errors)</span>
                </>
              ) : (
                tab.badge !== undefined &&
                tab.badge !== null &&
                tab.badge !== false && (
                  <span className="rounded-md bg-primary/10 px-1.5 py-px text-[10px] font-bold uppercase tracking-wide text-primary">
                    {tab.badge}
                  </span>
                )
              )}
            </TabsPrimitive.Trigger>
          )
        })}
      </TabsPrimitive.List>

      {tabs.map((tab) => (
        <TabsPrimitive.Content
          key={tab.id}
          value={tab.id}
          // Mounted while inactive so the fields stay registered; `hidden` via display:none.
          forceMount
          className="space-y-5 p-4 focus-visible:outline-none data-[state=inactive]:hidden sm:p-5"
        >
          {tab.content}
        </TabsPrimitive.Content>
      ))}
    </TabsPrimitive.Root>
  )
}
