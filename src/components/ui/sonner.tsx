import type * as React from "react"
import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "light" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      closeButton
      richColors
      toastOptions={{
        classNames: {
          toast:
            "group flex items-center gap-3 group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border group-[.toaster]:border-border group-[.toaster]:shadow-xl group-[.toaster]:rounded-xl group-[.toaster]:px-6 group-[.toaster]:py-4",
          description: "group-[.toast]:text-muted-foreground",
          // Tinted to match the rich-colour toast it sits in, instead of a dark primary block.
          actionButton:
            "!rounded-lg !font-semibold !bg-slate-900/10 !text-slate-900 hover:!bg-slate-900/20 group-data-[type=success]:!bg-emerald-600/15 group-data-[type=success]:!text-emerald-800 group-data-[type=success]:hover:!bg-emerald-600/25 group-data-[type=error]:!bg-rose-600/15 group-data-[type=error]:!text-rose-800 group-data-[type=warning]:!bg-amber-600/15 group-data-[type=warning]:!text-amber-900",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
