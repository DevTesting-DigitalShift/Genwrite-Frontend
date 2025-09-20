import { useState, useEffect, useMemo, useRef } from "react"
import { Tabs, Button, Card, Flex, Row, Col, Divider, Typography, message } from "antd"
import { Server, Zap, Download, User, Calendar, Shield, Clock, Tag } from "lucide-react"
import { pluginsData } from "@/data/pluginsData"
import { motion } from "framer-motion"
import { Helmet } from "react-helmet"
import axiosInstance from "@api/index"
import { gsap } from "gsap"

const { Title, Text, Paragraph } = Typography

const PluginsMain = () => {
  const [wordpressStatus, setWordpressStatus] = useState({})
  const [activeTab, setActiveTab] = useState(null)
  const plugins = useMemo(() => pluginsData(setWordpressStatus), [])
  const tabContentRef = useRef(null)
  const headerRef = useRef(null)

  useEffect(() => {
    if (plugins.length > 0 && !activeTab) {
      setActiveTab(plugins[0].id.toString())
      checkPlugin(plugins[0])
    }

    // GSAP animation for header
    if (headerRef.current) {
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: -30 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
      )
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
    if (tabContentRef.current) {
      gsap.to(tabContentRef.current, {
        duration: 0.3,
        opacity: 0,
        y: 20,
        ease: "power2.in",
        onComplete: () => {
          setActiveTab(key)
          const plugin = plugins.find((p) => p.id.toString() === key)
          if (plugin) {
            checkPlugin(plugin)
          }
          gsap.fromTo(
            tabContentRef.current,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }
          )
        },
      })
    } else {
      setActiveTab(key)
      const plugin = plugins.find((p) => p.id.toString() === key)
      if (plugin) {
        checkPlugin(plugin)
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

      // Show message to user when they click the button
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
        <Card className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 border-0">
          <Flex vertical align="center" justify="center" className="h-full py-12">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <Server size={64} className="text-blue-500 mb-4" />
            </motion.div>
            <Title level={2} className="text-gray-800 mb-2 text-center">
              {plugin.pluginName}
            </Title>
            <Paragraph className="text-gray-600 mb-6 text-center max-w-md text-lg">
              {plugin.message}
            </Paragraph>
            <Button
              type="primary"
              size="large"
              className="bg-blue-600 hover:bg-blue-700 border-0"
              disabled
            >
              Coming Soon
            </Button>
          </Flex>
        </Card>
      )
    }

    return (
      <div ref={tabContentRef} className="h-full">
        <Card className="h-full border-0 bg-transparent">
          <Flex vertical gap="large" className="h-full">
            {/* Header Section */}
            <Row gutter={[24, 24]} className="mb-4">
              <Col xs={24} lg={16}>
                <Flex align="center" gap="large">
                  <motion.img
                    src={plugin.pluginImage}
                    alt={plugin.pluginName}
                    className="h-20 w-20 object-contain"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  />
                  <Flex vertical gap="small">
                    <Title level={1} className="text-gray-900 m-0">
                      {plugin.pluginName}
                    </Title>
                    <Text className="text-xl text-gray-600">{plugin.description}</Text>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-2">
                        <Tag size={16} className="text-blue-500" />
                        <Text className="text-lg text-blue-600 font-medium">
                          Version {plugin.version}
                        </Text>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-green-500" />
                        <Text className="text-lg text-green-600 font-medium">
                          Updated {plugin.updatedDate}
                        </Text>
                      </div>
                    </div>
                  </Flex>
                </Flex>
              </Col>
              <Col xs={24} lg={8}>
                <Flex vertical gap="middle" className="h-full justify-center">
                  <Button
                    type="default"
                    size="large"
                    onClick={() => handleConnectClick(plugin)}
                    className={`transition-colors duration-200 !text-white ${
                      wordpressStatus[plugin.id]?.success
                        ? "!bg-green-700 hover:!bg-green-500"
                        : "!bg-blue-700 hover:!bg-blue-500 hover:!text-black"
                    }`}
                  >
                    {wordpressStatus[plugin.id]?.success ? "Connected" : "Connect"}
                  </Button>
                  <a href={plugin.downloadLink} download>
                    <Button
                      type="default"
                      size="large"
                      icon={<Download size={16} />}
                      className="w-full border-blue-600 text-blue-600 hover:!bg-blue-50 hover:!text-black"
                    >
                      Download Plugin
                    </Button>
                  </a>
                </Flex>
              </Col>
            </Row>

            <Divider className="my-2" />

            {/* Description Section */}
            <Row>
              <Col span={24}>
                <Card size="small" className="bg-gray-50 border-0">
                  <Paragraph className="text-base text-gray-700 leading-relaxed mb-0 p-1 rounded-md">
                    {plugin.message}
                  </Paragraph>
                </Card>
              </Col>
            </Row>
          </Flex>
        </Card>
      </div>
    )
  }

  const renderTabBar = (props, DefaultTabBar) => (
    <DefaultTabBar {...props} className="custom-tab-bar" />
  )

  const tabItems = plugins.map((plugin) => ({
    key: plugin.id.toString(),
    label: (
      <Flex align="center" gap="small" className="font-montserrat tracking-wider">
        {<plugin.icon size={24} />}
        {plugin.name}
      </Flex>
    ),
    children: (
      <div ref={tabContentRef} className="h-full">
        <PluginTabContent plugin={plugin} />
      </div>
    ),
  }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col">
      <style jsx>{`
        .custom-tabs .ant-tabs-tab {
          border-radius: 8px 8px 0 0 !important;
          margin-right: 4px !important;
          background: #f8fafc !important;
          color: #1f2937 !important;
          font-weight: 500;
          font-size: 14px;
          padding: 12px 16px !important;
          border: 1px solid #e5e7eb !important;
          border-bottom: none !important;
          transition: background-color 0.2s ease, color 0.2s ease;
          transform: translateY(0);
          overflow: auto hidden;
        }
        .custom-tabs .ant-tabs-tab:hover {
          background: #f9fafb !important;
          color: #1a73e8 !important;
          transform: translateY(-1px);
        }
        .custom-tabs .ant-tabs-tab-active {
          background: #ffffff !important;
          color: #1a73e8 !important;
          border-bottom: 2px solid #1a73e8 !important;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .custom-tabs .ant-tabs-content-holder {
          height: calc(100% - 50px);
          background: white;
          border-radius: 0 0 8px 8px;
          border: 1px solid #e5e7eb;
          border-top: none;
        }
        .custom-tabs .ant-tabs-content {
          height: 100%;
          padding: 0;
        }
        .custom-tabs .ant-tabs-tabpane {
          height: 100%;
          padding: 0;
        }
        .custom-tabs .ant-tabs-nav {
          margin: 0 !important;
          padding: 0;
        }
        .custom-tabs .ant-tabs-ink-bar {
          display: none !important;
        }
      `}</style>
      <Helmet>
        <title>Plugins | GenWrite</title>
      </Helmet>

      {/* Header Section */}
      <motion.div
        ref={headerRef}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="my-5 ml-6 sm:ml-10"
      >
        <h1 className="bg-gradient-to-tl from-blue-600 to-purple-600 text-transparent bg-clip-text font-bold text-4xl  mb-2">
          Plugin Center <span className="ml-2 text-2xl text-yellow-400">⚡</span>
        </h1>
        <p className="text-gray-600 text-lg mt-2 max-w-2xl">
          Seamlessly integrate powerful tools and features that enhance your workflow
        </p>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 px-6 sm:px-8 pb-8 mt-5">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
          className="h-full bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100"
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
