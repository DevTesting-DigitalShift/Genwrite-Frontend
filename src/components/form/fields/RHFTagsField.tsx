import { useRef, useState } from "react"
import type { ChangeEvent, ClipboardEvent, KeyboardEvent } from "react"
import type { Control, FieldPath, FieldValues } from "react-hook-form"
import { Controller } from "react-hook-form"
import { Upload, X } from "lucide-react"
import { toast } from "sonner"
import { Input } from "@components/ui/input"
import { Badge } from "@components/ui/badge"
import { mergeItems, parseCsvItems, splitItems, validateCsvFile } from "@/forms/shared/listInput"
import { FieldShell } from "./FieldShell"

interface RHFTagsFieldProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>
  name: FieldPath<TFieldValues>
  label?: string
  required?: boolean
  description?: string
  placeholder?: string
  className?: string
  /** Hard ceiling on the list. Items past it are dropped with a message, never silently. */
  max?: number
  /** Per-item check run before an item is added; return a message to reject it. */
  validate?: (item: string) => string | null
  /** Offer a "Upload CSV" button that appends the file's first column. */
  csv?: boolean
  /** Collapse the chips past this many behind a "Show all" toggle. */
  maxVisible?: number
  /** Called with whatever was just appended (typed, pasted or imported). */
  onItemsAdded?: (added: string[], next: string[]) => void
}

/**
 * Generic string[] chip input wired to react-hook-form — the one list field behind blog
 * keywords, focus keywords, topics, reference links, brand keywords and campaign targets.
 *
 * Typing + Enter / comma, pasting a comma/tab/newline separated block, leaving the box with
 * text in it (so a half-typed keyword is not lost on submit) and CSV import all go through
 * the same `commit`, which de-duplicates, validates per item and respects `max`.
 */
export function RHFTagsField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  required,
  description,
  placeholder = "Type and press Enter",
  className,
  max,
  validate,
  csv,
  maxVisible,
  onItemsAdded,
}: RHFTagsFieldProps<TFieldValues>) {
  const [draft, setDraft] = useState("")
  const [localError, setLocalError] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)
  const [importedCount, setImportedCount] = useState<number | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const tags: string[] = field.value ?? []

        /** Adds `items`; returns how many were accepted. */
        const commit = (items: string[]): number => {
          const valid: string[] = []
          for (const item of items) {
            const problem = validate?.(item)
            if (problem) {
              setLocalError(problem)
              toast.error(problem)
              return 0
            }
            valid.push(item)
          }

          const { next, added, duplicates, rejected } = mergeItems(tags, valid, { max })

          if (added.length) {
            field.onChange(next)
            onItemsAdded?.(added, next)
          }

          if (rejected.length) {
            const message = `You can only add up to ${max} ${label?.toLowerCase() ?? "items"}.`
            setLocalError(message)
            if (added.length) toast.warning(message)
          } else if (!added.length && duplicates.length) {
            setLocalError("Those are already in the list.")
          } else {
            setLocalError(null)
          }
          return added.length
        }

        const commitDraft = () => {
          const items = splitItems(draft)
          if (items.length === 0) {
            setDraft("")
            return
          }
          commit(items)
          setDraft("")
        }

        const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault()
            commitDraft()
          } else if (e.key === "Backspace" && !draft && tags.length) {
            field.onChange(tags.slice(0, -1))
          }
        }

        const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
          const text = e.clipboardData.getData("text")
          if (!/[\n\t\r,;]/.test(text)) return
          e.preventDefault()
          commit(splitItems(text))
        }

        const handleCsv = (e: ChangeEvent<HTMLInputElement>) => {
          const file = e.target.files?.[0]
          e.target.value = ""
          const problem = validateCsvFile(file)
          if (problem || !file) {
            setLocalError(problem)
            return
          }
          const reader = new FileReader()
          reader.onerror = () => setLocalError("An error occurred while reading the CSV file.")
          reader.onload = () => {
            const items = parseCsvItems(String(reader.result ?? ""))
            if (items.length === 0) {
              setLocalError("No valid items found in the CSV file.")
              return
            }
            const count = commit(items)
            if (count > 0) {
              setImportedCount(count)
              setTimeout(() => setImportedCount(null), 5000)
            }
          }
          reader.readAsText(file)
        }

        const visible = maxVisible && !showAll ? tags.slice(0, maxVisible) : tags
        const hidden = tags.length - visible.length

        return (
          <FieldShell
            htmlFor={name}
            label={label}
            required={required}
            description={description}
            error={fieldState.error?.message ?? localError ?? undefined}
            className={className}
          >
            <div className="flex flex-wrap items-center gap-2 rounded-md border border-input bg-transparent p-2">
              {visible.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <button
                    type="button"
                    aria-label={`Remove ${tag}`}
                    onClick={() => {
                      setLocalError(null)
                      field.onChange(tags.filter((t) => t !== tag))
                    }}
                    className="ml-0.5 rounded-full hover:text-destructive"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
              {hidden > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAll(true)}
                  className="text-xs font-semibold text-primary"
                >
                  +{hidden} more
                </button>
              )}
              <Input
                id={name}
                value={draft}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setDraft(e.target.value)
                  if (localError) setLocalError(null)
                }}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                onBlur={() => {
                  commitDraft()
                  field.onBlur()
                }}
                placeholder={tags.length ? "" : placeholder}
                className="h-7 flex-1 min-w-24 border-none shadow-none focus-visible:ring-0 px-1"
              />
            </div>
            {(max !== undefined || csv) && (
              <div className="flex items-center justify-between gap-2 pt-1 text-xs text-muted-foreground">
                <span>
                  {max !== undefined ? `${tags.length}/${max}` : ""}
                  {importedCount ? ` · ${importedCount} imported from CSV` : ""}
                </span>
                <span className="flex items-center gap-3">
                  {showAll && maxVisible && tags.length > maxVisible && (
                    <button type="button" onClick={() => setShowAll(false)} className="font-semibold">
                      Show less
                    </button>
                  )}
                  {csv && (
                    <>
                      <input
                        ref={fileInput}
                        type="file"
                        accept=".csv"
                        className="hidden"
                        onChange={handleCsv}
                      />
                      <button
                        type="button"
                        onClick={() => fileInput.current?.click()}
                        className="inline-flex items-center gap-1 font-semibold text-primary"
                      >
                        <Upload className="size-3" /> Upload CSV
                      </button>
                    </>
                  )}
                </span>
              </div>
            )}
          </FieldShell>
        )
      }}
    />
  )
}
