import { useState, useEffect, useMemo, useRef } from "react"
import { Tabs, Button, Card, Flex, Typography, message, Space, Spin, Input } from "antd"
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
} from "lucide-react"
import { pluginsData } from "@/data/pluginsData"
import { Helmet } from "react-helmet"
import { useDispatch, useSelector } from "react-redux"
import {
  createIntegrationThunk,
  getIntegrationsThunk,
  pingIntegrationThunk,
} from "@store/slices/otherSlice"
import { fetchCategories, updateExistingIntegration } from "@store/slices/integrationSlice"
import axiosInstance from "@api/index"
import { FaShopify, FaWix, FaYoutube } from "react-icons/fa"

const { Title, Text, Paragraph } = Typography

const PluginsMain = () => {
  const [wordpressStatus, setWordpressStatus] = useState({})
  const [activeTab, setActiveTab] = useState(null)
  const [hasPinged, setHasPinged] = useState(sessionStorage.getItem("hasPinged") === "true")
  const dispatch = useDispatch()
  const plugins = useMemo(
    () => pluginsData(dispatch, setWordpressStatus),
    [dispatch, setWordpressStatus]
  )
  const { data: integrations, loading, error } = useSelector(state => state.wordpress)
  const {
    integration,
    categories,
    ping,
    loading: postsLoading,
  } = useSelector(state => state.integration)

  const extendedPlugins = useMemo(() => {
    return plugins.filter(p => p.isVisible)
  }, [plugins])

  useEffect(() => {
    dispatch(getIntegrationsThunk())
    if (extendedPlugins.length > 0 && !activeTab) {
      setActiveTab(extendedPlugins[0].id.toString())
      checkPlugin(extendedPlugins[0])
    }
  }, [plugins, dispatch, activeTab])

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
              ? "No link found. Add the appropriate link into your profile."
              : err.response?.status === 502
                ? `${plugin.pluginName} connection failed, check integration is active`
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
        dispatch(getIntegrationsThunk())
      }
    }
  }

  const PluginTabContent = ({ plugin }) => {
    const wordpressInt = useMemo(() => integrations?.integrations?.WORDPRESS, [integrations])
    const serverInt = useMemo(() => integrations?.integrations?.SERVERENDPOINT, [integrations])
    const [url, setUrl] = useState(
      plugin.id === 112 ? serverInt?.url || "" : wordpressInt?.url || ""
    )
    const [frontend, setFrontend] = useState(serverInt?.frontend || "")
    const [authToken, setAuthToken] = useState(serverInt?.data ? "*".repeat(10) : "")
    const [isValidUrl, setIsValidUrl] = useState(!!(plugin.id === 112 ? serverInt : wordpressInt))
    const [isValidFrontend, setIsValidFrontend] = useState(!!serverInt)
    const [isEditing, setIsEditing] = useState(plugin.id === 112 ? !serverInt : !wordpressInt)
    const [localLoading, setLocalLoading] = useState(false)
    // New states for WordPress credentials
    const [wpUsername, setWpUsername] = useState("")
    const [wpPassword, setWpPassword] = useState("")
    const [hasCredentials, setHasCredentials] = useState(!!wordpressInt) // If integration exists, assume credentials are set on backend

    useEffect(() => {
      if (plugin.id === 112 && serverInt) {
        setUrl(serverInt.url)
        setFrontend(serverInt.frontend)
        setAuthToken(serverInt?.data ? "*".repeat(10) : "")
        setIsValidUrl(true)
        setIsValidFrontend(true)
        setIsEditing(false)
      } else if (plugin.id === 111 && wordpressInt) {
        setUrl(wordpressInt.url)
        setWpUsername("**********")
        setWpPassword("**********")
        setIsValidUrl(true)
        setIsEditing(false)
        setHasCredentials(true) // Backend has credentials
      } else {
        setUrl("")
        setFrontend("")
        setAuthToken("")
        setWpUsername("")
        setWpPassword("")
        setIsValidUrl(false)
        setIsValidFrontend(false)
        setIsEditing(true)
        setHasCredentials(false)
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
      const value = e.target.value
      setUrl(value)
      try {
        new URL(value)
        setIsValidUrl(true)
      } catch {
        setIsValidUrl(false)
      }
    }

    const handleFrontendChange = e => {
      const value = e.target.value
      setFrontend(value)
      try {
        new URL(value)
        setIsValidFrontend(true)
      } catch {
        setIsValidFrontend(false)
      }
    }

    const handleAuthTokenChange = e => {
      const value = e.target.value
      setAuthToken(value)
    }

    const handleEdit = () => {
      setIsEditing(prev => !prev)
    }

    const handleConnect = async () => {
      if (plugin.id === 112 && (!isValidUrl || !isValidFrontend || !authToken)) return
      if (plugin.id === 111 && !isValidUrl) return
      setLocalLoading(true)
      try {
        let payload
        if (plugin.id === 112) {
          // Validate authToken is not placeholder
          if (authToken === "*".repeat(10)) {
            message.error("Please re-enter your auth token to update the integration")
            setLocalLoading(false)
            return
          }
          payload = { type: "SERVERENDPOINT", url, frontend, credentials: { authToken } }
        } else {
          // Validate credentials are not placeholders
          if (wpUsername === "**********" || wpPassword === "**********") {
            message.error("Please re-enter your credentials to update the integration")
            setLocalLoading(false)
            return
          }

          payload = {
            type: "WORDPRESS",
            url,
            credentials: { user: wpUsername, password: wpPassword },
          }
        }

        const result = await dispatch(createIntegrationThunk(payload)).unwrap()
        await dispatch(getIntegrationsThunk()).unwrap()
        setIsEditing(false)
      } catch (err) {
        const errorMsg = err.message || `Failed to create ${plugin.pluginName} integration`
        message.error(errorMsg)
      } finally {
        setLocalLoading(false)
      }
    }

    const handleUpdate = async () => {
      if (!isValidUrl || !isValidFrontend) return
      setLocalLoading(true)
      try {
        const payload = { type: "SERVERENDPOINT", url, frontend }
        const result = await dispatch(updateExistingIntegration(payload)).unwrap()
        message.success("Server-to-Server integration updated successfully")
        await dispatch(getIntegrationsThunk()).unwrap()
        setIsEditing(false)
      } catch (err) {
        const errorMsg = err.message || "Failed to update Server-to-Server integration"
        message.error(errorMsg)
      } finally {
        setLocalLoading(false)
      }
    }

    const handlePing = async () => {
      if (loading || localLoading) return
      setLocalLoading(true)
      try {
        const type = plugin.id === 112 ? "SERVERENDPOINT" : "WORDPRESS"
        const result = await dispatch(pingIntegrationThunk(type)).unwrap()
        setWordpressStatus(prev => ({
          ...prev,
          [plugin.id]: {
            status: result.status || "success",
            message: result.message,
            success: result.success,
          },
        }))
        if (result.success) {
          message.success(result.message)
        } else {
          message.error(result.message)
        }
      } catch (err) {
        const errorMsg = err.message || `Failed to check ${plugin.pluginName} connection status`
        setWordpressStatus(prev => ({
          ...prev,
          [plugin.id]: { status: "error", message: errorMsg, success: false },
        }))
        message.error(errorMsg)
      } finally {
        setLocalLoading(false)
      }
    }

    const handleFetchCategories = async () => {
      if (postsLoading || !wordpressStatus[plugin.id]?.success) return
      try {
        await dispatch(fetchCategories()).unwrap()
        message.success("Categories fetched successfully")
      } catch (err) {
        message.error("Failed to fetch categories")
      }
    }

    if (plugin.id === 112) {
      return (
        <div className="h-full p-6">
          <Flex vertical gap="large">
            <Flex className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6">
              <img
                src={plugin.pluginImage}
                alt={plugin.pluginName}
                className="h-16 w-16 md:h-20 md:w-20 object-contain rounded-lg shadow-sm"
              />
              <Flex vertical gap="small">
                <Title level={2} className="text-gray-900 m-0 font-bold text-lg md:text-2xl">
                  {plugin.pluginName}
                </Title>
                <Text className="text-gray-600 text-sm md:text-base">{plugin.description}</Text>
                <Flex className="flex flex-wrap gap-4 mt-2">
                  <Flex align="center" gap="small">
                    <Tag size={16} className="text-teal-500" />
                    <Text className="text-teal-600 font-medium text-sm md:text-base">
                      Version {plugin.version}
                    </Text>
                  </Flex>
                  <Flex align="center" gap="small">
                    <Clock size={16} className="text-blue-500" />
                    <Text className="text-blue-600 font-medium text-sm md:text-base">
                      Updated {plugin.updatedDate}
                    </Text>
                  </Flex>
                </Flex>
              </Flex>
            </Flex>

            <Card className="bg-gray-50 border-0 rounded-lg shadow-sm">
              <Flex vertical gap="middle">
                {/* 🔹 Header + Status */}
                <Flex align="center" gap="small">
                  <Text strong>Server-to-Server Integration</Text>

                  {integrations?.integrations?.SERVERENDPOINT &&
                    wordpressStatus[plugin.id]?.success !== undefined &&
                    (wordpressStatus[plugin.id]?.success ? (
                      <Flex align="center" gap="small">
                        <CheckCircle size={16} className="text-green-500" />
                        <Text className="text-green-600">Connected</Text>
                      </Flex>
                    ) : (
                      <Flex align="center" gap="small">
                        <XCircle size={16} className="text-red-500" />
                        <Text className="text-red-600">Not Connected</Text>
                      </Flex>
                    ))}
                </Flex>

                {/* 🔹 Input fields */}
                <Flex vertical gap="middle" className="w-full">
                  {/* Header Row */}
                  <Flex align="center" className="justify-between">
                    <Text strong>Server Integration</Text>
                    <Button
                      type="link"
                      icon={<Edit size={16} />}
                      onClick={handleEdit}
                      className="p-0 text-blue-500 hover:text-blue-600"
                    >
                      {isEditing ? "Cancel" : "Edit"}
                    </Button>
                  </Flex>

                  {/* Input Fields */}
                  <div className="flex flex-col gap-3 w-full">
                    {/* Server URL */}
                    <div className="flex flex-col w-full">
                      <label className="text-sm font-medium text-gray-700 mb-1">Server URL</label>
                      <div className="relative w-full">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          placeholder="e.g., http://localhost:4000/blogs"
                          value={url}
                          onChange={handleUrlChange}
                          disabled={!isEditing || loading || localLoading}
                          className={`w-full rounded-lg border ${
                            url && !isValidUrl ? "border-red-400" : "border-gray-300"
                          } px-10 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:bg-gray-100`}
                        />
                      </div>
                      {url && !isValidUrl && (
                        <span className="text-red-500 text-xs mt-1">
                          Please enter a valid Server URL (e.g., http://localhost:4000/blogs)
                        </span>
                      )}
                    </div>

                    {/* Frontend URL */}
                    <div className="flex flex-col w-full">
                      <label className="text-sm font-medium text-gray-700 mb-1">Frontend URL</label>
                      <div className="relative w-full">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          placeholder="e.g., http://localhost:3000"
                          value={frontend}
                          onChange={handleFrontendChange}
                          disabled={!isEditing || loading || localLoading}
                          className={`w-full rounded-lg border ${
                            frontend && !isValidFrontend ? "border-red-400" : "border-gray-300"
                          } px-10 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:bg-gray-100`}
                        />
                      </div>
                      {frontend && !isValidFrontend && (
                        <span className="text-red-500 text-xs mt-1">
                          Please enter a valid Frontend URL (e.g., http://localhost:3000)
                        </span>
                      )}
                    </div>

                    {/* Auth Token */}
                    <div className="flex flex-col w-full">
                      <label className="text-sm font-medium text-gray-700 mb-1">Auth Token</label>
                      <div className="relative w-full">
                        <input
                          placeholder="Enter your auth token"
                          value={authToken}
                          onFocus={() => setAuthToken("")}
                          onChange={handleAuthTokenChange}
                          disabled={!isEditing || loading || localLoading}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:bg-gray-100"
                        />
                      </div>
                    </div>

                    {/* Action Button */}
                    <Button
                      type="primary"
                      size="large"
                      onClick={isEditing ? handleConnect : handlePing}
                      disabled={
                        isEditing
                          ? loading ||
                            localLoading ||
                            !url ||
                            !frontend ||
                            !authToken ||
                            !isValidUrl ||
                            !isValidFrontend
                          : loading || localLoading
                      }
                      loading={localLoading}
                      className={`rounded-lg border-0 mt-2 ${
                        isEditing
                          ? "bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600"
                          : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                      }`}
                    >
                      {serverInt
                        ? isEditing
                          ? "Update Integration"
                          : "Check Status"
                        : "Connect Integration"}
                    </Button>

                    <a
                      href={plugin.downloadLink}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        type="default"
                        size="large"
                        icon={<Download size={16} />}
                        className="w-full mt-4 border-teal-500 text-teal-600 hover:bg-teal-50 rounded-lg shadow-sm"
                      >
                        Download Plugin Doc
                      </Button>
                    </a>
                  </div>
                </Flex>
              </Flex>
            </Card>

            <Card className="bg-gray-50 border-0 rounded-lg shadow-sm">
              <Paragraph className="text-sm md:text-base text-gray-700 leading-relaxed mb-0">
                {plugin.message}
              </Paragraph>
            </Card>
          </Flex>
        </div>
      )
    }

    if (plugin.id === 113 || plugin.id === 114) {
      const isShopify = plugin.id === 113

      // savedDomain from redux (shopify / wix)
      // const integrations = useSelector(state => state.integration)
      const savedDomain = integrations?.integrations?.[isShopify ? "SHOPIFY" : "WIX"]?.url
      const [domain, setDomain] = useState(savedDomain ?? "")
      const [isValidDomain, setIsValidDomain] = useState(true)
      const [localLoading, setLocalLoading] = useState(false)

      const installWindowRef = useRef(null)
      const pollTimerRef = useRef(null)

      // Validate domain
      const validateDomain = val => {
        if (!val) return false

        if (isShopify) {
          try {
            // If user enters full URL, extract hostname
            const normalized = val.startsWith("http") ? new URL(val).hostname : val
            return /^[\w-]+\.myshopify\.com$/i.test(normalized)
          } catch {
            return false
          }
        }

        // Wix or others
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

      useEffect(() => {
        // cleanup on unmount
        return () => {
          if (pollTimerRef.current) {
            clearInterval(pollTimerRef.current)
          }
          window.removeEventListener("message", handleMessage)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [])

      // Handler for optional postMessage from callback window
      const handleMessage = event => {
        try {
          // optional origin check - if your callback will postMessage, prefer checking event.origin
          // if (event.origin !== window.location.origin) return
          const payload = event.data
          if (!payload) return
          if (typeof payload === "string" && payload.toLowerCase().includes("shopify")) {
            // simple success signal
            message.success("Shopify connected")
            dispatch(getIntegrationsThunk()).catch(() => {})
          }
          // you can add more structured message handling here
        } catch (err) {
          // ignore silently
        }
      }
      window.addEventListener("message", handleMessage)

      // Open installer: call backend to generate Shopify install URL
      const openInstallUrl = async () => {
        if (!domain || !isValidDomain) {
          message.error(isShopify ? "Enter a valid myshopify domain" : "Enter a valid URL")
          return
        }

        setLocalLoading(true)
        try {
          if (isShopify) {
            // correct backend endpoint
            const resp = await axiosInstance.post("/integrations/connect", {
              url: domain,
              type: "SHOPIFY",
            })

            const redirectUrl = resp.data?.redirectUrl
            if (!redirectUrl) {
              throw new Error("No installer URL returned from server")
            }

            installWindowRef.current = window.open(redirectUrl, "_blank", "noopener,noreferrer")
            message.info("Opening Shopify installer…")

            // Poll window close
            pollTimerRef.current = setInterval(() => {
              const w = installWindowRef.current
              if (!w || w.closed) {
                clearInterval(pollTimerRef.current)
                pollTimerRef.current = null
                installWindowRef.current = null

                // Refresh integrations
                dispatch(getIntegrationsThunk())
                  .unwrap()
                  .catch(() => {})

                // Check Shopify status
                dispatch(pingIntegrationThunk("SHOPIFY")).catch(() => {})
              }
            }, 1200)
          }
        } catch (err) {
          console.error("Open install URL failed:", err)
          const msg = err.response?.data?.message || err.message || "Failed to open installer"
          message.error(msg)
        } finally {
          setLocalLoading(false)
        }
      }

      // Ping the saved integration status
      const handlePing = async () => {
        if (loading || localLoading) return
        setLocalLoading(true)
        try {
          const type = isShopify ? "SHOPIFY" : "WIX"
          const result = await dispatch(pingIntegrationThunk(type)).unwrap()
          setWordpressStatus(prev => ({
            ...prev,
            [plugin.id]: {
              status: result.status || "success",
              message: result.message,
              success: result.success,
            },
          }))
          if (result.success) message.success(result.message)
          else message.error(result.message)
        } catch (err) {
          const msg = err.message || `Failed to check ${plugin.name} connection`
          setWordpressStatus(prev => ({
            ...prev,
            [plugin.id]: { status: "error", message: msg, success: false },
          }))
          message.error(msg)
        } finally {
          setLocalLoading(false)
        }
      }

      // UI
      return (
        <div className="h-full p-6">
          <Flex vertical gap="large">
            {/* Header */}
            <Flex className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6">
              <img
                src={plugin.pluginImage}
                alt={plugin.pluginName}
                className="h-16 w-16 md:h-20 md:w-20 object-contain rounded-lg shadow-sm"
              />
              <Flex vertical gap="small">
                <Title level={2} className="text-gray-900 m-0 font-bold text-lg md:text-2xl">
                  {plugin.pluginName}
                </Title>
                <Text className="text-gray-600 text-sm md:text-base">{plugin.description}</Text>
                <Flex className="flex flex-wrap gap-4 mt-2">
                  <Flex align="center" gap="small">
                    <Tag size={16} className="text-teal-500" />
                    <Text className="text-teal-600 font-medium text-sm md:text-base">
                      Version {plugin.version}
                    </Text>
                  </Flex>
                  <Flex align="center" gap="small">
                    <Clock size={16} className="text-blue-500" />
                    <Text className="text-blue-600 font-medium text-sm md:text-base">
                      Updated {plugin.updatedDate}
                    </Text>
                  </Flex>
                </Flex>
              </Flex>
            </Flex>

            {/* Integration Card */}
            <Card className="bg-gray-50 border-0 rounded-lg shadow-sm">
              <Flex vertical gap="middle">
                <Flex align="center" gap="small">
                  <Text strong>
                    {isShopify ? "Shopify Store Integration" : "Wix Site Integration"}
                  </Text>

                  {savedDomain &&
                    wordpressStatus[plugin.id]?.success !== undefined &&
                    (wordpressStatus[plugin.id]?.success ? (
                      <Flex align="center" gap="small">
                        <CheckCircle size={16} className="text-green-500" />
                        <Text className="text-green-600">Connected</Text>
                      </Flex>
                    ) : (
                      <Flex align="center" gap="small">
                        <XCircle size={16} className="text-red-500" />
                        <Text className="text-red-600">Not Connected</Text>
                      </Flex>
                    ))}
                </Flex>

                <Flex vertical gap="middle" className="w-full">
                  <Text strong>Store URL</Text>

                  <div className="flex flex-col gap-3 w-full">
                    <div className="flex flex-col w-full">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        {isShopify ? "Shopify Store Domain" : "Wix Site URL"}
                      </label>
                      <div className="relative w-full">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          placeholder={
                            isShopify
                              ? "your-store.myshopify.com"
                              : "https://your-site.wixsite.com/mysite"
                          }
                          value={domain}
                          onChange={e => setDomain(e.target.value.trim())}
                          disabled={localLoading}
                          className={`w-full rounded-lg border ${
                            domain && !isValidDomain ? "border-red-400" : "border-gray-300"
                          } px-10 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:bg-gray-100`}
                        />
                      </div>
                      {domain && !isValidDomain && (
                        <span className="text-red-500 text-xs mt-1">
                          {isShopify ? "Enter a valid *.myshopify.com domain" : "Enter a valid URL"}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        type="primary"
                        size="large"
                        block
                        onClick={openInstallUrl}
                        disabled={!domain || !isValidDomain || localLoading}
                        className={`flex-1 bg-gradient-to-r ${
                          isShopify
                            ? "from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
                            : "from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
                        } text-white`}
                      >
                        <Flex align="center" justify="center" gap="small">
                          <Server size={18} />
                          Install {plugin.name}
                        </Flex>
                      </Button>

                      <Button
                        type="primary"
                        size="large"
                        block
                        onClick={handlePing}
                        loading={localLoading}
                        disabled={!domain || localLoading}
                        className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                      >
                        Check Status
                      </Button>
                    </div>
                  </div>
                </Flex>
              </Flex>
            </Card>

            <Card className="bg-gray-50 border-0 rounded-lg shadow-sm">
              <Paragraph className="text-sm md:text-base text-gray-700 leading-relaxed mb-0">
                {plugin.message}
              </Paragraph>
            </Card>
          </Flex>
        </div>
      )
    }

    return (
      <div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="h-full"
      >
        <Flex vertical gap="large" className="h-full p-6">
          <Flex className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6">
            <img
              src={plugin.pluginImage}
              alt={plugin.pluginName}
              className="h-16 w-16 md:h-20 md:w-20 object-contain rounded-lg shadow-sm"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            />
            <Flex className="flex flex-col gap-1 md:gap-2">
              <Title level={2} className="text-gray-900 m-0 font-bold text-lg md:text-2xl">
                {plugin.pluginName}
              </Title>
              <Text className="text-gray-600 text-sm md:text-base">{plugin.description}</Text>
              <Flex className="flex flex-wrap gap-4 mt-2">
                <Flex className="flex items-center gap-1 md:gap-2">
                  <Tag size={16} className="text-teal-500" />
                  <Text className="text-teal-600 font-medium text-sm md:text-base">
                    Version {plugin.version}
                  </Text>
                </Flex>
                <Flex className="flex items-center gap-1 md:gap-2">
                  <Clock size={16} className="text-blue-500" />
                  <Text className="text-blue-600 font-medium text-sm md:text-base">
                    Updated {plugin.updatedDate}
                  </Text>
                </Flex>
              </Flex>
            </Flex>
          </Flex>

          {/* Integration Card */}
          <Card className="mt-6 bg-gray-50 border-0 rounded-lg shadow-sm">
            <Flex vertical gap="middle">
              {/* 🔹 Header + Status */}
              <Flex align="center" gap="small">
                <Text strong>AI Blogger Sync Integration</Text>

                {integrations?.integrations?.WORDPRESS &&
                  wordpressStatus[plugin.id]?.success !== undefined &&
                  (wordpressStatus[plugin.id]?.success ? (
                    <Flex align="center" gap="small">
                      <CheckCircle size={16} className="text-green-500" />
                      <Text className="text-green-600">Connected</Text>
                    </Flex>
                  ) : (
                    <Flex align="center" gap="small">
                      <XCircle size={16} className="text-red-500" />
                      <Text className="text-red-600">Not Connected</Text>
                    </Flex>
                  ))}
              </Flex>

              {/* 🔹 Input fields */}
              <Flex vertical gap="middle" className="w-full">
                {/* Header Row */}
                <Flex align="center" className="justify-between">
                  <Text strong>WordPress Configuration</Text>
                  <Button
                    type="link"
                    icon={<Edit size={16} />}
                    onClick={handleEdit}
                    className="p-0 text-blue-500 hover:text-blue-600"
                  >
                    {isEditing ? "Cancel" : "Edit"}
                  </Button>
                </Flex>

                {/* Input Fields */}
                <div className="flex flex-col gap-3 w-full">
                  {/* WordPress URL */}
                  <div className="flex flex-col w-full">
                    <label className="text-sm font-medium text-gray-700 mb-1">WordPress URL</label>
                    <div className="relative w-full">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        placeholder="e.g., https://example.com"
                        value={url}
                        onChange={handleUrlChange}
                        disabled={!isEditing || loading || localLoading}
                        className={`w-full rounded-lg border ${
                          url && !isValidUrl ? "border-red-400" : "border-gray-300"
                        } px-10 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:bg-gray-100`}
                      />
                    </div>
                    {url && !isValidUrl && (
                      <span className="text-red-500 text-xs mt-1">
                        Please enter a valid URL (e.g., https://example.com)
                      </span>
                    )}
                  </div>

                  {/* Username */}
                  <div className="flex flex-col w-full">
                    <label className="text-sm font-medium text-gray-700 mb-1">Username</label>
                    <Input
                      placeholder="WordPress Username"
                      value={wpUsername}
                      onFocus={() => setWpUsername("")}
                      onChange={e => setWpUsername(e.target.value)}
                      disabled={!isEditing || loading || localLoading}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:bg-gray-100"
                    />
                  </div>

                  {/* Application Password */}
                  <div className="flex flex-col w-full">
                    <label className="text-sm font-medium text-gray-700 mb-1">
                      Application Password
                    </label>
                    <div className="relative w-full">
                      <input
                        type="password"
                        placeholder="Application Password"
                        value={wpPassword}
                        onFocus={() => setWpPassword("")}
                        onChange={e => setWpPassword(e.target.value)}
                        disabled={!isEditing || loading || localLoading}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:bg-gray-100"
                      />
                    </div>
                    {isEditing && (
                      <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 flex items-start gap-2">
                        <span className="font-semibold">Note:</span>
                        You must have Editor or Administrator level access.
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <Button
                    type="primary"
                    size="large"
                    onClick={isEditing ? handleConnect : handlePing}
                    disabled={
                      isEditing
                        ? loading ||
                          localLoading ||
                          !url ||
                          !wpUsername ||
                          !wpPassword ||
                          !isValidUrl
                        : loading || localLoading
                    }
                    loading={localLoading}
                    className={`rounded-lg border-0 mt-2 ${
                      isEditing
                        ? "bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600"
                        : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                    }`}
                  >
                    {wordpressInt
                      ? isEditing
                        ? "Update Integration"
                        : "Check Status"
                      : "Connect Integration"}
                  </Button>
                </div>
              </Flex>
            </Flex>
          </Card>

          <a href={plugin.downloadLink} download target="_blank" rel="noopener noreferrer">
            <Button
              type="default"
              size="large"
              icon={<Download size={16} />}
              className="w-full mt-4 border-teal-500 text-teal-600 hover:bg-teal-50 rounded-lg shadow-sm"
            >
              Download Plugin
            </Button>
          </a>

          <div className="mt-6 flex md:justify-between flex-col md:flex-row">
            <div>
              <Text strong className="text-base text-gray-800">
                Struggling to connect?
              </Text>

              <Text className="block text-gray-600 mt-1">
                Watch our step-by-step guide to integrate the WordPress plugin professionally.
              </Text>
            </div>

            <a
              href="https://youtu.be/WFpfx-xOZK8"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-3"
            >
              <Button type="primary" className="bg-red-600 hover:bg-red-700 border-red-600">
                Watch Video Guide
              </Button>
            </a>
          </div>

          <Card className="bg-gray-50 border-0 rounded-lg shadow-sm">
            <Paragraph className="text-sm md:text-base text-gray-700 leading-relaxed mb-0">
              {plugin.message}
            </Paragraph>
          </Card>
        </Flex>
      </div>
    )
  }

  const renderTabBar = (props, DefaultTabBar) => (
    <DefaultTabBar {...props} className="custom-tab-bar rounded-t-lg" />
  )

  const tabItems = extendedPlugins.map(plugin => ({
    key: plugin.id.toString(),
    label: (
      <Flex align="center" gap="small" className="font-sans font-medium text-base">
        {<plugin.icon size={20} />}
        {plugin.name}
      </Flex>
    ),
    children: <PluginTabContent plugin={plugin} />,
  }))

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Plugins | GenWrite</title>
      </Helmet>

      <div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="my-6 ml-6 sm:ml-10"
      >
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Plugin Center
        </h1>
        <p className="text-gray-500 text-base mt-2 max-w-md">
          Discover and integrate powerful tools to supercharge your workflow
        </p>
      </div>

      <div className="flex-1 px-2 md:px-6 pb-8">
        <div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="h-full bg-white rounded-xl shadow-sm border border-gray-200 border-t-0 overflow-hidden"
        >
          <Tabs
            activeKey={activeTab}
            onChange={handleTabChange}
            type="card"
            size="large"
            className="h-full"
            renderTabBar={renderTabBar}
            items={tabItems}
          />
        </div>
      </div>
    </div>
  )
}

export default PluginsMain
