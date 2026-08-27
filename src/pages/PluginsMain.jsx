import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import {
  Server,
  Download,
  Tag,
  Clock,
  Edit,
  Globe,
  XCircle,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  Info,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { pluginsData } from "@/data/pluginsData"
import { Helmet } from "react-helmet"
import useIntegrationStore from "@store/useIntegrationStore"
import axiosInstance from "@api/index"
import { toast } from "sonner"
import clsx from "clsx"

const PluginsMain = () => {
  const [wordpressStatus, setWordpressStatus] = useState({})
  const [activeTab, setActiveTab] = useState(null)
  const { integrations, loading, fetchIntegrations, createIntegration, pingIntegration } =
    useIntegrationStore()

  const plugins = useMemo(() => pluginsData(pingIntegration), [pingIntegration])

  const extendedPlugins = useMemo(() => {
    return plugins.filter(p => p.isVisible)
  }, [plugins])

  const checkPlugin = useCallback(
    async plugin => {
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
    },
    [wordpressStatus]
  )

  // Intentionally omits `checkPlugin` — this effect's job is a one-time "pick the
  // first tab once plugins load" (guarded by `!activeTab`), not to re-run whenever
  // a plugin's check status changes.
  // biome-ignore lint/correctness/useExhaustiveDependencies: guarded by !activeTab, see comment above
  useEffect(() => {
    fetchIntegrations()
    if (extendedPlugins.length > 0 && !activeTab) {
      setActiveTab(extendedPlugins[0].id.toString())
      checkPlugin(extendedPlugins[0])
    }
  }, [fetchIntegrations, activeTab, extendedPlugins])

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
    const wordpressInt = useMemo(() => integrations?.integrations?.WORDPRESS, [])
    const serverInt = useMemo(() => integrations?.integrations?.SERVERENDPOINT, [])
    const sanityInt = useMemo(() => integrations?.integrations?.SANITY, [])

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
      (plugin.id === 112 && serverInt?.data) || (plugin.id === 115 && sanityInt?.data)
        ? "*".repeat(10)
        : ""
    )
    const [projectId, setProjectId] = useState(sanityInt?.settings?.projectId || "")
    const [dataset, setDataset] = useState(sanityInt?.settings?.dataset || "production")
    const [apiVersion, setApiVersion] = useState(sanityInt?.settings?.apiVersion || "2024-01-01")
    const [documentType, setDocumentType] = useState(sanityInt?.settings?.documentType || "post")
    const [blogRoute, setBlogRoute] = useState(sanityInt?.settings?.blogRoute || "/blog/:slug")

    const [isValidUrl, setIsValidUrl] = useState(
      !!(plugin.id === 112 ? serverInt : plugin.id === 115 ? sanityInt : wordpressInt)
    )
    const [isValidFrontend, setIsValidFrontend] = useState(
      plugin.id === 115 ? !!sanityInt : !!serverInt
    )
    const [isEditing, setIsEditing] = useState(false)
    const [localLoading, setLocalLoading] = useState(false)
    const [showAuthToken, setShowAuthToken] = useState(false)

    // WordPress credentials — username isn't a secret (WP's own REST API exposes author
    // names publicly), so it's stored in plain `settings` and shown for real, not masked.
    const [wpUsername, setWpUsername] = useState(wordpressInt?.settings?.user || "")
    const [wpPassword, setWpPassword] = useState("")
    const [_hasCredentials, setHasCredentials] = useState(!!wordpressInt)

    const [hasPinged, setHasPinged] = useState(!!sessionStorage.getItem("hasPinged"))

    // Shopify / Wix domain state — hooks must be called unconditionally even though
    // this data is only meaningful for plugin.id 113/114 (rules-of-hooks: this
    // component instance is re-rendered with different plugin.id values across tab
    // switches, so a conditional hook here previously crashed on switch).
    const isShopify = plugin.id === 113
    const wixInt = integrations?.integrations?.WIX
    const savedDomain = integrations?.integrations?.[isShopify ? "SHOPIFY" : "WIX"]?.url
    const [domain, setDomain] = useState(savedDomain ?? "")
    const [isValidDomain, setIsValidDomain] = useState(true)
    const installWindowRef = useRef(null)
    const pollTimerRef = useRef(null)

    // Wix-only: whether GenWrite should push its own SEO meta tags / JSON-LD structured
    // data, or leave it to Wix's built-in AI-generated SEO for blog posts (default).
    const [useCustomSeo, setUseCustomSeo] = useState(!!wixInt?.settings?.useCustomSeo)
    const [seoSaving, setSeoSaving] = useState(false)

    useEffect(() => {
      setUseCustomSeo(!!wixInt?.settings?.useCustomSeo)
    }, [wixInt?.settings?.useCustomSeo])

    const validateDomain = useCallback(
      val => {
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
      },
      [isShopify]
    )

    useEffect(() => {
      setIsValidDomain(validateDomain(domain))
    }, [domain, validateDomain])

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
          setProjectId(sanityInt.settings?.projectId || "")
          setDataset(sanityInt.settings?.dataset || "production")
          setApiVersion(sanityInt.settings?.apiVersion || "2024-01-01")
          setDocumentType(sanityInt.settings?.documentType || "post")
          setBlogRoute(sanityInt.settings?.blogRoute || "/blog/:slug")
          setAuthToken("*".repeat(10))
          setIsValidUrl(true)
          setIsValidFrontend(true)
        } else if (plugin.id === 111 && wordpressInt) {
          setUrl(wordpressInt.url)
          setWpUsername(wordpressInt.settings?.user || "")
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
        setProjectId(sanityInt.settings?.projectId || "")
        setDataset(sanityInt.settings?.dataset || "production")
        setApiVersion(sanityInt.settings?.apiVersion || "2024-01-01")
        setDocumentType(sanityInt.settings?.documentType || "post")
        setBlogRoute(sanityInt.settings?.blogRoute || "/blog/:slug")
        setAuthToken("*".repeat(10))
        setIsValidUrl(true)
        setIsValidFrontend(true)
        setIsEditing(false)
      } else if (plugin.id === 111 && wordpressInt) {
        setUrl(wordpressInt.url)
        setWpUsername(wordpressInt.settings?.user || "")
        setWpPassword("**********")
        setIsValidUrl(true)
        setIsEditing(false)
        setHasCredentials(true)
      }
    }, [wordpressInt, serverInt, sanityInt, plugin.id])

    // biome-ignore lint/correctness/useExhaustiveDependencies: loading/pingIntegration kept intentionally to avoid a stale closure
    const handlePing = useCallback(async () => {
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
    }, [loading, localLoading, pingIntegration, plugin.id])

    useEffect(() => {
      if (integrations && !hasPinged && !sessionStorage.getItem("hasPinged")) {
        handlePing()
        setHasPinged(true)
        sessionStorage.setItem("hasPinged", "true")
      }
    }, [hasPinged, handlePing])

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
            credentials: { ...(isTokenMasked ? {} : { authToken }) },
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
              blogRoute,
            },
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

    // Shopify / Wix Logic
    if (plugin.id === 113 || plugin.id === 114) {
      const openInstallUrl = async () => {
        if (!domain || !isValidDomain) {
          toast.error(isShopify ? "Invalid *.myshopify.com domain" : "Invalid URL")
          return
        }
        setLocalLoading(true)
        try {
          const resp = await axiosInstance.post("/integrations/connect", {
            url: domain,
            type: isShopify ? "SHOPIFY" : "WIX",
          })
          if (resp.data?.redirectUrl) {
            installWindowRef.current = window.open(resp.data.redirectUrl, "_blank")
            toast.info(`Transmitting to ${isShopify ? "Shopify" : "Wix"} installer...`)
            pollTimerRef.current = setInterval(() => {
              const w = installWindowRef.current
              if (!w || w.closed) {
                clearInterval(pollTimerRef.current)
                fetchIntegrations()
                pingIntegration(isShopify ? "SHOPIFY" : "WIX")
              }
            }, 1200)
          }
        } catch (err) {
          toast.error(err.message || "Installer bootstrap failed")
        } finally {
          setLocalLoading(false)
        }
      }

      const handleSeoToggle = async checked => {
        setUseCustomSeo(checked)
        setSeoSaving(true)
        try {
          await createIntegration({
            type: "WIX",
            url: domain,
            credentials: { useCustomSeo: checked },
          })
          await fetchIntegrations()
          toast.success(
            checked
              ? "GenWrite will now push custom SEO tags & structured data to Wix."
              : "Wix's built-in AI-generated SEO/structured data will be used."
          )
        } catch (err) {
          setUseCustomSeo(!checked)
          toast.error(err.message || "Failed to update SEO preference")
        } finally {
          setSeoSaving(false)
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
              <span className="">Connection Portal</span>
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
                <label htmlFor={`plugin-${plugin.id}-domain`} className="text-sm font-medium ">
                  Store / Domain URL
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <input
                    id={`plugin-${plugin.id}-domain`}
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
                  type="button"
                  onClick={openInstallUrl}
                  disabled={!domain || !isValidDomain || localLoading}
                  className="flex-1 py-3 bg-linear-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white rounded-lg font-semibold shadow-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <Server className="size-4" /> Install {isShopify ? "Shopify" : "Wix"}
                </button>
                <button
                  type="button"
                  onClick={handleInternalPing}
                  disabled={!domain || localLoading}
                  className="flex-1 py-3 bg-white border border-gray-200  hover:bg-gray-50 rounded-lg font-semibold transition-all disabled:opacity-60 flex items-center justify-center gap-2"
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

            {!isShopify && wixInt && (
              <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg border border-gray-100">
                <div>
                  <span className="block text-sm font-medium text-gray-900">
                    Push custom SEO tags from GenWrite
                  </span>
                  <span className="text-xs text-gray-500 max-w-md block">
                    Off (default): Wix auto-generates SEO meta tags and structured data
                    (schema.org) for every post. On: GenWrite pushes its own SEO tags and
                    JSON-LD instead.
                  </span>
                </div>
                <input
                  type="checkbox"
                  className="toggle toggle-primary toggle-sm"
                  checked={useCustomSeo}
                  disabled={seoSaving}
                  onChange={e => handleSeoToggle(e.target.checked)}
                />
              </div>
            )}

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
            <span className="">{plugin.pluginName} Integration</span>
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
            <div className="flex items-center justify-between gap-4 mb-6">
              <h3 className="text-lg font-bold text-gray-900">
                {plugin.id === 112 || plugin.id === 115
                  ? "Connection Credentials"
                  : "Plugin Settings"}
              </h3>
              <button
                type="button"
                onClick={handleToggleEdit}
                className={clsx(
                  "flex items-center justify-center transition-all border rounded-lg",
                  isEditing
                    ? "text-rose-600 border-rose-200 bg-rose-50 hover:bg-rose-100"
                    : "text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100",
                  "w-10 h-10 sm:w-auto sm:px-4 sm:py-2"
                )}
                title={isEditing ? "Cancel Changes" : "Edit Settings"}
              >
                {isEditing ? (
                  <>
                    <XCircle size={18} />{" "}
                    <span className="hidden sm:inline-block ml-2 text-sm font-bold">
                      Cancel Changes
                    </span>
                  </>
                ) : (
                  <>
                    <Edit size={18} />{" "}
                    <span className="hidden sm:inline-block ml-2 text-sm font-bold">
                      Edit Settings
                    </span>
                  </>
                )}
              </button>
            </div>

            <div className="space-y-5">
              {plugin.id !== 115 && (
                <div className="space-y-2">
                  <label htmlFor={`plugin-${plugin.id}-url`} className="text-sm font-medium ">
                    {plugin.id === 112 ? "Endpoint URL" : "WordPress URL"}
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <input
                      id={`plugin-${plugin.id}-url`}
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
                  <label htmlFor={`plugin-${plugin.id}-frontend`} className="text-sm font-medium ">
                    {plugin.id === 115 ? "Sanity Frontend / URL" : "Frontend URL"}
                  </label>
                  <input
                    id={`plugin-${plugin.id}-frontend`}
                    value={frontend}
                    onChange={e => {
                      const val = e.target.value
                      setFrontend(val)
                      try {
                        new URL(val)
                        setIsValidFrontend(true)
                      } catch {
                        setIsValidFrontend(false)
                      }
                      if (plugin.id === 115) {
                        setUrl(val)
                        setIsValidUrl(!!val)
                      }
                    }}
                    disabled={!isEditing}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    placeholder={
                      plugin.id === 115 ? "https://your-sanity-site.com" : "https://yourpage.com"
                    }
                  />
                </div>
              )}

              {plugin.id === 115 && (
                <>
                  <div className="space-y-2">
                    <label
                      htmlFor={`plugin-${plugin.id}-project-id`}
                      className="text-sm font-medium "
                    >
                      Sanity Project ID
                    </label>
                    <input
                      id={`plugin-${plugin.id}-project-id`}
                      type="text"
                      value={projectId}
                      onChange={e => setProjectId(e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div className="gap-4">
                    <div className="space-y-2">
                      <label
                        htmlFor={`plugin-${plugin.id}-dataset`}
                        className="text-sm font-medium "
                      >
                        Sanity Data Set
                      </label>
                      <input
                        id={`plugin-${plugin.id}-dataset`}
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
                    <label
                      htmlFor={`plugin-${plugin.id}-blog-route`}
                      className="text-sm font-medium "
                    >
                      Blog Route
                    </label>
                    <select
                      id={`plugin-${plugin.id}-blog-route`}
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
                        <Globe size={12} /> Live URL preview:{" "}
                        <span className="text-blue-600 font-medium">
                          {frontend.replace(/\/$/, "")}
                          {blogRoute
                            .replace(":slug", "my-post")
                            .replace(":yyyy", "2026")
                            .replace(":mm", "03")
                            .replace(":dd", "07")}
                        </span>
                      </p>
                    )}
                  </div>
                </>
              )}

              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <label
                    htmlFor={`plugin-${plugin.id}-credential`}
                    className="text-sm font-medium "
                  >
                    {plugin.id === 112 || plugin.id === 115 ? "Authentication Token" : "Username"}
                  </label>
                  {(plugin.id === 115 || plugin.id === 111) && (
                    <span className="text-[10px] sm:text-xs text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1 shadow-sm">
                      <AlertCircle size={12} className="text-amber-600" /> MUST HAVE EDITOR LEVEL
                      ACCESS
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    id={`plugin-${plugin.id}-credential`}
                    type={
                      plugin.id === 112 || plugin.id === 115
                        ? showAuthToken
                          ? "text"
                          : "password"
                        : "text"
                    }
                    value={plugin.id === 112 || plugin.id === 115 ? authToken : wpUsername}
                    onChange={e =>
                      plugin.id === 112 || plugin.id === 115
                        ? setAuthToken(e.target.value)
                        : setWpUsername(e.target.value)
                    }
                    disabled={!isEditing}
                    onFocus={e => {
                      if (isEditing) e.target.value = ""
                    }}
                    className={clsx(
                      "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed",
                      (plugin.id === 112 || plugin.id === 115) && "pr-11"
                    )}
                  />
                  {(plugin.id === 112 || plugin.id === 115) && (
                    <button
                      type="button"
                      onClick={() => setShowAuthToken(prev => !prev)}
                      tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      title={showAuthToken ? "Hide token" : "Show token"}
                    >
                      {showAuthToken ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  )}
                </div>
              </div>

              {plugin.id === 111 && (
                <div className="space-y-2">
                  <label
                    htmlFor={`plugin-${plugin.id}-app-password`}
                    className="text-sm font-medium "
                  >
                    Application Password
                  </label>
                  <input
                    id={`plugin-${plugin.id}-app-password`}
                    type="password"
                    value={wpPassword}
                    onChange={e => setWpPassword(e.target.value)}
                    disabled={!isEditing}
                    onFocus={e => {
                      if (isEditing) e.target.value = ""
                    }}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={isEditing ? handleConnect : handlePing}
              className={clsx(
                "w-full py-3.5 sm:py-4 rounded-xl font-bold text-white transition-all transform active:scale-[0.98] text-sm sm:text-base px-2",
                isEditing ? "bg-blue-600 hover:bg-blue-700" : "bg-emerald-600 hover:bg-emerald-700"
              )}
            >
              <div className="flex items-center justify-center gap-2">
                {localLoading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : isEditing ? (
                  <>
                    <ShieldCheck size={18} className="hidden sm:block" />
                    <span className="text-center">Save Integration Configuration</span>
                  </>
                ) : (
                  <>
                    <RefreshCw
                      size={18}
                      className={clsx(localLoading && "animate-spin", "hidden sm:block")}
                    />
                    <span className="text-center">Check Connection Status</span>
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
          <div className="mt-6 space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600 shrink-0">
                    <PlayCircle size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-900 text-sm">Sanity Setup Guide</h4>
                    <p className="text-xs text-blue-700">
                      Learn how to connect your Sanity studio.
                    </p>
                  </div>
                </div>
                <a
                  href="https://youtu.be/Lrs3Vg7PEs0"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto text-center px-4 py-2 bg-white text-blue-600 text-xs font-bold border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  Watch Guide
                </a>
              </div>
            </div>

            <div className="pt-2">
              <a
                href="/FRONTEND_GUIDE.pdf"
                download="FRONTEND_GUIDE.pdf"
                className="flex items-center justify-center gap-2 w-full py-4 rounded-xl border-2 border-dashed border-emerald-500 text-emerald-600 font-bold hover:bg-emerald-50 transition-all active:scale-[0.98]"
              >
                <Download size={18} />
                Download Frontend Schema Guide (PDF)
              </a>
            </div>
          </div>
        )}

        {plugin.id === 112 && (
          <div className="mt-6 space-y-4">
            <div className="pt-2">
              <a
                href="/plugins/ServerEndpointDoc.pdf"
                download="ServerEndpointDoc.pdf"
                className="flex items-center justify-center gap-2 w-full py-4 rounded-xl border-2 border-dashed border-emerald-500 text-emerald-600 font-bold hover:bg-emerald-50 transition-all active:scale-[0.98]"
              >
                <Download size={18} />
                Download API Schema Guide (PDF)
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

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden min-h-150">
          {/* Horizontal Tabs */}
          <div className="flex items-center gap-6 px-6 sm:px-10 border-b border-gray-200 overflow-x-auto scrollbar-hide">
            {extendedPlugins.map(p => {
              const Icon = p.icon
              const isActive = activeTab === p.id.toString()
              return (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => handleTabChange(p.id.toString())}
                  className={`flex items-center gap-2 py-4 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                    isActive
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover: hover:border-gray-300"
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
  <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 sm:gap-6">
    <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0">
      <img
        src={plugin.pluginImage}
        alt={plugin.name}
        className="w-full h-full object-contain rounded-md"
      />
    </div>
    <div className="space-y-1">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
        {plugin.pluginName}
      </h2>
      <p className="text-xs sm:text-base text-gray-500 leading-relaxed max-w-2xl">
        {plugin.description}
      </p>
      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-4 pt-2 text-[10px] sm:text-sm text-gray-500 font-medium">
        <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
          <Tag size={12} className="sm:size-4" /> <span>v{plugin.version}</span>
        </div>
        <div className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
          <Clock size={12} className="sm:size-4" /> <span>Updated {plugin.updatedDate}</span>
        </div>
      </div>
    </div>
  </div>
)

export default PluginsMain
