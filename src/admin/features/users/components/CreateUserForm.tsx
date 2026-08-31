import { Eye, EyeOff } from "lucide-react"
import { useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select"
import type { AdminCreateUserInput } from "@admin/types/admin"

interface CreateUserFormProps {
  onSubmit: (data: AdminCreateUserInput) => Promise<void>
  onCancel: () => void
  isLoading: boolean
}

export function CreateUserForm({ onSubmit, onCancel, isLoading }: CreateUserFormProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [role, setRole] = useState<"user" | "tester" | "admin">("user")
  const [plan, setPlan] = useState<"free" | "basic" | "pro">("free")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit({ name, email, password, role, plan })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="create-user-name" className="block text-sm font-medium text-gray-700 mb-1">
          Name
        </label>
        <input
          id="create-user-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
        />
      </div>
      <div>
        <label htmlFor="create-user-email" className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          id="create-user-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
        />
      </div>
      <div>
        <label
          htmlFor="create-user-password"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Password
        </label>
        <div className="relative">
          <input
            id="create-user-password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="create-user-role"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Role
          </label>
          <Select
            value={role}
            onValueChange={(value: string) => setRole(value as "user" | "tester" | "admin")}
          >
            <SelectTrigger id="create-user-role" className="w-full">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="tester">Tester</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label
            htmlFor="create-user-plan"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Plan
          </label>
          <Select
            value={plan}
            onValueChange={(value: string) => setPlan(value as "free" | "basic" | "pro")}
          >
            <SelectTrigger id="create-user-plan" className="w-full">
              <SelectValue placeholder="Select plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="basic">Basic</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 disabled:opacity-50 text-sm font-medium"
        >
          {isLoading ? "Creating..." : "Create User"}
        </button>
      </div>
    </form>
  )
}
