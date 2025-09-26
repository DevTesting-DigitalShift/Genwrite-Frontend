import { useState, useEffect, useMemo } from "react"
import { Tabs, Button, Card, Flex, Typography, message, Input, Space } from "antd"
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

  // Fetch integrations on component mount
  useEffect(() => {
    dispatch(getIntegrationsThunk())
    if (plugins.length > 0 && !activeTab) {
      setActiveTab(plugins[0].id.toString())
      checkPlugin(plugins[0])
    }
  }, [plugins, dispatch])

  const checkPlugin = async (plugin) => {
    if (plugin.id === 112) return // No check for coming soon
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
    if (plugin.id === 112) return // No action for coming soon

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

    useEffect(() => {
      if (wordpressInt) {
        setUrl(wordpressInt.url)
        setIsValid(true)
        setIsEditing(false)
      } else {
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
      if (!isValid || loading) return
      try {
        await dispatch(createIntegrationThunk({ type: "WORDPRESS", url })).unwrap()
        message.success("WordPress integration updated successfully")
        dispatch(getIntegrationsThunk())
        setIsEditing(false)
      } catch (error) {
        message.error(error || "Failed to update WordPress integration")
      }
    }

    const handlePing = async () => {
      if (loading) return
      try {
        const result = await dispatch(pingIntegrationThunk("WORDPRESS")).unwrap()
        message.success(result.message)
      } catch (error) {
        message.error(error || "Failed to check connection status")
      }
    }

    if (plugin.id === 112) {
      return (
        <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-teal-50 to-blue-100 rounded-2xl">
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
          <Flex align="center" gap="large">
            <motion.img
              src={plugin.pluginImage}
              alt={plugin.pluginName}
              className="h-16 w-16 object-contain rounded-lg shadow-sm"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            />
            <Flex vertical gap="small">
              <Title level={2} className="text-gray-900 m-0 font-bold">
                {plugin.pluginName}
              </Title>
              <Text className="text-lg text-gray-600">{plugin.description}</Text>
              <Flex gap="middle" className="mt-2">
                <Flex align="center" gap="small">
                  <Tag size={16} className="text-teal-500" />
                  <Text className="text-base text-teal-600 font-medium">
                    Version {plugin.version}
                  </Text>
                </Flex>
                <Flex align="center" gap="small">
                  <Clock size={16} className="text-blue-500" />
                  <Text className="text-base text-blue-600 font-medium">
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
                </Flex>
                <Space.Compact style={{ width: "100%" }}>
                  <Input
                    placeholder="Enter your WordPress URL (e.g., https://example.com)"
                    value={url}
                    onChange={handleUrlChange}
                    status={url && !isValid ? "error" : ""}
                    disabled={!isEditing || loading}
                    className="rounded-l-lg border-r-0"
                    prefix={<Server size={16} className="text-gray-400" />}
                  />
                  {isEditing ? (
                    <Button
                      type="primary"
                      size="large"
                      onClick={handleConnect}
                      disabled={!isValid || loading}
                      className="rounded-r-lg bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 border-0"
                    >
                      Connect
                    </Button>
                  ) : (
                    <Button
                      type="primary"
                      size="large"
                      onClick={handlePing}
                      disabled={loading}
                      className="rounded-r-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 border-0"
                    >
                      Check Status
                    </Button>
                  )}
                </Space.Compact>
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
                {error && (
                  <Text type="danger" className="text-sm">
                    {error}
                  </Text>
                )}
              </Flex>
            </Card>

          {/* Non-WordPress Connect Button */}
          {/* {!isWordpress && (
            <Button
              type="primary"
              size="large"
              onClick={() => handleConnectClick(plugin)}
              className={`w-full mt-6 rounded-lg transition-all duration-300 ${
                wordpressStatus[plugin.id]?.success
                  ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                  : "bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600"
              } text-white border-0 shadow-sm`}
            >
              {wordpressStatus[plugin.id]?.success ? "Connected" : "Connect"}
            </Button>
          )} */}

          {/* Download Button */}
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

          {/* Plugin Description */}
          <Card className="bg-gray-50 border-0 rounded-lg shadow-sm">
            <Paragraph className="text-base text-gray-700 leading-relaxed mb-0">
              {plugin.message}
            </Paragraph>
          </Card>
        </Flex>
      </motion.div>
    )
  }

  const renderTabBar = (props, DefaultTabBar) => (
    <DefaultTabBar {...props} className="custom-tab-bar bg-gray-50 p-2 rounded-t-lg" />
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
        <Title
          level={1}
          className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
        >
          Plugin Center
        </Title>
        <Paragraph className="text-gray-600 max-w-xl mt-2 text-base">
          Discover and integrate powerful tools to supercharge your workflow
        </Paragraph>
      </motion.div>

      <div className="flex-1 px-6 sm:px-8 pb-8">
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
