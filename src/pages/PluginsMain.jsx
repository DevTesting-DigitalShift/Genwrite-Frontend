import { useState, useEffect, useMemo, useRef } from "react"
import { Tabs, Button, Card, Flex, Row, Col, Divider, Typography, message } from "antd"
import { Server, Download, Tag, Clock } from "lucide-react"
import { pluginsData } from "@/data/pluginsData"
import { motion, AnimatePresence } from "framer-motion"
import { Helmet } from "react-helmet"
import axiosInstance from "@api/index"

const { Title, Text, Paragraph } = Typography

const PluginsMain = () => {
  const [wordpressStatus, setWordpressStatus] = useState({})
  const [activeTab, setActiveTab] = useState(null)
  const plugins = useMemo(() => pluginsData(setWordpressStatus), [])

  useEffect(() => {
    if (plugins.length > 0 && !activeTab) {
      setActiveTab(plugins[0].id.toString())
      checkPlugin(plugins[0])
    }
  }, [plugins])

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
              ? "No wordpress link found. Add wordpress link into your profile."
              : err.response?.status === 502
              ? "Wordpress connection failed, check plugin is installed & active"
              : "Wordpress Connection Error",
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
              ? "No wordpress link found. Add wordpress link into your profile."
              : err.response?.status === 502
              ? "Wordpress connection failed, check plugin is installed & active"
              : "Wordpress Connection Error",
          success: false,
        },
      }))
      message.error("Wordpress Connection Error")
    }
  }

  const PluginTabContent = ({ plugin }) => {
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
        <div>
          <Flex vertical gap="large" className="h-full p-6">
            <Row gutter={[24, 24]} align="middle">
              <Col xs={24} lg={16}>
                <Flex align="center" gap="large">
                  <motion.img
                    src={plugin.pluginImage}
                    alt={plugin.pluginName}
                    className="h-16 w-16 object-contain rounded-lg"
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
              </Col>
              <Col xs={24} lg={8}>
                <Flex vertical gap="middle" className="h-full justify-center">
                  <Button
                    type="primary"
                    size="large"
                    onClick={() => handleConnectClick(plugin)}
                    className={`w-full rounded-lg transition-all duration-300 ${
                      wordpressStatus[plugin.id]?.success
                        ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                        : "bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600"
                    } text-white border-0`}
                  >
                    {wordpressStatus[plugin.id]?.success ? "Connected" : "Connect"}
                  </Button>
                  <a href={plugin.downloadLink} download>
                    <Button
                      type="default"
                      size="large"
                      icon={<Download size={16} />}
                      className="w-full border-teal-500 text-teal-600 hover:bg-teal-50 rounded-lg"
                    >
                      Download Plugin
                    </Button>
                  </a>
                </Flex>
              </Col>
            </Row>

            <Divider className="my-4 border-gray-200" />

            <Row>
              <Col span={24}>
                <Card className="bg-gray-50 border-0 rounded-lg">
                  <Paragraph className="text-base text-gray-700 leading-relaxed mb-0">
                    {plugin.message}
                  </Paragraph>
                </Card>
              </Col>
            </Row>
          </Flex>
        </div>
      </motion.div>
    )
  }

  const renderTabBar = (props, DefaultTabBar) => (
    <DefaultTabBar {...props} className="custom-tab-bar" />
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
      <style jsx>{`
        .custom-tabs .ant-tabs-tab {
          padding: 12px 24px;
          background: transparent !important;
          color: #4b5563 !important;
          font-weight: 600;
          font-size: 16px;
          border: none !important;
          transition: color 0.3s ease, transform 0.2s ease;
          position: relative;
        }
        .custom-tabs .ant-tabs-tab:hover {
          color: #1e40af !important;
          transform: translateY(-2px);
        }
        .custom-tabs .ant-tabs-tab-active {
          color: #1e40af !important;
        }
        .custom-tabs .ant-tabs-tab-active::after {
          content: "";
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 3px;
          background: linear-gradient(to right, #3b82f6, #10b981);
          border-radius: 2px;
        }
        .custom-tabs .ant-tabs-nav {
          margin: 0 !important;
          padding: 0 16px;
          background: white;
          border-bottom: 1px solid #e5e7eb;
        }
        .custom-tabs .ant-tabs-content-holder {
          background: white;
          border-radius: 0 0 12px 12px;
          padding: 16px;
        }
        .custom-tabs .ant-tabs-content {
          height: 100%;
        }
        .custom-tabs .ant-tabs-tabpane {
          height: 100%;
        }
        .custom-tabs .ant-tabs-ink-bar {
          display: none !important;
        }
      `}</style>
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
        <p className="text-gray-600 max-w-xl mt-2 text-base">
          Discover and integrate powerful tools to supercharge your workflow
        </p>
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
            className="h-full custom-tabs"
            renderTabBar={renderTabBar}
            items={tabItems}
          />
        </motion.div>
      </div>
    </div>
  )
}

export default PluginsMain
