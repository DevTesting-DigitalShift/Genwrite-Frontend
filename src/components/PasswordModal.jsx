import React, { useState } from "react"
import { toast } from "sonner"
import { LockClosedIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline"
import { X } from "lucide-react"

const PasswordModal = ({ visible, onClose, hasPassword, onSubmit }) => {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [errors, setErrors] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" })
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const validatePassword = value => {
    if (!value) {
      return "Password is required"
    }
    if (value.length < 8) {
      return "Password must be at least 8 characters"
    }
    if (!/(?=.*[a-z])/.test(value)) {
      return "Password must contain at least one lowercase letter"
    }
    if (!/(?=.*[A-Z])/.test(value)) {
      return "Password must contain at least one uppercase letter"
    }
    if (!/(?=.*\d)/.test(value)) {
      return "Password must contain at least one number"
    }
    if (!/(?=.*[@$!%*?&#])/.test(value)) {
      return "Password must contain at least one special character (@$!%*?&#)"
    }
    return ""
  }

  const validateForm = () => {
    const newErrors = { oldPassword: "", newPassword: "", confirmPassword: "" }

    if (hasPassword && !formData.oldPassword) {
      newErrors.oldPassword = "Please enter your old password"
    }

    const passwordError = validatePassword(formData.newPassword)
    if (passwordError) {
      newErrors.newPassword = passwordError
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password"
    } else if (formData.confirmPassword !== formData.newPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    setErrors(newErrors)
    return !Object.values(newErrors).some(error => error !== "")
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    try {
      setLoading(true)
      await onSubmit(formData)

      toast.success(hasPassword ? "Password changed successfully!" : "Password set successfully!")
      handleCancel()
    } catch (error) {
      toast.error(error.message || "Failed to update password")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({ oldPassword: "", newPassword: "", confirmPassword: "" })
    setErrors({ oldPassword: "", newPassword: "", confirmPassword: "" })
    setShowOldPassword(false)
    setShowNewPassword(false)
    setShowConfirmPassword(false)
    onClose()
  }

  const handleInputChange = e => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }))
    }
  }

  return (
    <dialog className={`modal ${visible ? "modal-open" : ""}`}>
      <div className="modal-box w-full max-w-lg p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <LockClosedIcon className="w-5 h-5 text-blue-600" />
            <span>{hasPassword ? "Change Password" : "Set Password"}</span>
          </div>
          <button className="btn btn-sm btn-circle btn-ghost" onClick={handleCancel}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* content */}
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-800 font-medium mb-1">Password Requirements:</p>
            <ul className="text-xs text-blue-700 space-y-0.5 list-disc list-inside">
              <li>At least 8 characters long</li>
              <li>Contains uppercase and lowercase letters</li>
              <li>Contains at least one number</li>
              <li>Contains at least one special character (@$!%*?&#)</li>
            </ul>
          </div>
          {hasPassword && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Old Password</label>
              <div className="relative">
                <input
                  type={showOldPassword ? "text" : "password"}
                  name="oldPassword"
                  value={formData.oldPassword}
                  onChange={handleInputChange}
                  placeholder="Enter your old password"
                  autoComplete="current-password"
                  className={`input input-bordered w-full pr-10 ${
                    errors.oldPassword ? "input-error" : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showOldPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.oldPassword && (
                <p className="mt-1 text-sm text-error">{errors.oldPassword}</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleInputChange}
                placeholder="Enter your new password"
                autoComplete="new-password"
                className={`input input-bordered w-full pr-10 ${
                  errors.newPassword ? "input-error" : ""
                }`}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.newPassword && <p className="mt-1 text-sm text-error">{errors.newPassword}</p>}
            {!errors.newPassword && (
              <p className="mt-1 text-xs text-gray-500">
                Password must be at least 8 characters with uppercase, lowercase, number, and
                special character
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm your new password"
                autoComplete="new-password"
                className={`input input-bordered w-full pr-10 ${
                  errors.confirmPassword ? "input-error" : ""
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-error">{errors.confirmPassword}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-action flex items-center gap-2 mt-6">
          <button onClick={handleCancel} className="btn btn-ghost hover:bg-gray-100">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn btn-primary text-white disabled:opacity-50"
          >
            {loading ? <span className="loading loading-spinner loading-sm"></span> : null}
            {loading ? "Processing..." : hasPassword ? "Change Password" : "Set Password"}
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={handleCancel}>close</button>
      </form>
    </dialog>
  )
}

export default PasswordModal
