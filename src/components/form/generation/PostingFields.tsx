import { useEffect } from "react"
import { Controller, useFormContext } from "react-hook-form"
import type { FieldValues } from "react-hook-form"
import { toast } from "sonner"
import { integrationQuery } from "@api/Integration/Integration.query"
import useIntegrationStore from "@store/useIntegrationStore"
import { Switch } from "@components/ui/switch"

/**
 * Automatic posting: the `options.automaticPosting` switch plus, once it is on, the
 * connected platform that becomes `postingDefaultType`. Also keeps the shared integration
 * store warm for the passive readers (editor sidebar, regenerate modal).
 */
export function PostingFields() {
  const { control, setValue } = useFormContext<FieldValues>()
  const { integrations, setIntegrations } = useIntegrationStore()
  const { data } = integrationQuery.useList()

  useEffect(() => {
    if (data) setIntegrations(data)
  }, [data, setIntegrations])

  const platforms = Object.keys(integrations?.integrations ?? {})

  return (
    <Controller
      control={control}
      name="options.automaticPosting"
      render={({ field }) => (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">Automatic posting</p>
              <p className="text-xs text-muted-foreground">
                Automatically post to your connected platforms
              </p>
            </div>
            <Switch
              size="large"
              checked={!!field.value}
              onCheckedChange={(checked) => {
                if (checked && platforms.length === 0) {
                  toast.error("Please connect your account in plugins.")
                  return
                }
                field.onChange(checked)
                setValue("postingDefaultType", checked ? platforms[0] : null, {
                  shouldDirty: true,
                })
              }}
            />
          </div>

          {field.value && platforms.length > 0 && (
            <Controller
              control={control}
              name="postingDefaultType"
              render={({ field: platform, fieldState }) => (
                <div className="space-y-1.5">
                  <label htmlFor="posting-platform" className="text-sm font-semibold">
                    Publishing platform
                  </label>
                  <select
                    id="posting-platform"
                    value={platform.value ?? ""}
                    onChange={(e) => platform.onChange(e.target.value)}
                    className="select select-bordered h-10 min-h-0 w-full rounded-lg text-sm"
                  >
                    {platforms.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                  {fieldState.error && (
                    <p className="text-xs text-destructive">{fieldState.error.message}</p>
                  )}
                </div>
              )}
            />
          )}
        </div>
      )}
    />
  )
}
