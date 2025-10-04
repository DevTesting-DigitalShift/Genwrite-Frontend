import { useState, useEffect, useMemo } from "react"
import { Tabs, Button, Card, Flex, Typography, message, Space, Spin } from "antd"
import { Server, Download, Tag, Clock, CheckCircle, Edit, Globe, XCircle } from "lucide-react"
import { pluginsData } from "@/data/pluginsData"
import { motion } from "framer-motion"
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
  const { data: integrations, loading, error } = useSelector((state) => state.wordpress)
  const {
    integration,
    categories,
    ping,
    loading: postsLoading,
  } = useSelector((state) => state.integration)

  useEffect(() => {
    dispatch(getIntegrationsThunk())
    if (plugins.length > 0 && !activeTab) {
      setActiveTab(plugins[0].id.toString())
      checkPlugin(plugins[0])
    }
  }, [plugins, dispatch, activeTab])

  const checkPlugin = async (plugin) => {
    if (wordpressStatus[plugin.id]?.success) return

    try {
      const result = await plugin.onCheck()
      setWordpressStatus((prev) => ({
        ...prev,
        [plugin.id]: {
          status: result.status,
          message: result.message,
          success: result.success,
        },
      }))
    } catch (err) {
      console.error(`Error checking plugin ${plugin.pluginName}:`, err)
      setWordpressStatus((prev) => ({
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

  const handleTabChange = (key) => {
    setActiveTab(key)
    const plugin = plugins.find((p) => p.id.toString() === key)
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
    const [authToken, setAuthToken] = useState(serverInt?.credentials?.authToken || "")
    const [isValidUrl, setIsValidUrl] = useState(!!(plugin.id === 112 ? serverInt : wordpressInt))
    const [isValidFrontend, setIsValidFrontend] = useState(!!serverInt)
    const [isEditing, setIsEditing] = useState(plugin.id === 112 ? !serverInt : !wordpressInt)
    const [localLoading, setLocalLoading] = useState(false)

    useEffect(() => {
      if (plugin.id === 112 && serverInt) {
        setUrl(serverInt.url)
        setFrontend(serverInt.frontend)
        setAuthToken(serverInt.credentials?.authToken || "")
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

    const handleUrlChange = (e) => {
      const value = e.target.value
      setUrl(value)
      try {
        new URL(value)
        setIsValidUrl(true)
      } catch {
        setIsValidUrl(false)
      }
    }

    const handleFrontendChange = (e) => {
      const value = e.target.value
      setFrontend(value)
      try {
        new URL(value)
        setIsValidFrontend(true)
      } catch {
        setIsValidFrontend(false)
      }
    }

    const handleAuthTokenChange = (e) => {
      const value = e.target.value
      setAuthToken(value)
    }

    const handleEdit = () => {
      setIsEditing(true)
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
        setWordpressStatus((prev) => ({
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
        setWordpressStatus((prev) => ({
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="h-full p-6"
        >
          <Flex vertical gap="large">
            <Flex className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6">
              <motion.img
                src={plugin.pluginImage}
                alt={plugin.pluginName}
                className="h-16 w-16 md:h-20 md:w-20 object-contain rounded-lg shadow-sm"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
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
                <Flex vertical gap="small">
                  {/* Server URL */}
                  <div className="relative w-full">
                    <input
                      placeholder="Enter server URL (e.g., http://localhost:4000/blogs)"
                      value={url}
                      onChange={handleUrlChange}
                      disabled={!isEditing || loading || localLoading}
                      className="w-full rounded-lg border border-gray-300 px-10 py-[9px] text-sm"
                    />
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  </div>

                  {/* Frontend URL */}
                  <div className="relative w-full">
                    <input
                      placeholder="Enter frontend URL (e.g., http://localhost:4000)"
                      value={frontend}
                      onChange={handleFrontendChange}
                      disabled={!isEditing || loading || localLoading}
                      className="w-full rounded-lg border border-gray-300 px-10 py-[9px] text-sm"
                    />
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  </div>

                  {/* Auth Token */}
                  <div className="relative w-full">
                    <input
                      placeholder="Enter auth token"
                      value={authToken}
                      onChange={handleAuthTokenChange}
                      disabled={!isEditing || loading || localLoading}
                      className="w-full rounded-lg border border-gray-300 px-10 py-[9px] text-sm"
                    />
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  </div>

                  {/* 🔹 Single Connect / Update Button */}
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
                    className={`rounded-lg border-0 ${
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
                </Flex>

                {/* 🔹 Connected Info */}
                {serverInt && !isEditing && (
                  <Flex align="center" gap="small" className="mt-2">
                    <Text className="text-gray-600 text-sm">
                      Connected Server: <strong>{serverInt.url}</strong> | Frontend:{" "}
                      <strong>{serverInt.frontend}</strong> | Auth Token:{" "}
                      <strong>{serverInt.credentials?.authToken}</strong>
                    </Text>
                    <Button
                      type="link"
                      icon={<Edit size={16} />}
                      onClick={handleEdit}
                      className="p-0"
                    >
                      Edit
                    </Button>
                  </Flex>
                )}

                {/* 🔹 Empty State Message */}
                {!serverInt && isEditing && (
                  <Text className="text-gray-600 text-sm">
                    Please enter your server URL, frontend URL, and auth token to connect the
                    integration.
                  </Text>
                )}

                {localLoading && (
                  <Flex justify="center" className="mt-4">
                    <Spin />
                  </Flex>
                )}
              </Flex>
            </Card>

            <Card className="bg-gray-50 border-0 rounded-lg shadow-sm">
              <Paragraph className="text-sm md:text-base text-gray-700 leading-relaxed mb-0">
                {plugin.message}
              </Paragraph>
            </Card>
          </Flex>
        </motion.div>
      )
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="h-full"
      >
        <Flex vertical gap="large" className="h-full p-6">
          <Flex className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6">
            <motion.img
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
              <Flex align="center" gap="small">
                <Text strong>Server-to-Server Integration</Text>

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

              <Space.Compact style={{ width: "100%" }}>
                <div className="relative w-full">
                  <input
                    placeholder="Enter your WordPress URL (e.g., https://example.com)"
                    value={url}
                    onChange={handleUrlChange}
                    status={url && !isValidUrl ? "error" : ""}
                    disabled={!isEditing || loading || localLoading}
                    className="w-full rounded-lg rounded-r-none border border-gray-300 px-10 py-[9px] text-sm"
                  />
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                </div>
                {isEditing ? (
                  <Button
                    type="primary"
                    size="large"
                    onClick={handleConnect}
                    disabled={!isValidUrl || loading || localLoading}
                    loading={localLoading}
                    className="rounded-r-lg bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 border-0"
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
                    className="rounded-r-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 border-0"
                  >
                    Check Status
                  </Button>
                )}
              </Space.Compact>
              {localLoading && (
                <Flex justify="center" className="mt-4">
                  <Spin />
                </Flex>
              )}
              {url && !isValidUrl && (
                <Text type="danger" className="text-sm">
                  Please enter a valid URL (e.g., https://example.com)
                </Text>
              )}
              {wordpressInt && !isEditing && (
                <Flex align="center" gap="small">
                  <Text className="text-gray-600">
                    Connected URL: <strong>{wordpressInt.url}</strong>
                  </Text>
                  <Button
                    type="link"
                    icon={<Edit size={16} />}
                    onClick={handleEdit}
                    className="p-0"
                  >
                    Edit
                  </Button>
                </Flex>
              )}
              {!wordpressInt && isEditing && (
                <Text className="text-gray-600 text-sm">
                  Please enter your WordPress site URL to connect the integration.
                </Text>
              )}
            </Flex>
          </Card>
          <a href={plugin.downloadLink} download>
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
      </motion.div>
    )
  }

  const renderTabBar = (props, DefaultTabBar) => (
    <DefaultTabBar {...props} className="custom-tab-bar rounded-t-lg" />
  )

  const tabItems = plugins.map((plugin) => ({
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

      <motion.div
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
      </motion.div>

      <div className="flex-1 px-2 md:px-6 pb-8">
        <motion.div
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
        </motion.div>
      </div>
    </div>
  )
}

export default PluginsMain
