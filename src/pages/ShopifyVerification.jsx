import React, { useState, useEffect } from "react"
import { Card, Typography, Space, Spin, Result, Button, Table } from "antd"
import {
  CheckCircleFilled,
  ShopOutlined,
  LoadingOutlined,
  CloseCircleFilled,
  EyeOutlined,
  LinkOutlined,
} from "@ant-design/icons"
import { motion } from "framer-motion"
import { useNavigate, useSearchParams } from "react-router-dom"
import axiosInstance from "@api/index"

const { Title, Text, Paragraph } = Typography

const ShopifyVerification = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false) // Set to false since useEffect is commented
  const [verified, setVerified] = useState(true) // Set to true to show the table
  const [error, setError] = useState(null)

  // Removed duplicate blog data - keeping only unique entries
  const [blogData, setBlogData] = useState([
    {
      _id: "69259f8a72d8f225868aa259",
      blogId: {
        _id: "690971d3d35110208690bcf6",
        title: "Health is wealth",
      },
      link: "https://genwrite-dev-test.myshopify.com/blogs/lifestyle/health-is-wealth",
      postedOn: "2025-11-19T12:10:59.196Z",
    },
    {
      _id: "69259f8a72d8f225868aa258",
      blogId: {
        _id: "6900bd4a5762ffc32e9edcb3",
        title: "Marriage vs Casual Relation",
      },
      link: "https://genwrite-dev-test.myshopify.com/blogs/lifestyle/marriage-vs-casual-relation",
      postedOn: "2025-11-19T08:00:26.763Z",
    },
    {
      _id: "69259f8a72d8f225868aa24e",
      blogId: {
        _id: "68c2a326d78cd53945e1d492",
        title: "What are answer engines and how can they impact your search strategy?",
      },
      link: "https://genwrite-dev-test.myshopify.com/blogs/other/what-are-answer-engines-and-how-can-they-impact-your-search-strategy",
      postedOn: "2025-11-19T04:33:44.774Z",
    },
    {
      _id: "69259f8a72d8f225868aa256",
      blogId: {
        _id: "68ca24eb9b526b1587aff470",
        title: "Unlock unparalleled website traffic with these advanced SEO strategies",
      },
      link: "https://genwrite-dev-test.myshopify.com/blogs/blogging/unlock-unparalleled-website-traffic-with-these-advanced-seo-strategies",
      postedOn: "2025-11-17T04:13:42.725Z",
    },
    {
      _id: "69259f8a72d8f225868aa250",
      blogId: {
        _id: "68c422842e1306bee7c02f4a",
        title: "Digital marketing: Is SEO worth the effort?",
      },
      link: "https://genwrite-dev-test.myshopify.com/blogs/digital-marketing/digital-marketing-is-seo-worth-the-effort",
      postedOn: "2025-11-17T04:02:28.971Z",
    },
    {
      _id: "69259f8a72d8f225868aa252",
      blogId: {
        _id: "68c8d974803d693d688c39c4",
        title: "Mastering local SEO to bring customers to your doorstep",
      },
      link: "https://genwrite-dev-test.myshopify.com/blogs/local-seo/mastering-local-seo-to-bring-customers-to-your-doorstep",
      postedOn: "2025-11-17T03:37:18.310Z",
    },
    {
      _id: "69259f8a72d8f225868aa24d",
      blogId: {
        _id: "68b83fd6563afbcbbe534d8d",
        title: "Is laser waxing truly the future of hair removal",
      },
      link: "https://genwrite-dev-test.myshopify.com/blogs/digital-marketing/is-laser-waxing-truly-the-future-of-hair-removal",
      postedOn: "2025-11-14T09:08:40.673Z",
    },
    {
      _id: "69259f8a72d8f225868aa24f",
      blogId: {
        _id: "68c421a02e1306bee7c02ef1",
        title: "Navigate the evolving digital marketing landscape with confidence",
      },
      link: "https://genwrite-dev-test.myshopify.com/blogs/digital-marketing/navigate-the-evolving-digital-marketing-landscape-with-confidence",
      postedOn: "2025-11-14T08:35:46.053Z",
    },
    {
      _id: "69259f8a72d8f225868aa24c",
      blogId: {
        _id: "68afc05e0e81b8829cddd257",
        title: "Can genAI tools really make your life easier?",
      },
      link: "https://genwrite-dev-test.myshopify.com/blogs/news/can-genai-tools-really-make-your-life-easier",
      postedOn: "2025-11-14T08:33:38.135Z",
    },
  ])

  // useEffect(() => {
  //   async function init() {
  //     try {
  //       // 1. Get the token directly from the global v4 object
  //       // This handles the generation and refreshing automatically.
  //       // @ts-ignore
  //       const token = await window.shopify.idToken()

  //       // 2. Call your backend with the token
  //       console.log(token)
  //       const res = await axiosInstance.post("/callbacks/verify", {
  //         type: "SHOPIFY",
  //         token,
  //       })
  //       if (res.status == 200) {
  //         console.log(res.data)
  //         setVerified(true)
  //         setError(null)
  //       } else {
  //         console.error("Auth failed")
  //       }
  //     } catch (err) {
  //       console.error("Error fetching token or data:", err)
  //     } finally {
  //       setLoading(false)
  //     }
  //   }

  //   // Wait for the script to be ready if it loads slowly
  //   if (window?.shopify) {
  //     init()
  //   } else {
  //     window.addEventListener("shopify.loaded", init)
  //   }

  //   return () => window.removeEventListener("shopify.loaded", init)
  // }, [])

  // Table columns configuration
  const columns = [
    {
      title: "Blog Title",
      dataIndex: ["blogId", "title"],
      key: "title",
      sorter: (a, b) => a.blogId.title.localeCompare(b.blogId.title),
      filterMode: "tree",
      filterSearch: true,
      filters: blogData
        .map(blog => ({
          text: blog.blogId.title,
          value: blog.blogId.title,
        }))
        .filter((v, i, a) => a.findIndex(t => t.value === v.value) === i),
      onFilter: (value, record) => record.blogId.title === value,
      render: text => <Text strong>{text}</Text>,
    },
    {
      title: "Posted On",
      dataIndex: "postedOn",
      key: "postedOn",
      sorter: (a, b) => new Date(a.postedOn) - new Date(b.postedOn),
      defaultSortOrder: "descend",
      render: date =>
        new Date(date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => window.open(`/toolbox/${record.blogId._id}`, "_blank")}
          >
            View in Editor
          </Button>
          <Button
            type="link"
            icon={<LinkOutlined />}
            onClick={() => window.open(record.link, "_blank")}
          >
            View on Shopify
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-7xl"
      >
        <Card className="shadow-2xl border-0 overflow-hidden rounded-2xl">
          {loading ? (
            <div className="py-16 text-center">
              <Space direction="vertical" size="large" className="w-full">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <ShopOutlined className="text-7xl text-purple-500" />
                </motion.div>
                <div>
                  <Title level={3} className="text-gray-800">
                    Verifying Shopify Integration
                  </Title>
                  <Paragraph className="text-gray-600">
                    Please wait while we connect to your Shopify store...
                    {DUMMY_MODE && (
                      <div className="mt-2">
                        <Text type="secondary" className="text-xs">
                          (Running in dummy simulation mode)
                        </Text>
                      </div>
                    )}
                  </Paragraph>
                </div>
                <Spin indicator={<LoadingOutlined style={{ fontSize: 32 }} spin />} />
              </Space>
            </div>
          ) : error ? (
            <Result
              status="error"
              icon={
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                >
                  <CloseCircleFilled className="text-6xl text-red-500" />
                </motion.div>
              }
              title={
                <Title level={2} className="text-red-700">
                  Verification Failed
                </Title>
              }
              subTitle={
                <div className="text-left max-w-md mx-auto">
                  <Text className="text-gray-600 block mb-4">{error}</Text>
                  <Card className="bg-gray-50 border-gray-200 text-left">
                    <Space direction="vertical" size="small" className="w-full">
                      <Text strong className="text-sm">
                        Troubleshooting:
                      </Text>
                      <ul className="text-xs text-gray-600 pl-4 space-y-1">
                        <li>Ensure this page is accessed from within Shopify Admin</li>
                        <li>Check if the Shopify App Bridge script is loaded</li>
                        <li>Verify your API key is correctly configured</li>
                        <li>Check your backend server is running</li>
                      </ul>
                    </Space>
                  </Card>
                </div>
              }
              extra={[
                <Button
                  key="retry"
                  type="primary"
                  onClick={() => window.location.reload()}
                  className="bg-purple-600 hover:bg-purple-700 border-0"
                >
                  Try Again
                </Button>,
                <Button key="home" onClick={() => navigate("/")}>
                  Go Home
                </Button>,
              ]}
            />
          ) : verified ? (
            <div className="p-6">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mb-6"
              >
                <Space direction="vertical" size="middle" className="w-full">
                  <div className="flex items-center gap-3">
                    <CheckCircleFilled className="text-4xl text-emerald-500" />
                    <div>
                      <Title level={2} className="!mb-0 text-emerald-700">
                        You Are Verified!
                      </Title>
                      <Text className="text-gray-600">
                        Your Shopify store has been successfully verified and connected to GenWrite.
                      </Text>
                    </div>
                  </div>

                  <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
                    <div className="flex items-center gap-2">
                      <CheckCircleFilled className="text-emerald-600" />
                      <Text strong>Session Token Verified</Text>
                    </div>
                  </Card>
                </Space>
              </motion.div>

              <Title level={4} className="mb-4">
                Posted Blogs
              </Title>
              <Table
                columns={columns}
                dataSource={blogData}
                rowKey="_id"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: total => `Total ${total} blogs`,
                }}
                className="shadow-sm"
              />

              <div className="mt-6 text-center">
                <Button
                  type="primary"
                  size="large"
                  onClick={() => navigate("/dashboard")}
                  className="bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700 border-0 font-semibold shadow-lg"
                >
                  Go to Dashboard
                </Button>
              </div>
            </div>
          ) : null}
        </Card>
      </motion.div>
    </div>
  )
}

export default ShopifyVerification
