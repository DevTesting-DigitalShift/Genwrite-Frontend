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
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { pluginsData } from "@/data/pluginsData"
import { Helmet } from "react-helmet"
import useAuthStore from "@store/useAuthStore"
import useIntegrationStore from "@store/useIntegrationStore"
import axiosInstance from "@api/index"
import { FaShopify, FaWix, FaYoutube, FaWordpress } from "react-icons/fa"
import toast from "@utils/toast"

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
        <div className="p-8 sm:p-12 space-y-10">
          <PluginHeader plugin={plugin} status={wordpressStatus[plugin.id]} />

          <div className="bg-slate-50/50 rounded-[32px] p-8 border border-slate-100 flex flex-col gap-6">
            <h4 className="text-xl font-black text-slate-800">Connection Portal</h4>
            <div className="space-y-4">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                Store / Domain URL
              </label>
              <div className="relative">
                <Globe className="absolute left-5 top-1/2 -translate-y-1/2 size-5 text-slate-300" />
                <input
                  placeholder={isShopify ? "brand.myshopify.com" : "https://your-site.wix.com"}
                  value={domain}
                  onChange={e => setDomain(e.target.value.trim())}
                  disabled={localLoading}
                  className={`input input-bordered w-full h-16 pl-14 rounded-2xl font-bold bg-white focus:ring-4 focus:ring-blue-100 transition-all ${domain && !isValidDomain ? "border-rose-300" : "border-slate-100"}`}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <button
                  onClick={openInstallUrl}
                  disabled={!domain || !isValidDomain || localLoading}
                  className="btn btn-primary h-16 flex-1 rounded-2xl bg-slate-900 border-none text-white font-black text-lg gap-3 normal-case"
                >
                  <Server className="size-5" /> Install Protocol
                </button>
                <button
                  onClick={handleInternalPing}
                  disabled={!domain || localLoading}
                  className="btn btn-ghost h-16 flex-1 rounded-2xl bg-white border border-slate-200 font-bold gap-3 normal-case hover:bg-slate-100"
                >
                  {localLoading ? (
                    <span className="loading loading-spinner"></span>
                  ) : (
                    <RefreshCw className="size-5" />
                  )}{" "}
                  Sync Status
                </button>
              </div>
            </div>
          </div>

          <p className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100 text-sm font-bold text-indigo-700 leading-relaxed italic">
            <Info className="size-4 inline mr-2 mb-1" /> {plugin.message}
          </p>
        </div>
      )
    }

    // Shared UI for WordPress / Server Endpoint
    return (
      <div className="p-8 sm:p-12 space-y-10">
        <PluginHeader plugin={plugin} status={wordpressStatus[plugin.id]} />

        <div className="bg-slate-50/50 rounded-[32px] p-8 border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-xl font-black text-slate-800">API Gateway Settings</h4>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`btn btn-sm rounded-xl gap-2 font-bold normal-case ${isEditing ? "btn-ghost text-rose-500 hover:bg-rose-50" : "btn-ghost text-blue-600 hover:bg-blue-50"}`}
            >
              {isEditing ? <XCircle className="size-4" /> : <Edit className="size-4" />}
              {isEditing ? "Terminate Edit" : "Configure Parameters"}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                Access Protocol (URL)
              </label>
              <div className="relative">
                <Globe className="absolute left-5 top-1/2 -translate-y-1/2 size-5 text-slate-300" />
                <input
                  value={url}
                  onChange={handleUrlChange}
                  disabled={!isEditing}
                  className="input input-bordered w-full h-16 pl-14 rounded-2xl font-bold bg-white border-none focus:ring-4 focus:ring-blue-100 transition-all"
                  placeholder="https://api.yourdomain.com/rest"
                />
              </div>
            </div>

            {plugin.id === 112 && (
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                  Frontend Interface
                </label>
                <input
                  value={frontend}
                  onChange={e => setFrontend(e.target.value)}
                  disabled={!isEditing}
                  className="input input-bordered w-full h-16 px-6 rounded-2xl font-bold bg-white border-none focus:ring-4 focus:ring-blue-100"
                  placeholder="https://yourpage.com"
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                  {plugin.id === 112 ? "Authentication Bearer" : "Admin Username"}
                </label>
                <input
                  type={plugin.id === 112 ? "password" : "text"}
                  value={plugin.id === 112 ? authToken : wpUsername}
                  onChange={e =>
                    plugin.id === 112 ? setAuthToken(e.target.value) : setWpUsername(e.target.value)
                  }
                  disabled={!isEditing}
                  onFocus={e => isEditing && (e.target.value = "")}
                  className="input input-bordered w-full h-16 px-6 rounded-2xl font-bold bg-white border-none focus:ring-4 focus:ring-blue-100"
                />
              </div>
              {plugin.id === 111 && (
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                    App Password
                  </label>
                  <input
                    type="password"
                    value={wpPassword}
                    onChange={e => setWpPassword(e.target.value)}
                    disabled={!isEditing}
                    onFocus={e => isEditing && (e.target.value = "")}
                    className="input input-bordered w-full h-16 px-6 rounded-2xl font-bold bg-white border-none focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={isEditing ? handleConnect : handlePing}
                className={`btn h-16 flex-1 rounded-2xl font-black text-lg border-none normal-case shadow-xl transition-all ${isEditing ? "btn-primary bg-slate-900 text-white hover:bg-slate-800" : "btn-success bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-100"}`}
              >
                {localLoading ? (
                  <span className="loading loading-spinner"></span>
                ) : isEditing ? (
                  "Initialize Connection"
                ) : (
                  "Verify Integrity"
                )}
              </button>
              <a
                href={plugin.downloadLink}
                download
                className="btn btn-ghost h-16 px-6 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50"
              >
                <Download className="size-6 text-slate-600" />
              </a>
            </div>
          </div>
        </div>

        {plugin.id === 111 && (
          <div className="bg-linear-to-r from-red-600 to-indigo-700 rounded-[32px] p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-indigo-100">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                <PlayCircle className="size-8" />
              </div>
              <div>
                <h5 className="text-2xl font-black">Troubleshooting Guide</h5>
                <p className="text-red-100 font-bold opacity-80">
                  Watch our specialized workflow for WordPress deployments.
                </p>
              </div>
            </div>
            <a
              href="https://youtu.be/WFpfx-xOZK8"
              target="_blank"
              className="btn bg-white border-none text-red-600 font-black px-10 h-16 rounded-2xl hover:bg-red-50 text-lg normal-case"
            >
              Access Intel
            </a>
          </div>
        )}

        <p className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-sm font-bold text-slate-500 italic">
          <Info className="size-4 inline mr-2 text-blue-500" /> {plugin.message}
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/30 p-6 lg:p-10 mb-32 flex flex-col">
      <Helmet>
        <title>Plugin Center | GenWrite</title>
      </Helmet>

      <div className="mb-12 ml-4">
        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
          Plugin{" "}
          <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-indigo-600">
            Integrations
          </span>
        </h1>
        <p className="text-slate-500 font-bold text-lg mt-2">
          Connect your digital infrastructure for automated publication loops.
        </p>
      </div>

      <div className="flex-1">
        <div className="bg-white rounded-[40px] shadow-2xl shadow-indigo-100/30 border border-slate-100 overflow-hidden flex flex-col md:flex-row h-full min-h-[800px]">
          {/* Sidebar Tabs */}
          <div className="w-full md:w-80 bg-slate-50/50 border-r border-slate-100 p-6 space-y-2">
            <h6 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 ml-2">
              Active Modules
            </h6>
            {extendedPlugins.map(p => (
              <button
                key={p.id}
                onClick={() => handleTabChange(p.id.toString())}
                className={`w-full flex items-center gap-4 p-5 rounded-2xl font-black transition-all ${activeTab === p.id.toString() ? "bg-white shadow-xl shadow-indigo-100/50 text-blue-600" : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"}`}
              >
                {<p.icon className="size-5" /> || <LayoutGrid className="size-5" />}
                <span className="text-sm">{p.name}</span>
                {activeTab === p.id.toString() && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                )}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              {extendedPlugins.find(p => p.id.toString() === activeTab) && (
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
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

const PluginHeader = ({ plugin, status }) => (
  <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
    <div className="w-32 h-32 bg-white rounded-3xl shadow-xl shadow-slate-100 flex items-center justify-center p-6 border border-slate-50 shrink-0">
      <img src={plugin.pluginImage} alt={plugin.name} className="w-full h-full object-contain" />
    </div>
    <div className="flex-1 text-center md:text-left">
      <div className="flex flex-col md:flex-row md:items-center gap-2 mb-4">
        <h2 className="text-3xl font-black text-slate-900 leading-none">{plugin.pluginName}</h2>
        <div className="flex gap-2 justify-center">
          {status?.success !== undefined ? (
            <div
              className={`badge h-7 px-4 rounded-xl border-none font-bold text-[10px] uppercase tracking-widest ${status.success ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}
            >
              {status.success ? "Active" : "Offline"}
            </div>
          ) : (
            <div className="badge h-7 px-4 rounded-xl border-none bg-slate-100 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
              Awaiting Stats
            </div>
          )}
        </div>
      </div>
      <p className="text-slate-500 font-bold text-lg mb-6 max-w-2xl">{plugin.description}</p>
      <div className="flex flex-wrap gap-4 justify-center md:justify-start">
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl text-xs font-black text-slate-600">
          <Settings className="size-4" /> v{plugin.version}
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-xl text-xs font-black text-blue-600">
          <Clock className="size-4" /> Updated {plugin.updatedDate}
        </div>
        {status?.success && (
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-xl text-xs font-black text-emerald-600 animate-pulse">
            <CheckCircle2 className="size-4" /> Security Verified
          </div>
        )}
      </div>
    </div>
  </div>
)

export default PluginsMain
