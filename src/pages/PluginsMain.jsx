import { useState, useEffect, useMemo, useRef } from "react"
import {
  Server,
  Download,
  Tag,
  Clock,
  CheckCircle,
  Edit,
  Globe,
  XCircle,
  Eye,
  EyeOff,
  LayoutGrid,
  Settings,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  PlayCircle,
  Info,
  RefreshCw,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { pluginsData } from "@/data/pluginsData"
import { Helmet } from "react-helmet"
import useAuthStore from "@store/useAuthStore"
import useIntegrationStore from "@store/useIntegrationStore"
import axiosInstance from "@api/index"
import { FaShopify, FaWix, FaYoutube, FaWordpress } from "react-icons/fa"
import { toast } from "sonner"

const PluginsMain = () => {
  const [wordpressStatus, setWordpressStatus] = useState({})
  const [activeTab, setActiveTab] = useState(null)
  const {
    integrations,
    loading,
    fetchIntegrations,
    createIntegration,
    pingIntegration,
    updateIntegration: updateExistingIntegration,
    fetchCategories,
    categories,
    ping,
    loading: postsLoading,
  } = useIntegrationStore()

  const plugins = useMemo(() => pluginsData(pingIntegration), [pingIntegration])

  const extendedPlugins = useMemo(() => {
    return plugins.filter(p => p.isVisible)
  }, [plugins])

  useEffect(() => {
    fetchIntegrations()
    if (extendedPlugins.length > 0 && !activeTab) {
      setActiveTab(extendedPlugins[0].id.toString())
      checkPlugin(extendedPlugins[0])
    }
  }, [plugins, fetchIntegrations, activeTab])

  const checkPlugin = async plugin => {
    if (wordpressStatus[plugin.id]?.success) return

    try {
      const result = await plugin.onCheck()
      setWordpressStatus(prev => ({
        ...prev,
        [plugin.id]: { status: result.status, message: result.message, success: result.success },
      }))
    } catch (err) {
      console.error(`Error checking plugin ${plugin.pluginName}:`, err)
      setWordpressStatus(prev => ({
        ...prev,
        [plugin.id]: {
          status: err.response?.status || "error",
          message:
            err.response?.status === 400
              ? "No configuration found. Provide details below."
              : err.response?.status === 502
                ? `${plugin.pluginName} connection failed. Check service URL.`
                : `${plugin.pluginName} Connection Error`,
          success: false,
        },
      }))
    }
  }

  const handleTabChange = key => {
    setActiveTab(key)
    const plugin = plugins.find(p => p.id.toString() === key)
    if (plugin) {
      checkPlugin(plugin)
      if (plugin.pluginName.toLowerCase().includes("wordpress")) {
        fetchIntegrations()
      }
    }
  }

  const PluginTabContent = ({ plugin }) => {
    const wordpressInt = useMemo(() => integrations?.integrations?.WORDPRESS, [integrations])
    const serverInt = useMemo(() => integrations?.integrations?.SERVERENDPOINT, [integrations])

    // States for inputs
    const [url, setUrl] = useState(
      plugin.id === 112 ? serverInt?.url || "" : wordpressInt?.url || ""
    )
    const [frontend, setFrontend] = useState(serverInt?.frontend || "")
    const [authToken, setAuthToken] = useState(serverInt?.data ? "*".repeat(10) : "")
    const [isValidUrl, setIsValidUrl] = useState(!!(plugin.id === 112 ? serverInt : wordpressInt))
    const [isValidFrontend, setIsValidFrontend] = useState(!!serverInt)
    const [isEditing, setIsEditing] = useState(plugin.id === 112 ? !serverInt : !wordpressInt)
    const [localLoading, setLocalLoading] = useState(false)

    // WordPress credentials
    const [wpUsername, setWpUsername] = useState("")
    const [wpPassword, setWpPassword] = useState("")
    const [hasCredentials, setHasCredentials] = useState(!!wordpressInt)
    const [hasPinged, setHasPinged] = useState(!!sessionStorage.getItem("hasPinged"))

    useEffect(() => {
      if (plugin.id === 112 && serverInt) {
        setUrl(serverInt.url)
        setFrontend(serverInt.frontend)
        setAuthToken("*".repeat(10))
        setIsValidUrl(true)
        setIsValidFrontend(true)
        setIsEditing(false)
      } else if (plugin.id === 111 && wordpressInt) {
        setUrl(wordpressInt.url)
        setWpUsername("**********")
        setWpPassword("**********")
        setIsValidUrl(true)
        setIsEditing(false)
        setHasCredentials(true)
      }
    }, [wordpressInt, serverInt, plugin.id])

    useEffect(() => {
      if (integrations && !hasPinged && !sessionStorage.getItem("hasPinged")) {
        handlePing()
        setHasPinged(true)
        sessionStorage.setItem("hasPinged", "true")
      }
    }, [integrations, hasPinged])

    const handleUrlChange = e => {
      const val = e.target.value
      setUrl(val)
      try {
        new URL(val)
        setIsValidUrl(true)
      } catch {
        setIsValidUrl(false)
      }
    }

    const handleConnect = async () => {
      if (plugin.id === 112 && (!isValidUrl || !isValidFrontend || !authToken)) return
      if (plugin.id === 111 && !isValidUrl) return
      setLocalLoading(true)
      try {
        let payload
        if (plugin.id === 112) {
          if (authToken === "*".repeat(10)) {
            toast.error("Re-enter token to update")
            setLocalLoading(false)
            return
          }
          payload = { type: "SERVERENDPOINT", url, frontend, credentials: { authToken } }
        } else {
          if (wpUsername === "**********" || wpPassword === "**********") {
            toast.error("Re-enter credentials to update")
            setLocalLoading(false)
            return
          }
          payload = {
            type: "WORDPRESS",
            url,
            credentials: { user: wpUsername, password: wpPassword },
          }
        }
        await createIntegration(payload)
        await fetchIntegrations()
        setIsEditing(false)
        toast.success(`${plugin.pluginName} Linked!`)
      } catch (err) {
        toast.error(err.message || "Integration upgrade failed")
      } finally {
        setLocalLoading(false)
      }
    }

    const handlePing = async () => {
      if (loading || localLoading) return
      setLocalLoading(true)
      try {
        const type = plugin.id === 112 ? "SERVERENDPOINT" : "WORDPRESS"
        const result = await pingIntegration(type)
        setWordpressStatus(prev => ({
          ...prev,
          [plugin.id]: {
            status: result.status || "success",
            message: result.message,
            success: result.success,
          },
        }))
        if (result.success) toast.success(result.message)
        else toast.error(result.message)
      } catch (err) {
        toast.error(err.message || "Heath check failed")
      } finally {
        setLocalLoading(false)
      }
    }

    // Shopify / Wix Logic
    if (plugin.id === 113 || plugin.id === 114) {
      const isShopify = plugin.id === 113
      const savedDomain = integrations?.integrations?.[isShopify ? "SHOPIFY" : "WIX"]?.url
      const [domain, setDomain] = useState(savedDomain ?? "")
      const [isValidDomain, setIsValidDomain] = useState(true)
      const installWindowRef = useRef(null)
      const pollTimerRef = useRef(null)

      const validateDomain = val => {
        if (!val) return false
        if (isShopify) {
          try {
            const normalized = val.startsWith("http") ? new URL(val).hostname : val
            return /^[\w-]+\.myshopify\.com$/i.test(normalized)
          } catch {
            return false
          }
        }
        try {
          new URL(val.startsWith("http") ? val : `https://${val}`)
          return true
        } catch {
          return false
        }
      }

      useEffect(() => {
        setIsValidDomain(validateDomain(domain))
      }, [domain])

      const openInstallUrl = async () => {
        if (!domain || !isValidDomain) {
          toast.error(isShopify ? "Invalid *.myshopify.com domain" : "Invalid URL")
          return
        }
        setLocalLoading(true)
        try {
          if (isShopify) {
            const resp = await axiosInstance.post("/integrations/connect", {
              url: domain,
              type: "SHOPIFY",
            })
            if (resp.data?.redirectUrl) {
              installWindowRef.current = window.open(resp.data.redirectUrl, "_blank")
              toast.info("Transmitting to Shopify installer...")
              pollTimerRef.current = setInterval(() => {
                const w = installWindowRef.current
                if (!w || w.closed) {
                  clearInterval(pollTimerRef.current)
                  fetchIntegrations()
                  pingIntegration("SHOPIFY")
                }
              }, 1200)
            }
          }
        } catch (err) {
          toast.error(err.message || "Installer bootstrap failed")
        } finally {
          setLocalLoading(false)
        }
      }

      const handleInternalPing = async () => {
        setLocalLoading(true)
        try {
          const res = await pingIntegration(isShopify ? "SHOPIFY" : "WIX")
          setWordpressStatus(prev => ({
            ...prev,
            [plugin.id]: { success: res.success, message: res.message },
          }))
          res.success ? toast.success(res.message) : toast.error(res.message)
        } finally {
          setLocalLoading(false)
        }
      }

      return (
        <div className="space-y-8">
          <PluginHeader plugin={plugin} status={wordpressStatus[plugin.id]} />

          <div className="space-y-6">
            <div className="flex items-center gap-2 text-sm font-medium">
              <span className="text-gray-700">Connection Portal</span>
              {wordpressStatus[plugin.id]?.success ? (
                <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-xs font-semibold">
                  <CheckCircle2 size={14} /> Connected
                </span>
              ) : (
                <span className="flex items-center gap-1 text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full text-xs font-semibold">
                  <XCircle size={14} /> Not Connected
                </span>
              )}
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Store / Domain URL</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <input
                    placeholder={isShopify ? "brand.myshopify.com" : "https://your-site.wix.com"}
                    value={domain}
                    onChange={e => setDomain(e.target.value.trim())}
                    disabled={localLoading}
                    className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 border rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                      domain && !isValidDomain
                        ? "border-rose-300 focus:border-rose-300"
                        : "border-gray-200"
                    }`}
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={openInstallUrl}
                  disabled={!domain || !isValidDomain || localLoading}
                  className="flex-1 py-3 bg-linear-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white rounded-lg font-semibold shadow-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <Server className="size-4" /> Install Shopify
                </button>
                <button
                  onClick={handleInternalPing}
                  disabled={!domain || localLoading}
                  className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg font-semibold transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {localLoading ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    <RefreshCw className="size-4" />
                  )}
                  Check Status
                </button>
              </div>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex gap-3">
              <Info className="size-5 text-indigo-600 shrink-0 mt-0.5" />
              <p className="text-sm text-indigo-900 font-medium leading-relaxed">
                {plugin.message}
              </p>
            </div>
          </div>
        </div>
      )
    }

    // Shared UI for WordPress / Server Endpoint
    return (
      <div className="space-y-8">
        <PluginHeader plugin={plugin} status={wordpressStatus[plugin.id]} />

        <div className="space-y-6">
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className="text-gray-700">{plugin.pluginName} Integration</span>
            {wordpressStatus[plugin.id]?.success ? (
              <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-xs font-semibold">
                <CheckCircle2 size={14} /> Connected
              </span>
            ) : (
              <span className="flex items-center gap-1 text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full text-xs font-semibold">
                <XCircle size={14} /> Not Connected
              </span>
            )}
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Configuration</h3>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                <Edit size={16} />
                {isEditing ? "Cancel Edit" : "Edit"}
              </button>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  {plugin.id === 112 ? "Endpoint URL" : "WordPress URL"}
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <input
                    value={url}
                    onChange={handleUrlChange}
                    disabled={!isEditing}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    placeholder="https://your-site.com"
                  />
                </div>
              </div>

              {plugin.id === 112 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Frontend Interface</label>
                  <input
                    value={frontend}
                    onChange={e => setFrontend(e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    placeholder="https://yourpage.com"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  {plugin.id === 112 ? "Authentication Token" : "Username"}
                </label>
                <input
                  type={plugin.id === 112 ? "password" : "text"}
                  value={plugin.id === 112 ? authToken : wpUsername}
                  onChange={e =>
                    plugin.id === 112 ? setAuthToken(e.target.value) : setWpUsername(e.target.value)
                  }
                  disabled={!isEditing}
                  onFocus={e => isEditing && (e.target.value = "")}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              {plugin.id === 111 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Application Password</label>
                  <input
                    type="password"
                    value={wpPassword}
                    onChange={e => setWpPassword(e.target.value)}
                    disabled={!isEditing}
                    onFocus={e => isEditing && (e.target.value = "")}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              )}
            </div>

            <button
              onClick={isEditing ? handleConnect : handlePing}
              className={`w-full py-3 rounded-lg font-semibold text-white shadow-sm transition-all focus:ring-4 focus:ring-opacity-20 ${
                isEditing
                  ? "bg-linear-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600"
                  : "bg-emerald-500 hover:bg-emerald-600 focus:ring-emerald-500"
              }`}
            >
              {localLoading ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : isEditing ? (
                "Save Configuration"
              ) : (
                "Check Status"
              )}
            </button>
          </div>
        </div>

        {plugin.id === 111 && (
          <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Left Content */}
              <div className="flex items-start sm:items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg text-red-600 shrink-0">
                  <PlayCircle size={20} />
                </div>

                <div>
                  <h4 className="font-semibold text-red-900 text-sm">Need Help?</h4>
                  <p className="text-xs text-red-700">Watch our setup guide video.</p>
                </div>
              </div>

              {/* Button */}
              <a
                href="https://youtu.be/WFpfx-xOZK8"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto text-center px-4 py-2 bg-white text-red-600 text-xs font-bold border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                Watch Video
              </a>
            </div>
          </div>
        )}

        <div className="pt-6 border-t border-gray-100">
          <a
            href={plugin.downloadLink}
            download
            className="flex items-center justify-center gap-2 w-full py-3 rounded-lg border border-emerald-500 text-emerald-600 font-medium hover:bg-emerald-50 transition-colors"
          >
            <Download size={18} />
            Download Plugin
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen md:p-6 p-3 md:mt-0 mt-6">
      <Helmet>
        <title>Plugin Center | GenWrite</title>
      </Helmet>

      <div className="mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Plugin Center
          </h1>
          <p className="text-gray-500">
            Discover and integrate powerful tools to supercharge your workflow
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden min-h-[600px]">
          {/* Horizontal Tabs */}
          <div className="flex items-center gap-6 px-6 sm:px-10 border-b border-gray-200 overflow-x-auto scrollbar-hide">
            {extendedPlugins.map(p => {
              const Icon = p.icon
              const isActive = activeTab === p.id.toString()
              return (
                <button
                  key={p.id}
                  onClick={() => handleTabChange(p.id.toString())}
                  className={`flex items-center gap-2 py-4 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                    isActive
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon size={18} className={isActive ? "text-blue-600" : "text-gray-400"} />
                  {p.name}
                </button>
              )
            })}
          </div>

          <div className="p-6 lg:p-10">
            <AnimatePresence mode="wait">
              {extendedPlugins.find(p => p.id.toString() === activeTab) && (
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <PluginTabContent
                    plugin={extendedPlugins.find(p => p.id.toString() === activeTab)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}

const PluginHeader = ({ plugin }) => (
  <div className="flex items-start gap-6">
    <div className="w-20 h-20 shrink-0">
      <img src={plugin.pluginImage} alt={plugin.name} className="w-full h-full object-contain" />
    </div>
    <div className="space-y-1">
      <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{plugin.pluginName}</h2>
      <p className="text-gray-500 text-base leading-relaxed max-w-2xl">{plugin.description}</p>
      <div className="flex flex-wrap items-center gap-4 pt-2 text-sm text-gray-500 font-medium">
        <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
          <Tag size={13} /> <span>v{plugin.version}</span>
        </div>
        <div className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
          <Clock size={13} /> <span>Updated {plugin.updatedDate}</span>
        </div>
      </div>
    </div>
  </div>
)

export default PluginsMain
