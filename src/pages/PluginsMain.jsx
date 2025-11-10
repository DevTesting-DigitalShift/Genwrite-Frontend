import { useState, useEffect, useMemo } from "react"
import { Tabs, Button, Card, Flex, Typography, message, Space, Spin } from "antd"
import { Server, Download, Tag, Clock, CheckCircle, Edit, Globe, XCircle } from "lucide-react"
import { pluginsData } from "@/data/pluginsData"
import { Helmet } from "react-helmet"
import { useDispatch, useSelector } from "react-redux"
import {
  createIntegrationThunk,
  getIntegrationsThunk,
  pingIntegrationThunk,
} from "@store/slices/otherSlice"
import { fetchCategories, updateExistingIntegration } from "@store/slices/integrationSlice"

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
    return [
      ...plugins,
      {
        id: 113,
        pluginName: "Shopify Integration",
        name: "Shopify",
        pluginImage: "/Images/shopify.png", // put your temp image inside public/images
        description: "Sync your GenWrite content directly to your Shopify store.",
        version: "1.0.0",
        updatedDate: "Nov 2025",
        downloadLink: "#", // you can later attach doc or zip
        icon: Server, // or use any lucide icon you want
        message: "Easily publish product content and blog posts directly to Shopify.",
        onCheck: async () => ({
          status: 200,
          message: "Temporary mock connection successful",
          success: true,
        }),
      },
      {
        id: 114,
        pluginName: "Wix Studio Integration",
        name: "Wix Studio",
        pluginImage: "/Images/wix.png",
        description: "Connect your Wix Studio projects with GenWrite for seamless publishing.",
        version: "1.0.0",
        updatedDate: "Nov 2025",
        downloadLink: "#",
        icon: Server,
        message: "Push AI-generated blogs and marketing copy directly to your Wix site.",
        onCheck: async () => ({
          status: 200,
          message: "Temporary mock connection successful",
          success: true,
        }),
      },
    ]
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
        [plugin.id]: {
          status: result.status,
          message: result.message,
          success: result.success,
        },
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
        setIsValidUrl(true)
        setIsEditing(false)
      } else {
        setUrl("")
        setFrontend("")
        setAuthToken("")
        setIsValidUrl(false)
        setIsValidFrontend(false)
        setIsEditing(true)
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
        const payload =
          plugin.id === 112
            ? { type: "SERVERENDPOINT", url, frontend, credentials: { authToken } }
            : { type: "WORDPRESS", url }
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
          [plugin.id]: {
            status: "error",
            message: errorMsg,
            success: false,
          },
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

      const palette = isShopify
        ? {
            grad: "from-emerald-500 to-green-400",
            hover: "hover:from-emerald-600 hover:to-green-500",
            badge: "bg-emerald-600",
            card: "bg-gradient-to-br from-emerald-50 to-green-100/60",
            text: "text-emerald-700",
            link: "text-emerald-600 hover:text-emerald-700",
          }
        : {
            grad: "from-neutral-900 to-gray-800",
            hover: "hover:from-black hover:to-gray-700",
            badge: "bg-neutral-900 text-white",
            card: "bg-gradient-to-br from-gray-50 to-gray-200/60",
            text: "text-neutral-800",
            link: "text-gray-900 hover:text-black hover:underline",
          }

      return (
        <div className="flex min-h-full flex-col items-center justify-center p-6 md:p-10">
          {/* ── Header ── */}
          <div className="relative mb-8 flex flex-col items-center text-center">
            <div className="relative">
              <img
                src={plugin.pluginImage}
                alt={plugin.pluginName}
                className="h-24 w-24 md:h-28 md:w-28 rounded-xl object-contain shadow-lg transition-transform duration-300 hover:scale-105"
              />
            </div>

            <Title
              level={2}
              className={`mt-4 bg-gradient-to-r ${
                isShopify ? "from-emerald-600 to-green-500" : "from-indigo-600 to-purple-500"
              } bg-clip-text text-2xl font-extrabold text-transparent md:text-3xl`}
            >
              {plugin.pluginName}
            </Title>

            <Text className="mt-2 max-w-xl text-base text-gray-600 md:text-lg">
              {plugin.description}
            </Text>

            {/* Version + Updated */}
            <div className="mt-5 flex flex-wrap justify-center gap-6">
              <Flex align="center" gap="small">
                <Tag size={16} className="text-teal-500" />
                <Text className="font-medium text-teal-600">v{plugin.version}</Text>
              </Flex>
              <Flex align="center" gap="small">
                <Clock size={16} className="text-blue-500" />
                <Text className="font-medium text-blue-600">{plugin.updatedDate}</Text>
              </Flex>
            </div>
          </div>

          {/* ── Action Card ── */}
          <Card
            className={`w-full max-w-2xl border-0 ${palette.card} p-8 shadow backdrop-blur-sm transition-all duration-300`}
          >
            <Paragraph className="mb-8 text-center text-base leading-relaxed text-gray-700 md:text-lg">
              {plugin.message}
            </Paragraph>

            <Space direction="vertical" size="middle" className="w-full">
              {/* Connect Button */}
              <Button
                size="large"
                block
                onClick={() => message.success(`${plugin.pluginName} connection simulated!`)}
                className={`h-12 rounded-xl border-0 bg-gradient-to-r ${palette.grad} ${palette.hover} font-semibold text-white shadow-md transition-all duration-300`}
              >
                <Flex align="center" justify="center" gap="small">
                  <Server size={18} />
                  Connect {plugin.name}
                </Flex>
              </Button>

              {/* Download Guide */}
              <a
                href={plugin.downloadLink}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button
                  type="text"
                  block
                  icon={<Download size={16} />}
                  className={`h-10 rounded-lg border border-transparent ${
                    palette.link
                  } font-medium transition-all duration-200 hover:border-${
                    isShopify ? "emerald" : "indigo"
                  }-300 hover:bg-${isShopify ? "emerald" : "indigo"}-50`}
                >
                  Download Integration Guide
                </Button>
              </a>
            </Space>
          </Card>

          {/* ── Footer Note ── */}
          <Paragraph className="mt-8 max-w-xl text-center text-xs text-gray-500">
            {isShopify
              ? "Publish blogs or product descriptions directly from GenWrite to your Shopify store."
              : "Instantly push AI-generated content to your Wix Studio site with a single click."}
          </Paragraph>
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

          <Card className="mt-6 bg-gray-50 border-0 rounded-lg shadow-sm">
            <Flex vertical gap="middle">
              {/* Header */}
              <Flex align="center" justify="between">
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
              </Flex>

              {/* Input + Button */}
              <div className="flex flex-col w-full">
                {/* Label Row */}
                <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
                  <span>Enter your WordPress URL</span>
                  <Button
                    type="link"
                    icon={<Edit size={16} />}
                    onClick={handleEdit}
                    className="p-0 text-blue-500 hover:text-blue-600"
                  >
                    {isEditing ? "Cancel" : "Edit"}
                  </Button>
                </label>

                {/* Input + Primary Action */}
                <div className="flex flex-col sm:flex-row w-full gap-2">
                  <div className="relative flex-1">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      placeholder="e.g., https://example.com"
                      value={url}
                      onChange={handleUrlChange}
                      status={url && !isValidUrl ? "error" : ""}
                      disabled={!isEditing || loading || localLoading}
                      className="w-full rounded-lg border border-gray-300 px-10 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:bg-gray-100"
                    />
                  </div>

                  {isEditing ? (
                    <Button
                      type="primary"
                      size="large"
                      onClick={handleConnect}
                      disabled={!isValidUrl || loading || localLoading}
                      loading={localLoading}
                      className="rounded-lg bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 transition-all duration-200"
                    >
                      {wordpressInt ? "Update" : "Connect"}
                    </Button>
                  ) : (
                    <Button
                      type="primary"
                      size="large"
                      onClick={handlePing}
                      disabled={loading || localLoading}
                      loading={localLoading}
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 transition-all duration-200"
                    >
                      Check Status
                    </Button>
                  )}
                </div>

                {/* Error message */}
                {url && !isValidUrl && (
                  <span className="text-red-500 text-xs mt-1">
                    Please enter a valid URL (e.g., https://example.com)
                  </span>
                )}
              </div>

              {/* Status / Error / Loader */}
              {localLoading && (
                <Flex justify="center" className="mt-4">
                  <Spin />
                </Flex>
              )}
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
        <p className="text-gray-500 text-sm mt-2 max-w-md">
          Discover and integrate powerful tools to supercharge your workflow
        </p>
      </div>

      <div className="flex-1 px-2 md:px-6 pb-8">
        <div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="h-full bg-white rounded-xl shadow-lg overflow-hidden"
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
