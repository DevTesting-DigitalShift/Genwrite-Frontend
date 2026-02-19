import React from "react"
import {
  CheckCircle,
  Store,
  ArrowRight,
  Copy,
  Download,
  ShieldCheck,
  Zap,
  BookOpen,
  LayoutDashboard,
} from "lucide-react"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import toast from "@utils/toast"

const ShopifyDashboard = () => {
  const navigate = useNavigate()

  const storeDomain = "your-store.myshopify.com" // Replace dynamically later
  const connectedAt = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  const copyToClipboard = text => {
    navigator.clipboard.writeText(text)
    toast.success("Store URL copied to clipboard")
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-4xl"
      >
        <div className="bg-white shadow-2xl rounded-3xl overflow-hidden border border-white/20">
          {/* Success Header */}
          <div className="p-8 sm:p-12 text-center bg-linear-to-b from-emerald-50/50 to-white">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
              className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-200"
            >
              <CheckCircle className="size-12 text-white" />
            </motion.div>
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4 tracking-tight">
              Store Connected Successfully!
            </h1>
            <p className="text-gray-500 text-lg sm:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
              Your Shopify store is now linked with <strong>GenWrite</strong>. You can now publish
              AI-generated content directly to your storefront.
            </p>
          </div>

          <div className="px-8 sm:px-12 pb-12">
            <div className="h-px bg-linear-to-r from-transparent via-gray-100 to-transparent mb-12"></div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              {/* Store Info Card */}
              <div className="lg:col-span-5">
                <div className="bg-linear-to-br from-emerald-50 to-teal-100/50 p-6 rounded-3xl border border-emerald-100 h-full relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Store className="size-24 rotate-12" />
                  </div>

                  <div className="relative space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                        <Store className="size-6 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 truncate max-w-[200px]">
                          {storeDomain}
                        </h3>
                        <p className="text-xs font-bold text-gray-400">
                          Connected on {connectedAt}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <div className="badge badge-success gap-1 font-bold py-3 text-white border-none">
                        <CheckCircle className="size-3" /> Active
                      </div>
                      <div className="badge badge-info gap-1 font-bold py-3 text-white border-none">
                        <ShieldCheck className="size-3" /> Verified
                      </div>
                    </div>

                    <button
                      onClick={() => copyToClipboard(storeDomain)}
                      className="btn btn-ghost btn-sm normal-case font-bold text-emerald-600 hover:bg-white gap-2 flex items-center"
                    >
                      <Copy className="size-4" /> Copy URL
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="lg:col-span-7">
                <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2">
                  <Zap className="size-5 text-amber-500" /> What’s Next?
                </h3>

                <div className="space-y-4">
                  {[
                    {
                      title: "Publish Blog Post",
                      desc: "Create SEO-optimized blogs directly to your store.",
                      icon: <BookOpen className="size-5 text-emerald-600" />,
                      color: "emerald",
                      action: () => navigate("/content/create?platform=shopify"),
                    },
                    {
                      title: "Sync Products",
                      desc: "Auto-generate and update product descriptions.",
                      icon: <Zap className="size-5 text-teal-600" />,
                      color: "teal",
                      action: () => navigate("/products/sync"),
                    },
                    {
                      title: "Integration Guide",
                      desc: "Learn advanced features and best practices.",
                      icon: <Download className="size-5 text-cyan-600" />,
                      color: "cyan",
                      action: () => window.open("https://docs.genwrite.ai/shopify", "_blank"),
                    },
                  ].map((item, idx) => (
                    <motion.div
                      key={idx}
                      whileHover={{ x: 8, backgroundColor: "#f9fafb" }}
                      onClick={item.action}
                      className="flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-50 cursor-pointer transition-all hover:border-emerald-100 group"
                    >
                      <div
                        className={`w-12 h-12 rounded-xl bg-${item.color}-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}
                      >
                        {item.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900">{item.title}</h4>
                        <p className="text-sm text-gray-500 font-medium">{item.desc}</p>
                      </div>
                      <ArrowRight className="size-5 text-gray-300 group-hover:text-emerald-500 transition-colors" />
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer CTA */}
            <div className="mt-12 text-center">
              <button
                onClick={() => navigate("/dashboard")}
                className="btn btn-primary btn-lg rounded-2xl font-black text-xl bg-linear-to-r from-emerald-500 to-teal-600 border-none text-white shadow-xl shadow-emerald-200 hover:scale-[1.02] transition-transform normal-case h-16 w-full sm:w-80 gap-3"
              >
                <LayoutDashboard className="size-6" />
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default ShopifyDashboard
