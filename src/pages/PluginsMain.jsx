import { useState, useEffect, useMemo } from "react"
import { Tabs, Button, Card, Flex, Typography, message, Input, Space, Spin } from "antd"
import { Server, Download, Tag, Clock, CheckCircle, Edit } from "lucide-react"
import { pluginsData } from "@/data/pluginsData"
import { motion } from "framer-motion"
import { Helmet } from "react-helmet"
import { useDispatch, useSelector } from "react-redux"
import {
  createIntegrationThunk,
  getIntegrationsThunk,
  pingIntegrationThunk,
} from "@store/slices/otherSlice"

const { Title, Text, Paragraph } = Typography

const PluginsMain = () => {
  const [wordpressStatus, setWordpressStatus] = useState({})
  const [activeTab, setActiveTab] = useState(null)
  const plugins = useMemo(() => pluginsData(setWordpressStatus), [])
  const dispatch = useDispatch()
  const { data: integrations, loading, error } = useSelector((state) => state.wordpress)

  useEffect(() => {
    dispatch(getIntegrationsThunk())
    if (plugins.length > 0 && !activeTab) {
      setActiveTab(plugins[0].id.toString())
      checkPlugin(plugins[0])
    }
  }, [plugins, dispatch])

  const checkPlugin = async (plugin) => {
    if (plugin.id === 112) return
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
              ? "No WordPress link found. Add WordPress link into your profile."
              : err.response?.status === 502
              ? "WordPress connection failed, check plugin is installed & active"
              : "WordPress Connection Error",
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

  const handleConnectClick = async (plugin) => {
    if (plugin.id === 112) return

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
      if (result.success) {
        message.success(result.message)
      } else {
        message.error(result.message)
      }
    } catch (err) {
      console.error(`Error connecting plugin ${plugin.pluginName}:`, err)
      setWordpressStatus((prev) => ({
        ...prev,
        [plugin.id]: {
          status: err.response?.status || "error",
          message:
            err.response?.status === 400
              ? "No WordPress link found. Add WordPress link into your profile."
              : err.response?.status === 502
              ? "WordPress connection failed, check plugin is installed & active"
              : "WordPress Connection Error",
          success: false,
        },
      }))
      message.error("WordPress Connection Error")
    }
  }

  const PluginTabContent = ({ plugin }) => {
    const wordpressInt = useMemo(() => {
      return integrations?.integrations?.WORDPRESS
    }, [integrations])
    const [url, setUrl] = useState(wordpressInt?.url || "")
    const [isValid, setIsValid] = useState(!!wordpressInt)
    const [isEditing, setIsEditing] = useState(!wordpressInt)
    const [localLoading, setLocalLoading] = useState(false)

    useEffect(() => {
      if (wordpressInt) {
        setUrl(wordpressInt.url)
        setIsValid(true)
        setIsEditing(false)
      } else {
        setUrl("")
        setIsValid(false)
        setIsEditing(true)
      }
    }, [wordpressInt])

    const handleUrlChange = (e) => {
      const value = e.target.value
      setUrl(value)
      try {
        new URL(value)
        setIsValid(true)
      } catch {
        setIsValid(false)
      }
    }

    const handleEdit = () => {
      setIsEditing(true)
    }

    const handleConnect = async () => {
      if (!isValid || loading || localLoading) return
      setLocalLoading(true)
      try {
        const result = await dispatch(createIntegrationThunk({ type: "WORDPRESS", url })).unwrap()
        message.success("WordPress integration updated successfully")
        await dispatch(getIntegrationsThunk()).unwrap()
        setIsEditing(false)
      } catch (err) {
        const errorMsg = err.message || "Failed to update WordPress integration"
        message.error(errorMsg)
      } finally {
        setLocalLoading(false)
      }
    }

    const handlePing = async () => {
      if (loading || localLoading) return
      setLocalLoading(true)
      try {
        const result = await dispatch(pingIntegrationThunk("WORDPRESS")).unwrap()
        message.success(result.message)
      } catch (err) {
        const errorMsg = err.message || "Failed to check connection status"
        message.error(errorMsg)
      } finally {
        setLocalLoading(false)
      }
    }

    if (plugin.id === 112) {
      return (
        <div className="h-full m-2 flex flex-col items-center justify-center bg-gradient-to-br from-teal-50 to-blue-100 rounded-2xl">
          <Flex vertical align="center" justify="center" className="h-full py-12">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <Server size={48} className="text-teal-500 mb-4" />
            </motion.div>
            <Title level={3} className="text-gray-800 mb-2 text-center font-semibold">
              {plugin.pluginName}
            </Title>
            <Paragraph className="text-gray-600 mb-6 text-center max-w-md text-base">
              {plugin.message}
            </Paragraph>
            <Button
              type="primary"
              size="large"
              className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 border-0 rounded-lg"
              disabled
            >
              Coming Soon
            </Button>
          </Flex>
        </div>
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
          {/* Plugin Header */}
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

          {/* WordPress Integration Controls */}
          <Card className="mt-6 bg-gray-50 border-0 rounded-lg shadow-sm">
            <Flex vertical gap="middle">
              <Flex align="center" gap="small">
                <Text strong>WordPress Integration</Text>
                {wordpressInt && !isEditing && (
                  <Flex align="center" gap="small">
                    <CheckCircle size={16} className="text-green-500" />
                    <Text className="text-green-600">Connected</Text>
                  </Flex>
                )}
                {!wordpressInt && !isEditing && (
                  <Text className="text-gray-600">No integration found</Text>
                )}
              </Flex>
              <Space.Compact style={{ width: "100%" }}>
                <Input
                  placeholder="Enter your WordPress URL (e.g., https://example.com)"
                  value={url}
                  onChange={handleUrlChange}
                  status={url && !isValid ? "error" : ""}
                  disabled={!isEditing || loading || localLoading}
                  className="rounded-l-lg border-r-0"
                  prefix={<Server size={16} className="text-gray-400" />}
                />
                {isEditing ? (
                  <Button
                    type="primary"
                    size="large"
                    onClick={handleConnect}
                    disabled={!isValid || loading || localLoading}
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
                  <Spin tip="Processing integration..." />
                </Flex>
              )}
              {url && !isValid && (
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
              {/* {error && (
                <Text type="danger" className="text-sm">
                  {error.message || "An error occurred while processing the integration"}
                </Text>
              )} */}
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

          <div className="my-6 border-gray-200" />

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
    <div className="min-h-screen flex flex-col bg-gray-100">
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
