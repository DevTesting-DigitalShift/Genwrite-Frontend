import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Columns3,
  Search,
} from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@components/ui/table"
import { useViewport } from "@/hooks/useViewport"
import type {
  AdminCreateUserInput,
  AdminManagedUser,
  AdminUserListResponse,
} from "@admin/types/admin"
import { EmptyState } from "@admin/shared/components/EmptyState"
import { ErrorAlert } from "@admin/shared/components/ErrorAlert"
import { CreateUserForm } from "../components/CreateUserForm"
import { createAdminUser, getAdminUsers } from "../api/usersApi"

type ModalType = "create" | null

type ColumnKey =
  | "user"
  | "email"
  | "accountType"
  | "plan"
  | "credits"
  | "blogs"
  | "brands"
  | "jobs"
  | "transactions"
  | "createdAt"
  | "actions"

const DEFAULT_VISIBLE_COLUMNS: ColumnKey[] = [
  "user",
  "email",
  "accountType",
  "plan",
  "credits",
  "createdAt",
  "blogs",
]

// Fields present at runtime but not declared on AdminManagedUser
interface ManagedUserRow extends AdminManagedUser {
  accountType?: string
  subscriptionPlan?: string
  totalCredits?: number
  totalCreatedBlogs?: number
  totalCreatedBrands?: number
  totalCreatedJobs?: number
  totalTransactions?: number
}

function TableRowSkeleton() {
  return (
    <TableRow className="animate-pulse">
      {Array.from({ length: 7 }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton row, no reordering
        <TableCell key={i}>
          <div className="h-4 bg-gray-200 rounded w-20 mx-auto" />
        </TableCell>
      ))}
    </TableRow>
  )
}

function accountTypeBadgeClass(accountType: string) {
  switch (accountType) {
    case "trial":
      return "bg-yellow-100 text-yellow-800"
    case "subscribed":
      return "bg-purple-100 text-purple-800"
    case "test":
      return "bg-blue-100 text-blue-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

function planBadgeClass(plan: string) {
  switch (plan) {
    case "enterprise":
      return "bg-amber-100 text-amber-800"
    case "pro":
      return "bg-purple-100 text-purple-800"
    case "basic":
      return "bg-blue-100 text-blue-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export default function AdminUsers() {
  const navigate = useNavigate()
  const { isDesktop } = useViewport()

  const [allUsers, setAllUsers] = useState<ManagedUserRow[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState("")
  const [userTypeFilter, setUserTypeFilter] = useState<
    "all" | "normal" | "trial" | "subscribed" | "test"
  >("all")

  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(DEFAULT_VISIBLE_COLUMNS)

  const toggleColumn = (column: ColumnKey) => {
    setVisibleColumns((prev) =>
      prev.includes(column) ? prev.filter((c) => c !== column) : [...prev, column]
    )
  }

  const isColumnVisible = (column: ColumnKey) => visibleColumns.includes(column)

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const data: AdminUserListResponse = await getAdminUsers({ page: 1, limit: 1000 })
      setAllUsers((data.users as ManagedUserRow[]) || [])
    } catch (err) {
      console.error("Failed to fetch users:", err)
      setError("Failed to load users. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  useEffect(() => {
    setCurrentPage(1)
  }, [])

  const filteredUsers = allUsers.filter((user) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesName = user.name?.toLowerCase().includes(query)
      const matchesEmail = user.email?.toLowerCase().includes(query)
      if (!matchesName && !matchesEmail) return false
    }

    if (userTypeFilter !== "all") {
      const accountType = user.accountType || "normal"
      if (accountType !== userTypeFilter) return false
    }

    return true
  })

  const itemsPerPage = 10
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage)

  const handleCreateUser = async (data: AdminCreateUserInput) => {
    try {
      setIsSubmitting(true)
      await createAdminUser(data)
      setActiveModal(null)
      await fetchUsers()
    } catch (err) {
      console.error("Failed to create user:", err)
      alert("Failed to create user. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const closeModal = () => setActiveModal(null)
  const handleRowClick = (userId: string) => navigate(`/admin/users/${userId}`)

  return (
    <>
      <main className="w-full">
        {error && <ErrorAlert message={error} onAction={() => fetchUsers()} actionLabel="Retry" />}

        <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex flex-col space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 sm:pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                />
              </div>

              <Button
                onClick={() => setActiveModal("create")}
                className="bg-gray-800 hover:bg-gray-900 text-white whitespace-nowrap"
                size="default"
              >
                <span className="text-lg mr-1">+</span> Add User
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 whitespace-nowrap">Filter:</span>
                <Select
                  value={userTypeFilter}
                  onValueChange={(value: string) =>
                    setUserTypeFilter(value as typeof userTypeFilter)
                  }
                >
                  <SelectTrigger className="w-full sm:w-[180px] h-9">
                    <SelectValue placeholder="All Users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="subscribed">Subscribed</SelectItem>
                    <SelectItem value="test">Test</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between sm:justify-start space-x-3">
                <span className="text-xs sm:text-sm text-gray-500">
                  {filteredUsers.length} {filteredUsers.length === 1 ? "user" : "users"}
                  {(searchQuery || userTypeFilter !== "all") &&
                    allUsers.length !== filteredUsers.length && (
                      <span className="text-gray-400"> (filtered from {allUsers.length})</span>
                    )}
                </span>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 border-gray-300 text-gray-700"
                    >
                      <Columns3 className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Columns</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {(
                      [
                        ["user", "User"],
                        ["email", "Email"],
                        ["accountType", "Account Type"],
                        ["plan", "Plan"],
                        ["credits", "Credits"],
                        ["blogs", "Blogs"],
                        ["brands", "Brands"],
                        ["jobs", "Jobs"],
                        ["transactions", "Transactions"],
                        ["createdAt", "Created At"],
                        ["actions", "Actions"],
                      ] as [ColumnKey, string][]
                    ).map(([key, label]) => (
                      <DropdownMenuCheckboxItem
                        key={key}
                        checked={isColumnVisible(key)}
                        onCheckedChange={() => toggleColumn(key)}
                      >
                        {label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm w-full max-w-[90vw] md:max-w-full overflow-hidden">
          <div className="overflow-x-auto w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  {isColumnVisible("user") && <TableHead className="min-w-[180px]">User</TableHead>}
                  {isColumnVisible("email") && (
                    <TableHead className="min-w-[200px]">Email</TableHead>
                  )}
                  {isColumnVisible("accountType") && (
                    <TableHead className="min-w-[160px]">Account Type</TableHead>
                  )}
                  {isColumnVisible("plan") && <TableHead className="min-w-[100px]">Plan</TableHead>}
                  {isColumnVisible("credits") && (
                    <TableHead className="min-w-[100px] text-right">Credits</TableHead>
                  )}
                  {isColumnVisible("blogs") && (
                    <TableHead className="min-w-[80px] text-center">Blogs</TableHead>
                  )}
                  {isColumnVisible("brands") && (
                    <TableHead className="min-w-[80px] text-center">Brands</TableHead>
                  )}
                  {isColumnVisible("jobs") && (
                    <TableHead className="min-w-[80px] text-center">Jobs</TableHead>
                  )}
                  {isColumnVisible("transactions") && (
                    <TableHead className="min-w-[100px] text-center">Transactions</TableHead>
                  )}
                  {isColumnVisible("createdAt") && (
                    <TableHead className="min-w-[120px] text-center">Created At</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <>
                    {Array.from({ length: 5 }).map((_, i) => (
                      // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list, no reordering
                      <TableRowSkeleton key={i} />
                    ))}
                  </>
                ) : paginatedUsers.length > 0 ? (
                  paginatedUsers.map((user) => (
                    <TableRow
                      key={user._id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleRowClick(user._id)}
                    >
                      {isColumnVisible("user") && (
                        <TableCell className="font-medium">
                          <div className="capitalize">{user.name}</div>
                        </TableCell>
                      )}
                      {isColumnVisible("email") && (
                        <TableCell>
                          <div className="truncate max-w-[200px]">{user.email}</div>
                        </TableCell>
                      )}
                      {isColumnVisible("accountType") && (
                        <TableCell>
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${accountTypeBadgeClass(
                              user.accountType || "normal"
                            )}`}
                          >
                            {user.accountType || "normal"}
                          </span>
                        </TableCell>
                      )}
                      {isColumnVisible("plan") && (
                        <TableCell>
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${planBadgeClass(
                              (user.subscriptionPlan || "free").toLowerCase()
                            )}`}
                          >
                            {user.subscriptionPlan || "free"}
                          </span>
                        </TableCell>
                      )}
                      {isColumnVisible("credits") && (
                        <TableCell className="text-right">
                          <span className="font-medium">
                            {(user.totalCredits || 0).toLocaleString()}
                          </span>
                        </TableCell>
                      )}
                      {isColumnVisible("blogs") && (
                        <TableCell className="text-center">
                          <span className="text-sm text-gray-700">
                            {user.totalCreatedBlogs || 0}
                          </span>
                        </TableCell>
                      )}
                      {isColumnVisible("brands") && (
                        <TableCell className="text-center">
                          <span className="text-sm text-gray-700">
                            {user.totalCreatedBrands || 0}
                          </span>
                        </TableCell>
                      )}
                      {isColumnVisible("jobs") && (
                        <TableCell className="text-center">
                          <span className="text-sm text-gray-700">
                            {user.totalCreatedJobs || 0}
                          </span>
                        </TableCell>
                      )}
                      {isColumnVisible("transactions") && (
                        <TableCell className="text-center">
                          <span className="text-sm text-gray-700">
                            {user.totalTransactions || 0}
                          </span>
                        </TableCell>
                      )}
                      {isColumnVisible("createdAt") && (
                        <TableCell className="text-center">
                          <span className="text-sm text-gray-700 whitespace-nowrap">
                            {user.createdAt
                              ? new Date(user.createdAt).toLocaleDateString(undefined, {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })
                              : "-"}
                          </span>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={visibleColumns.length} className="h-32 text-center">
                      <EmptyState
                        title="No users found"
                        description={
                          searchQuery || userTypeFilter !== "all"
                            ? `No users match your current filters${searchQuery ? ` (search: "${searchQuery}")` : ""}${
                                userTypeFilter !== "all" ? ` (type: ${userTypeFilter})` : ""
                              }`
                            : "There are no users to display"
                        }
                        height="150px"
                      />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="px-3 sm:px-6 py-3 sm:py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <p className="text-xs sm:text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </p>
                <span className="text-xs text-gray-500">
                  ({filteredUsers.length} {filteredUsers.length === 1 ? "user" : "users"})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                  title="First page"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-8"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Previous</span>
                  <span className="sm:hidden">Prev</span>
                </Button>

                {isDesktop && (
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        pageNum = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = currentPage - 2 + i
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className="h-8 w-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8"
                >
                  <span className="hidden sm:inline">Next</span>
                  <span className="sm:hidden">Next</span>
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                  title="Last page"
                >
                  <ChevronsRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Dialog
        open={activeModal === "create"}
        onOpenChange={(open: boolean) => !open && closeModal()}
      >
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Create New User</DialogTitle>
            <DialogDescription className="text-sm">
              Add a new user to the system with custom settings.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <CreateUserForm
              onSubmit={handleCreateUser}
              onCancel={closeModal}
              isLoading={isSubmitting}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
