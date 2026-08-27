import type { ChangeEvent, ComponentType } from "react"
import type { Control, FieldPath, FieldValues } from "react-hook-form"
import { Controller } from "react-hook-form"
import { Search } from "lucide-react"
import { Input } from "@components/ui/input"
import { Checkbox as CheckboxUntyped } from "@components/ui/checkbox"
import { Label } from "@components/ui/label"
import { FieldShell } from "@components/form/fields"
import { cn } from "@/lib/utils"
import type { CampaignBlogRef } from "@/types/campaign"

// `Checkbox` is a plain JSX (untyped) component — cast once here so every call site
// below gets real prop checking instead of TS collapsing it to `RefAttributes<any>`.
const Checkbox = CheckboxUntyped as ComponentType<{
  id?: string
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  className?: string
}>

interface BlogMultiSelectFieldProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>
  name: FieldPath<TFieldValues>
  blogs: CampaignBlogRef[]
  isLoading?: boolean
  search: string
  onSearchChange: (value: string) => void
}

/** Checkbox list of blogs to assign to a campaign, filterable by title. */
export function BlogMultiSelectField<TFieldValues extends FieldValues>({
  control,
  name,
  blogs,
  isLoading,
  search,
  onSearchChange,
}: BlogMultiSelectFieldProps<TFieldValues>) {
  const filtered = search.trim()
    ? blogs.filter((b) => b.title?.toLowerCase().includes(search.trim().toLowerCase()))
    : blogs

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const selected: string[] = field.value ?? []

        const toggle = (blogId: string) => {
          field.onChange(
            selected.includes(blogId)
              ? selected.filter((id) => id !== blogId)
              : [...selected, blogId]
          )
        }

        return (
          <FieldShell
            label="Blogs"
            description="Blogs whose GSC performance counts toward this campaign's targets."
            error={fieldState.error?.message}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
                    placeholder="Search blogs by title…"
                    className="h-8 pl-7 text-sm"
                  />
                </div>
                <span className="shrink-0 rounded-md border border-primary/15 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  {selected.length} selected
                </span>
              </div>

              <div className="max-h-48 overflow-y-auto overflow-x-hidden rounded-md border border-input p-1">
                {isLoading && (
                  <p className="p-3 text-sm text-muted-foreground">Loading blogs…</p>
                )}
                {!isLoading && filtered.length === 0 && (
                  <p className="p-3 text-sm text-muted-foreground">No blogs found.</p>
                )}
                {filtered.map((blog) => (
                  <label
                    key={blog._id}
                    htmlFor={`blog-${blog._id}`}
                    className={cn(
                      "flex min-w-0 cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors",
                      selected.includes(blog._id)
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-primary/5"
                    )}
                  >
                    <Checkbox
                      id={`blog-${blog._id}`}
                      checked={selected.includes(blog._id)}
                      onCheckedChange={() => toggle(blog._id)}
                      className="shrink-0"
                    />
                    <Label
                      htmlFor={`blog-${blog._id}`}
                      className="min-w-0 flex-1 cursor-pointer truncate font-normal"
                    >
                      {blog.title || "Untitled blog"}
                    </Label>
                  </label>
                ))}
              </div>
            </div>
          </FieldShell>
        )
      }}
    />
  )
}
