import { useNavigate } from "react-router-dom"

interface AdminHeaderProps {
  title: string
  subtitle?: string
  showBackButton?: boolean
  backTo?: string
}

export default function AdminHeader({
  title,
  subtitle,
  showBackButton = false,
  backTo = "/admin/dashboard",
}: AdminHeaderProps) {
  const navigate = useNavigate()

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {showBackButton && (
              <>
                <button
                  type="button"
                  onClick={() => navigate(backTo)}
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  ← Back
                </button>
                <div className="h-6 w-px bg-gray-300" />
              </>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              {subtitle && <p className="text-gray-600 text-sm mt-1">{subtitle}</p>}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
