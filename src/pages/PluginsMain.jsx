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
import clsx from "clsx"

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
    const sanityInt = useMemo(() => integrations?.integrations?.SANITY, [integrations])

    // States for inputs
    const [url, setUrl] = useState(
      plugin.id === 112
        ? serverInt?.url || ""
        : plugin.id === 115
          ? sanityInt?.url || ""
          : wordpressInt?.url || ""
    )
    const [frontend, setFrontend] = useState(
      plugin.id === 115 ? sanityInt?.frontend || "" : serverInt?.frontend || ""
    )
    const [authToken, setAuthToken] = useState(
      (plugin.id === 112 && serverInt?.data) || (plugin.id === 115 && sanityInt?.credentials?.token)
        ? "*".repeat(10)
        : ""
    )
    const [projectId, setProjectId] = useState(sanityInt?.credentials?.projectId || sanityInt?.projectId || "")
    const [dataset, setDataset] = useState(sanityInt?.credentials?.dataset || "production")
    const [apiVersion, setApiVersion] = useState(sanityInt?.credentials?.apiVersion || "2024-01-01")
    const [documentType, setDocumentType] = useState(sanityInt?.credentials?.documentType || "post")
    const [blogRoute, setBlogRoute] = useState(sanityInt?.credentials?.blogRoute || "/blog/:slug")

    const [isValidUrl, setIsValidUrl] = useState(
      !!(plugin.id === 112 ? serverInt : plugin.id === 115 ? sanityInt : wordpressInt)
    )
    const [isValidFrontend, setIsValidFrontend] = useState(
      plugin.id === 115 ? !!sanityInt : !!serverInt
    )
    const [isEditing, setIsEditing] = useState(false)
    const [localLoading, setLocalLoading] = useState(false)

    // WordPress credentials
    const [wpUsername, setWpUsername] = useState("")
    const [wpPassword, setWpPassword] = useState("")
    const [hasCredentials, setHasCredentials] = useState(!!wordpressInt)
    const [hasPinged, setHasPinged] = useState(!!sessionStorage.getItem("hasPinged"))

    const handleToggleEdit = () => {
      if (isEditing) {
        // Reset to original values on cancel
        if (plugin.id === 112 && serverInt) {
          setUrl(serverInt.url)
          setFrontend(serverInt.frontend)
          setAuthToken("*".repeat(10))
          setIsValidUrl(true)
          setIsValidFrontend(true)
        } else if (plugin.id === 115 && sanityInt) {
          const commonUrl = sanityInt.frontend || sanityInt.url || ""
          setUrl(commonUrl)
          setFrontend(commonUrl)
          setProjectId(sanityInt.credentials?.projectId || sanityInt.projectId || "")
          setDataset(sanityInt.credentials?.dataset || "production")
          setApiVersion(sanityInt.credentials?.apiVersion || "2024-01-01")
          setDocumentType(sanityInt.credentials?.documentType || "post")
          setBlogRoute(sanityInt.credentials?.blogRoute || "/blog/:slug")
          setAuthToken("*".repeat(10))
          setIsValidUrl(true)
          setIsValidFrontend(true)
        } else if (plugin.id === 111 && wordpressInt) {
          setUrl(wordpressInt.url)
          setWpUsername("**********")
          setWpPassword("**********")
          setIsValidUrl(true)
          setHasCredentials(true)
        }
      }
      setIsEditing(!isEditing)
    }

    useEffect(() => {
      if (plugin.id === 112 && serverInt) {
        setUrl(serverInt.url)
        setFrontend(serverInt.frontend)
        setAuthToken("*".repeat(10))
        setIsValidUrl(true)
        setIsValidFrontend(true)
        setIsEditing(false)
      } else if (plugin.id === 115 && sanityInt) {
        const commonUrl = sanityInt.frontend || sanityInt.url || ""
        setUrl(commonUrl)
        setFrontend(commonUrl)
        setProjectId(sanityInt.credentials?.projectId || sanityInt.projectId || "")
        setDataset(sanityInt.credentials?.dataset || "production")
        setApiVersion(sanityInt.credentials?.apiVersion || "2024-01-01")
        setDocumentType(sanityInt.credentials?.documentType || "post")
        setBlogRoute(sanityInt.credentials?.blogRoute || "/blog/:slug")
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
    }, [wordpressInt, serverInt, sanityInt, plugin.id])

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
      if (plugin.id === 112 && (!isValidUrl || !isValidFrontend || !authToken)) {
        toast.error("Please provide valid URL, Frontend, and Auth Token")
        return
      }
      if (plugin.id === 115 && (!projectId || !authToken)) {
        toast.error("Please provide Sanity Project ID and Auth Token")
        return
      }
      if (plugin.id === 111 && !isValidUrl) {
        toast.error("Please provide a valid WordPress URL")
        return
      }
      setLocalLoading(true)
      try {
        let payload
        if (plugin.id === 112) {
          const isTokenMasked = authToken === "*".repeat(10)
          payload = { 
            type: "SERVERENDPOINT", 
            url, 
            frontend, 
            credentials: { 
              ...(isTokenMasked ? {} : { authToken }) 
            } 
          }
        } else if (plugin.id === 115) {
          const isTokenMasked = authToken === "*".repeat(10)
          payload = { 
            type: "SANITY", 
            url: frontend, 
            frontend, 
            credentials: { 
              ...(isTokenMasked ? {} : { token: authToken }), 
              projectId, 
              dataset, 
              apiVersion, 
              documentType, 
              blogRoute 
            } 
          }
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
        const type =
          plugin.id === 112 ? "SERVERENDPOINT" : plugin.id === 115 ? "SANITY" : "WORDPRESS"
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
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">
                {plugin.id === 112 || plugin.id === 115 ? "Connection Credentials" : "Plugin Settings"}
              </h3>
              <button
                onClick={handleToggleEdit}
                className={clsx(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all border",
                  isEditing 
                    ? "text-rose-600 border-rose-200 bg-rose-50 hover:bg-rose-100" 
                    : "text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100"
                )}
              >
                {isEditing ? (
                  <>
                    <XCircle size={15} /> Cancel Changes
                  </>
                ) : (
                  <>
                    <Edit size={15} /> Edit Settings
                  </>
                )}
              </button>
            </div>

            <div className="space-y-5">
              {plugin.id !== 115 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    {plugin.id === 112
                      ? "Endpoint URL"
                      : "WordPress URL"}
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
              )}

              {(plugin.id === 112 || plugin.id === 115) && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    {plugin.id === 115 ? "Sanity Frontend / URL" : "Frontend URL"}
                  </label>
                  <input
                    value={frontend}
                    onChange={e => {
                      const val = e.target.value
                      setFrontend(val)
                      if (plugin.id === 115) {
                        setUrl(val)
                        setIsValidUrl(!!val)
                      }
                    }}
                    disabled={!isEditing}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    placeholder={plugin.id === 115 ? "https://your-sanity-site.com" : "https://yourpage.com"}
                  />
                </div>
              )}

              {plugin.id === 115 && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Sanity Project ID</label>
                    <input
                      type="text"
                      value={projectId}
                      onChange={e => setProjectId(e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Sanity Data Set</label>
                      <input
                        type="text"
                        value={dataset}
                        onChange={e => setDataset(e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                        placeholder="production"
                      />
                    </div>
                  </div>



                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Blog Route</label>
                    <select
                      value={blogRoute}
                      onChange={e => setBlogRoute(e.target.value)}
                      disabled={!isEditing}
                      className="select select-bordered w-full bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-60 disabled:bg-gray-50 disabled:cursor-not-allowed font-normal"
                    >
                      <option value="/blog/:slug">/blog/:slug</option>
                      <option value="/blogs/:slug">/blogs/:slug</option>
                      <option value="/article/:slug">/article/:slug</option>
                      <option value="/articles/:slug">/articles/:slug</option>
                      <option value="/news/:slug">/news/:slug</option>
                      <option value="/:slug">/:slug</option>
                      <option value="/:yyyy/:mm/:dd/:slug">/:yyyy/:mm/:dd/:slug</option>
                    </select>
                    {frontend && blogRoute && (
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <Globe size={12} /> Live URL preview: <span className="text-blue-600 font-medium">{frontend.replace(/\/$/, '')}{blogRoute.replace(':slug', 'my-post').replace(':yyyy', '2026').replace(':mm', '03').replace(':dd', '07')}</span>
                      </p>
                    )}
                  </div>
                </>
              )}

              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <label className="text-sm font-medium text-gray-700">
                    {plugin.id === 112 || plugin.id === 115 ? "Authentication Token" : "Username"}
                  </label>
                  {(plugin.id === 115 || plugin.id === 111) && (
                    <span className="text-[10px] sm:text-xs text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1 shadow-sm">
                      <AlertCircle size={12} className="text-amber-600" /> MUST HAVE EDITOR LEVEL ACCESS
                    </span>
                  )}
                </div>
                <input
                  type={plugin.id === 112 || plugin.id === 115 ? "password" : "text"}
                  value={plugin.id === 112 || plugin.id === 115 ? authToken : wpUsername}
                  onChange={e =>
                    plugin.id === 112 || plugin.id === 115
                      ? setAuthToken(e.target.value)
                      : setWpUsername(e.target.value)
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
              className={clsx(
                "w-full py-4 rounded-xl font-bold text-white transition-all transform active:scale-[0.98]",
                isEditing
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-emerald-600 hover:bg-emerald-700"
              )}
            >
              <div className="flex items-center justify-center gap-2">
                {localLoading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : isEditing ? (
                  <>
                    <ShieldCheck size={18} /> Save Integration Configuration
                  </>
                ) : (
                  <>
                    <RefreshCw size={18} className={clsx(localLoading && "animate-spin")} />
                    Check Connection Status
                  </>
                )}
              </div>
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
                  <p className="text-xs text-red-700">Watch our WordPress setup guide.</p>
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

        {plugin.id === 115 && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Left Content */}
              <div className="flex items-start sm:items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600 shrink-0">
                  <PlayCircle size={20} />
                </div>

                <div>
                  <h4 className="font-semibold text-blue-900 text-sm">Sanity Setup Guide</h4>
                  <p className="text-xs text-blue-700">Learn how to connect your Sanity studio.</p>
                </div>
              </div>

              {/* Button */}
              <a
                href="https://youtube.com/sanity-test"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto text-center px-4 py-2 bg-white text-blue-600 text-xs font-bold border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Watch Guide
              </a>
            </div>
          </div>
        )}

        {!(plugin.id === 112 || plugin.id === 115) && (
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
        )}
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
      <img src={plugin.pluginImage} alt={plugin.name} className="w-full h-full object-contain rounded-md" />
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
