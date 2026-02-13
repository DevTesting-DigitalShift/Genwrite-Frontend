import React, { useEffect } from "react"
import { Button, Typography, Space, ConfigProvider, message } from "antd"
import { MailMinus } from "lucide-react"
import { useNavigate, useSearchParams } from "react-router-dom"
import useAuthStore from "@store/useAuthStore"

const { Title, Paragraph, Text } = Typography

const UnsubscribeEmail = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { loading, unsubscribeSuccessMessage, error, unsubscribeAction, resetUnsubscribe } =
    useAuthStore()

  // Get email from URL query parameter
  const email = searchParams.get("email")

  // Reset unsubscribe state when component unmounts
  useEffect(() => {
    return () => {
      resetUnsubscribe()
    }
  }, [resetUnsubscribe])

  // Handle success or error messages
  useEffect(() => {
    if (unsubscribeSuccessMessage) {
      message.success(unsubscribeSuccessMessage)
      // Redirect to home after 2 seconds
      setTimeout(() => navigate("/"), 2000)
    }
    if (error) {
      message.error(error)
    }
  }, [unsubscribeSuccessMessage, error, navigate])

  // Validate email format
  const isValidEmail = email => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return email && emailRegex.test(email)
  }

  const handleUnsubscribe = async () => {
    if (!email) {
      message.error("Email not provided in the URL. Please check the link and try again.")
      return
    }
    if (!isValidEmail(email)) {
      message.error("Invalid email format. Please provide a valid email address.")
      return
    }
    try {
      await unsubscribeAction(email)
    } catch (err) {
      // Error is handled by useEffect
    }
  }

  const handleStaySubscribed = () => {
    navigate("/dashboard") // Redirect to dashboard
  }

  return (
    <ConfigProvider
      theme={{
        token: { fontFamily: "Inter, sans-serif" },
        components: { Button: { primaryColor: "#fff" } },
      }}
    >
      <main className="bg-gradient-to-br from-blue-50 via-purple-50 to-white flex items-center justify-center min-h-screen p-4 font-sans">
        <div className="max-w-xl w-full text-center p-8">
          <div className="mb-8">
            <MailMinus className="h-16 w-16 text-purple-500 mx-auto" strokeWidth={1.5} />
          </div>

          <Title level={2} className="!text-4xl !font-bold !text-slate-900 !mb-3">
            We’re sad to see you go 😔
          </Title>

          <Paragraph className="!text-slate-600 !mb-10 !text-lg">
            You’re about to unsubscribe from our emails. Are you sure?
          </Paragraph>

          <Space direction="vertical" className="w-full sm:w-auto sm:!flex-row" size="middle">
            <Button
              type="primary"
              size="large"
              shape="round"
              className="!bg-gradient-to-r !from-purple-600 !to-blue-600 hover:!from-purple-700 hover:!to-blue-700 !h-12 !px-8 !text-base !font-semibold !shadow-lg !border-none transform hover:scale-105 transition-transform"
              onClick={handleStaySubscribed}
              disabled={loading}
            >
              Stay Subscribed
            </Button>
            <Button
              size="large"
              shape="round"
              className="!bg-transparent !h-12 !px-8 !text-base !font-semibold !text-purple-800 !border-purple-300 hover:!bg-purple-100 hover:!border-purple-400"
              onClick={handleUnsubscribe}
              disabled={loading || !email || !isValidEmail(email)}
            >
              Unsubscribe
            </Button>
          </Space>

          <div className="mt-16">
            <Text className="!text-sm !text-slate-500">
              You can resubscribe anytime from your account settings.
            </Text>
          </div>
        </div>
      </main>
    </ConfigProvider>
  )
}

export default UnsubscribeEmail
