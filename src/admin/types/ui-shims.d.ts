/**
 * The shared shadcn primitives under @components/ui are plain JS/JSX
 * (this repo's components.json has "tsx": false), so under strict TS they
 * infer to `unknown` props and reject className/children/etc. These shims
 * type them loosely as `any`-props components purely for admin's (TSX)
 * consumption, without modifying the shared JS source files used across
 * the whole app.
 */
declare module "@components/ui/dialog" {
  import type { ComponentType } from "react"
  export const Dialog: ComponentType<any>
  export const DialogPortal: ComponentType<any>
  export const DialogOverlay: ComponentType<any>
  export const DialogTrigger: ComponentType<any>
  export const DialogClose: ComponentType<any>
  export const DialogContent: ComponentType<any>
  export const DialogHeader: ComponentType<any>
  export const DialogFooter: ComponentType<any>
  export const DialogTitle: ComponentType<any>
  export const DialogDescription: ComponentType<any>
}

declare module "@components/ui/button" {
  import type { ComponentType } from "react"
  export const Button: ComponentType<any>
  export const buttonVariants: (...args: any[]) => string
}

declare module "@components/ui/card" {
  import type { ComponentType } from "react"
  export const Card: ComponentType<any>
  export const CardHeader: ComponentType<any>
  export const CardFooter: ComponentType<any>
  export const CardTitle: ComponentType<any>
  export const CardDescription: ComponentType<any>
  export const CardContent: ComponentType<any>
}

declare module "@components/ui/alert" {
  import type { ComponentType } from "react"
  export const Alert: ComponentType<any>
  export const AlertTitle: ComponentType<any>
  export const AlertDescription: ComponentType<any>
}

declare module "@components/ui/breadcrumb" {
  import type { ComponentType } from "react"
  export const Breadcrumb: ComponentType<any>
  export const BreadcrumbList: ComponentType<any>
  export const BreadcrumbItem: ComponentType<any>
  export const BreadcrumbLink: ComponentType<any>
  export const BreadcrumbPage: ComponentType<any>
  export const BreadcrumbSeparator: ComponentType<any>
  export const BreadcrumbEllipsis: ComponentType<any>
}

declare module "@components/ui/badge" {
  import type { ComponentType } from "react"
  export const Badge: ComponentType<any>
  export const badgeVariants: (...args: any[]) => string
}

declare module "@components/ui/table" {
  import type { ComponentType } from "react"
  export const Table: ComponentType<any>
  export const TableHeader: ComponentType<any>
  export const TableBody: ComponentType<any>
  export const TableFooter: ComponentType<any>
  export const TableHead: ComponentType<any>
  export const TableRow: ComponentType<any>
  export const TableCell: ComponentType<any>
  export const TableCaption: ComponentType<any>
}

declare module "@components/ui/tabs" {
  import type { ComponentType } from "react"
  export const Tabs: ComponentType<any>
  export const TabsList: ComponentType<any>
  export const TabsTrigger: ComponentType<any>
  export const TabsContent: ComponentType<any>
}

declare module "@components/ui/select" {
  import type { ComponentType } from "react"
  export const Select: ComponentType<any>
  export const SelectGroup: ComponentType<any>
  export const SelectValue: ComponentType<any>
  export const SelectTrigger: ComponentType<any>
  export const SelectContent: ComponentType<any>
  export const SelectLabel: ComponentType<any>
  export const SelectItem: ComponentType<any>
  export const SelectSeparator: ComponentType<any>
  export const SelectScrollUpButton: ComponentType<any>
  export const SelectScrollDownButton: ComponentType<any>
}

declare module "@components/ui/dropdown-menu" {
  import type { ComponentType } from "react"
  export const DropdownMenu: ComponentType<any>
  export const DropdownMenuTrigger: ComponentType<any>
  export const DropdownMenuContent: ComponentType<any>
  export const DropdownMenuItem: ComponentType<any>
  export const DropdownMenuCheckboxItem: ComponentType<any>
  export const DropdownMenuRadioItem: ComponentType<any>
  export const DropdownMenuLabel: ComponentType<any>
  export const DropdownMenuSeparator: ComponentType<any>
  export const DropdownMenuShortcut: ComponentType<any>
  export const DropdownMenuGroup: ComponentType<any>
  export const DropdownMenuPortal: ComponentType<any>
  export const DropdownMenuSub: ComponentType<any>
  export const DropdownMenuSubContent: ComponentType<any>
  export const DropdownMenuSubTrigger: ComponentType<any>
  export const DropdownMenuRadioGroup: ComponentType<any>
}

declare module "@components/ui/input" {
  import type { ComponentType } from "react"
  export const Input: ComponentType<any>
}

declare module "@components/ui/label" {
  import type { ComponentType } from "react"
  export const Label: ComponentType<any>
}

declare module "@components/ui/progress" {
  import type { ComponentType } from "react"
  export const Progress: ComponentType<any>
}
