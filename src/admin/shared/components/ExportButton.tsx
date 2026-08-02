import { Download } from "lucide-react"
import { useState } from "react"
import { Button } from "@components/ui/button"
import { exportAdminData } from "../api/exportApi"

interface ExportButtonProps {
  dataType: "revenue" | "users" | "jobs"
  label?: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
}

function getErrorMessage(err: unknown, fallback: string): string {
  const response = (err as { response?: { data?: { message?: string } } })?.response
  return response?.data?.message || (err as Error)?.message || fallback
}

export function ExportButton({
  dataType,
  label = "Export CSV",
  variant = "outline",
  size = "default",
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    try {
      setIsExporting(true)
      const blob = await exportAdminData(dataType)

      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${dataType}_export_${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      alert(getErrorMessage(error, "Failed to export data. Please try again."))
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      disabled={isExporting}
      onClick={handleExport}
      className="border-gray-300"
    >
      <Download className="w-4 h-4 mr-2" />
      {isExporting ? "Exporting..." : label}
    </Button>
  )
}
