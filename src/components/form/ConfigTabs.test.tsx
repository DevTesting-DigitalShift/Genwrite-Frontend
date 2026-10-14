import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { FormProvider, useForm } from "react-hook-form"
import { describe, expect, it } from "vitest"
import { ConfigTabs } from "./ConfigTabs"

const Icon = () => null

function Harness() {
  const form = useForm({ defaultValues: { brandId: null as string | null } })
  return (
    <FormProvider {...form}>
      <button type="button" onClick={() => form.setError("brandId", { message: "Pick one" })}>
        fail
      </button>
      <ConfigTabs
        tabs={[
          { id: "writing", label: "Writing", icon: Icon, content: <p>writing panel</p> },
          {
            id: "brand",
            label: "Brand voice",
            icon: Icon,
            badge: "On",
            fields: ["brandId"],
            content: <p>brand panel</p>,
          },
        ]}
      />
    </FormProvider>
  )
}

describe("ConfigTabs", () => {
  it("keeps inactive panels mounted but hidden, and shows tab badges", () => {
    render(<Harness />)
    expect(screen.getByText("brand panel")).toBeInTheDocument()
    expect(screen.getByText("brand panel").closest("[role=tabpanel]")).toHaveAttribute(
      "data-state",
      "inactive"
    )
    expect(screen.getByRole("tab", { name: /Brand voice/ })).toHaveTextContent("On")
  })

  it("switches to the tab holding an error and marks it", async () => {
    render(<Harness />)
    expect(screen.getByRole("tab", { name: /Writing/ })).toHaveAttribute("data-state", "active")

    fireEvent.click(screen.getByText("fail"))

    await waitFor(() =>
      expect(screen.getByRole("tab", { name: /Brand voice/ })).toHaveAttribute(
        "data-state",
        "active"
      )
    )
    expect(screen.getByRole("tab", { name: /Brand voice/ })).toHaveTextContent("(has errors)")
  })
})
