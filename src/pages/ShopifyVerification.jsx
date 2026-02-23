import React, { useState, useEffect } from "react"
import {
  CheckCircle,
  Store,
  Loader2,
  AlertCircle,
  Eye,
  ExternalLink,
  ChevronRight,
  RefreshCcw,
  Home,
  LayoutDashboard,
  ShieldCheck,
  Search,
  ChevronDown,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useNavigate, useSearchParams } from "react-router-dom"
import axiosInstance from "@api/index"

const ShopifyVerification = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [verified, setVerified] = useState(false)
  const [error, setError] = useState(null)
  const [blogData, setBlogData] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [sortConfig, setSortConfig] = useState({ key: "postedOn", direction: "desc" })

  useEffect(() => {
    async function init() {
      try {
        setLoading(true)
        // @ts-ignore
        if (!window?.shopify?.idToken) {
          setError(
            "Shopify App Bridge not detected. Please access this page from your Shopify Admin."
          )
          setLoading(false)
          return
        }

        const token = await window.shopify.idToken()
        const res = await axiosInstance.post("/callbacks/verify", { type: "SHOPIFY", token })

        if (res.status === 200) {
          setVerified(true)
          setBlogData(res.data.blogs || [])
          setError(null)
        } else {
          setError("Authentication failed. Please try again.")
        }
      } catch (err) {
        console.error("Error fetching token or data:", err)
        setError(
          err.response?.data?.message || err.message || "Failed to verify Shopify integration"
        )
      } finally {
        setLoading(false)
      }
    }

    if (window?.shopify) {
      init()
    } else {
      const handleShopifyLoaded = () => init()
      window.addEventListener("shopify.loaded", handleShopifyLoaded)

      // Fallback timeout
      const timeout = setTimeout(() => {
        if (!verified && !error && loading) {
          setError(
            "Shopify integration timed out. Ensure you are accessing this from Shopify Admin."
          )
          setLoading(false)
        }
      }, 5000)

      return () => {
        window.removeEventListener("shopify.loaded", handleShopifyLoaded)
        clearTimeout(timeout)
      }
    }
  }, [])

  // Table Data Sorting & Filtering
  const filteredData = blogData.filter(blog =>
    blog.blogId?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const sortedData = [...filteredData].sort((a, b) => {
    let aVal = a[sortConfig.key]
    let bVal = b[sortConfig.key]

    if (sortConfig.key === "title") {
      aVal = a.blogId?.title || ""
      bVal = b.blogId?.title || ""
    }

    if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1
    if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1
    return 0
  })

  const requestSort = key => {
    let direction = "asc"
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key, direction })
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-50 via-purple-50 to-teal-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-7xl"
      >
        <div className="bg-white/70 backdrop-blur-xl shadow rounded-3xl overflow-hidden border border-white/40">
          <AnimatePresence mode="wait">
            {/* ⏳ LOADING STATE */}
            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-24 text-center"
              >
                <div className="flex flex-col items-center">
                  <div className="relative mb-8">
                    <div className="absolute inset-0 bg-purple-200 blur-2xl opacity-50 rounded-full animate-pulse"></div>
                    <motion.div className="relative bg-white p-6 rounded-3xl shadow-xl">
                      <Store className="size-16 text-purple-600" />
                    </motion.div>
                  </div>
                  <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">
                    Verifying Integration
                  </h1>
                  <p className="text-gray-500 font-medium mb-8">
                    Connecting securely to your Shopify storefront...
                  </p>
                  <span className="loading loading-spinner loading-lg text-purple-600"></span>
                </div>
              </motion.div>
            )}

            {/* ❌ ERROR STATE */}
            {!loading && error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-8 sm:p-16 text-center"
              >
                <div className="bg-rose-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8">
                  <AlertCircle className="size-12 text-rose-600" />
                </div>
                <h2 className="text-3xl font-black text-gray-900 mb-4">Verification Failed</h2>
                <div className="max-w-md mx-auto text-center space-y-6">
                  <p className="text-gray-500 font-medium bg-rose-50/50 p-4 rounded-2xl border border-rose-100">
                    {error}
                  </p>

                  <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 text-left">
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                      Troubleshooting
                    </h3>
                    <ul className="text-sm text-gray-500 space-y-3">
                      <li className="flex gap-2">
                        <ChevronRight className="size-4 text-rose-400 shrink-0 mt-0.5" />
                        <span>Ensure you are logged into Shopify Admin</span>
                      </li>
                      <li className="flex gap-2">
                        <ChevronRight className="size-4 text-rose-400 shrink-0 mt-0.5" />
                        <span>Check your internet connection</span>
                      </li>
                      <li className="flex gap-2">
                        <ChevronRight className="size-4 text-rose-400 shrink-0 mt-0.5" />
                        <span>Verify Shopify App Bridge is configured</span>
                      </li>
                    </ul>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                      onClick={() => window.location.reload()}
                      className="btn btn-primary rounded-2xl bg-purple-600 border-none font-bold normal-case h-14 px-8"
                    >
                      <RefreshCcw className="size-4 mr-2" /> Try Again
                    </button>
                    <button
                      onClick={() => navigate("/")}
                      className="btn btn-ghost rounded-2xl font-bold normal-case h-14 px-8"
                    >
                      <Home className="size-4 mr-2" /> Go Home
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ✅ VERIFIED STATE */}
            {!loading && !error && verified && (
              <motion.div
                key="verified"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-6 sm:p-10"
              >
                <div className="bg-emerald-50/50 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6 border border-emerald-100 mb-10">
                  <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-emerald-200">
                    <CheckCircle className="size-10 text-white" />
                  </div>
                  <div className="text-center md:text-left">
                    <h2 className="text-3xl font-black text-emerald-800 mb-1">You Are Verified!</h2>
                    <p className="text-emerald-600 font-medium">
                      Your store has been successfully linked. Session token verified securely.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8">
                  <h3 className="text-2xl font-black text-gray-900">Posted Blogs</h3>

                  <div className="relative w-full sm:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search blogs..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="input input-bordered w-full pl-12 rounded-2xl bg-white border-gray-100 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 h-14 font-medium"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto rounded-3xl border border-gray-100 bg-white">
                  <table className="table table-zebra w-full overflow-hidden">
                    <thead>
                      <tr className="bg-gray-50/50">
                        <th
                          onClick={() => requestSort("title")}
                          className="cursor-pointer hover:bg-gray-100 transition-colors py-6 pl-8"
                        >
                          <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-black text-gray-500">
                            Blog Title{" "}
                            <ChevronDown
                              className={`size-4 transition-transform ${sortConfig.key === "title" && sortConfig.direction === "desc" ? "rotate-180" : ""}`}
                            />
                          </div>
                        </th>
                        <th
                          onClick={() => requestSort("postedOn")}
                          className="cursor-pointer hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-black text-gray-500">
                            Posted On{" "}
                            <ChevronDown
                              className={`size-4 transition-transform ${sortConfig.key === "postedOn" && sortConfig.direction === "desc" ? "rotate-180" : ""}`}
                            />
                          </div>
                        </th>
                        <th className="text-xs uppercase tracking-widest font-black text-gray-500">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-700 font-medium">
                      {sortedData.length > 0 ? (
                        sortedData.map(record => (
                          <tr key={record._id} className="hover:bg-purple-50/50 transition-colors">
                            <td className="py-5 pl-8">
                              <span className="font-black text-gray-900">
                                {record.blogId?.title || "Untitled"}
                              </span>
                            </td>
                            <td>
                              {new Date(record.postedOn).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </td>
                            <td>
                              <div className="flex gap-2">
                                <button
                                  onClick={() =>
                                    window.open(`/blog/${record.blogId._id}`, "_blank")
                                  }
                                  className="btn btn-ghost btn-sm text-purple-600 hover:bg-purple-100 rounded-lg font-bold gap-2"
                                >
                                  <Eye className="size-4" /> Edit
                                </button>
                                <button
                                  onClick={() => window.open(record.link, "_blank")}
                                  className="btn btn-ghost btn-sm text-teal-600 hover:bg-teal-100 rounded-lg font-bold gap-2"
                                >
                                  <ExternalLink className="size-4" /> Shopify
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="3"
                            className="py-20 text-center text-gray-400 font-bold italic"
                          >
                            No blogs found matching your search.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-12 text-center">
                  <button
                    onClick={() => navigate("/dashboard")}
                    className="btn btn-primary btn-lg rounded-2xl font-black text-xl bg-linear-to-r from-purple-600 to-teal-600 border-none text-white shadow-xl shadow-purple-200 hover:scale-[1.02] transition-transform normal-case h-16 w-full sm:w-80 gap-3"
                  >
                    <LayoutDashboard className="size-6" />
                    Go to Dashboard
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}

export default ShopifyVerification
