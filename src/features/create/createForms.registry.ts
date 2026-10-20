import { lazy } from "react"
import type { ComponentType, LazyExoticComponent } from "react"

/**
 * Every single-page create form, keyed by the `:kind` segment of `/create/:kind`. Adding a
 * form is one entry here plus its route-free component — `CreatePage` and the router already
 * resolve everything from this table.
 */

export type CreateFormKind = "quick" | "simple" | "youtube" | "advanced" | "bulk" | "job"

/** Props the page hands every form; a form ignores what it does not need. */
export interface CreateFormProps {
  /** `:id` segment — the record being edited, when the form supports editing. */
  id?: string
  /** Seed values from the page that linked here (e.g. keywords picked in Keyword Research). */
  prefill?: Record<string, unknown>
}

interface CreateFormEntry {
  component: LazyExoticComponent<ComponentType<any>>
  /** Props fixed by the kind, e.g. quick vs yt share one component. */
  props?: Record<string, unknown>
}

const QuickBlogForm = lazy(() => import("./QuickBlogForm"))
const SimpleBlogForm = lazy(() => import("./SimpleBlogForm"))
const BulkBlogForm = lazy(() => import("./BulkBlogForm"))
const AdvancedBlogForm = lazy(() => import("./AdvancedBlogForm"))
const JobForm = lazy(() => import("./JobForm"))

export const CREATE_FORMS: Partial<Record<CreateFormKind, CreateFormEntry>> = {
  quick: { component: QuickBlogForm, props: { type: "quick" } },
  simple: { component: SimpleBlogForm },
  youtube: { component: QuickBlogForm, props: { type: "yt" } },
  advanced: { component: AdvancedBlogForm },
  bulk: { component: BulkBlogForm },
  job: { component: JobForm },
}

export const isCreateFormKind = (kind: string | undefined): kind is CreateFormKind =>
  !!kind && kind in CREATE_FORMS

/** `/create/quick`, `/create/job/<id>` — keep links to these forms going through here. */
export const createFormPath = (kind: CreateFormKind, id?: string) =>
  id ? `/create/${kind}/${id}` : `/create/${kind}`
