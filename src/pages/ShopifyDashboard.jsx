import React from "react"
import { Button, Card, Typography, Space, Result, Divider, Tag } from "antd"
import {
  CheckCircleFilled,
  ShopOutlined,
  ArrowRightOutlined,
  CopyOutlined,
  DownloadOutlined,
} from "@ant-design/icons"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"

const { Title, Text, Paragraph } = Typography

const ShopifyDashboard = () => {
  const navigate = useNavigate()

  const storeDomain = "your-store.myshopify.com" // Replace dynamically later
  const connectedAt = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  const copyToClipboard = text => {
    navigator.clipboard.writeText(text)
    // You can add a toast here
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-4xl"
      >
        <Card className="shadow-2xl border-0 overflow-hidden rounded-2xl">
          {/* Success Header */}
          <Result
            status="success"
            icon={
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                <CheckCircleFilled className="text-6xl text-emerald-500" />
              </motion.div>
            }
            title={
              <Title level={2} className="text-emerald-700">
                Shopify Store Connected Successfully!
              </Title>
            }
            subTitle={
              <Text className="text-gray-600 text-lg">
                Your store is now linked with <strong>GenWrite</strong>. You can now publish
                AI-generated blogs, product descriptions, and more directly to Shopify.
              </Text>
            }
          />

          <Divider />

          {/* Store Info Card */}
          <div className="px-6 pb-6">
            <Space direction="vertical" size="large" className="w-full">
              <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
                <Space direction="vertical" size="middle" className="w-full">
                  <div className="flex items-center gap-3">
                    <ShopOutlined className="text-2xl text-emerald-600" />
                    <div>
                      <Text strong className="text-lg block">
                        {storeDomain}
                      </Text>
                      <Text type="secondary" className="text-sm">
                        Connected on {connectedAt}
                      </Text>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <Tag color="green" icon={<CheckCircleFilled />}>
                      Active Connection
                    </Tag>
                    <Tag color="blue">OAuth Verified</Tag>
                    <Tag color="purple">Write Permissions</Tag>
                  </div>

                  <Button
                    type="text"
                    icon={<CopyOutlined />}
                    onClick={() => copyToClipboard(storeDomain)}
                    className="text-emerald-600 hover:text-emerald-700"
                  >
                    Copy Store URL
                  </Button>
                </Space>
              </Card>

              {/* Quick Actions */}
              <div>
                <Title level={4} className="text-gray-800 mb-4">
                  What’s Next?
                </Title>

                <Space direction="vertical" size="middle" className="w-full">
                  <motion.div whileHover={{ x: 5 }} transition={{ type: "spring" }}>
                    <Card
                      hoverable
                      className="cursor-pointer border-l-4 border-emerald-500"
                      onClick={() => navigate("/content/create?platform=shopify")}
                    >
                      <Space>
                        <div className="bg-emerald-100 p-3 rounded-full">
                          <ArrowRightOutlined className="text-emerald-600" />
                        </div>
                        <div>
                          <Text strong>Generate & Publish Blog Post</Text>
                          <Paragraph type="secondary" className="m-0 text-sm">
                            Create SEO-optimized blogs and push directly to your store.
                          </Paragraph>
                        </div>
                      </Space>
                    </Card>
                  </motion.div>

                  <motion.div whileHover={{ x: 5 }} transition={{ type: "spring" }}>
                    <Card
                      hoverable
                      className="cursor-pointer border-l-4 border-teal-500"
                      onClick={() => navigate("/products/sync")}
                    >
                      <Space>
                        <div className="bg-teal-100 p-3 rounded-full">
                          <ArrowRightOutlined className="text-teal-600" />
                        </div>
                        <div>
                          <Text strong>Sync Product Descriptions</Text>
                          <Paragraph type="secondary" className="m-0 text-sm">
                            Auto-generate and update product copy in bulk.
                          </Paragraph>
                        </div>
                      </Space>
                    </Card>
                  </motion.div>

                  <motion.div whileHover={{ x: 5 }} transition={{ type: "spring" }}>
                    <Card
                      hoverable
                      className="cursor-pointer border-l-4 border-cyan-500"
                      onClick={() => window.open("https://docs.genwrite.ai/shopify", "_blank")}
                    >
                      <Space>
                        <div className="bg-cyan-100 p-3 rounded-full">
                          <DownloadOutlined className="text-cyan-600" />
                        </div>
                        <div>
                          <Text strong>View Integration Guide</Text>
                          <Paragraph type="secondary" className="m-0 text-sm">
                            Learn advanced features: metafields, collections, SEO, and more.
                          </Paragraph>
                        </div>
                      </Space>
                    </Card>
                  </motion.div>
                </Space>
              </div>

              {/* Footer CTA */}
              <div className="text-center mt-8">
                <Button
                  type="primary"
                  size="large"
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-0 font-semibold shadow-lg"
                  icon={<ArrowRightOutlined />}
                  onClick={() => navigate("/dashboard")}
                >
                  Go to Dashboard
                </Button>
              </div>
            </Space>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}

export default ShopifyDashboard
