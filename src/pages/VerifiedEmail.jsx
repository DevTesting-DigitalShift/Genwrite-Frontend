import React, { useEffect, useState, useRef } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { Card, Typography, Button, Result, Spin } from "antd"
import { CheckCircleOutlined, WarningOutlined } from "@ant-design/icons"
import axiosInstance from "@api/index"

const { Title, Text } = Typography

const VerifiedEmail = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const token = searchParams.get("token")

  const [status, setStatus] = useState("loading") // loading | success | error
  const [errorMessage, setErrorMessage] = useState("")

  // This prevents double execution no matter what
  const hasVerified = useRef(false)

  // 🔥 VERIFY EMAIL USING TOKEN
  useEffect(() => {
    if (!token) {
      setStatus("error")
      setErrorMessage("Verification token missing")
      return
    }

    if (hasVerified?.current) {
      console.debug("Already verified, skipping duplicate call")
      return
    }

    const verifyEmail = async () => {
      try {
        const res = await axiosInstance.post("/auth/verify-email", { token })

        if (res.data?.success) {
          hasVerified.current = true
          setStatus("success")
        } else {
          setStatus("error")
          setErrorMessage(res.data?.message || "Verification failed")
        }
      } catch (err) {
        setStatus("error")
        setErrorMessage(err.response?.data?.message || "Invalid or expired token")
      }
    }
  }, [token])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-xl rounded-2xl border-0 p-6">
        {/* ⏳ LOADING STATE */}
        {status === "loading" && (
          <div className="flex flex-col items-center text-center p-10">
            <Spin size="large" />
            <Title level={4} className="mt-4">
              Verifying your email…
            </Title>
            <Text type="secondary">Please wait a moment.</Text>
          </div>
        )}

        {/* ✅ SUCCESS STATE */}
        {status === "success" && (
          <Result
            status="success"
            icon={<CheckCircleOutlined className="text-4xl text-green-500" />}
            title="Email Verified Successfully 🎉"
            subTitle="You're all set. You can now access your dashboard."
            extra={[
              <Button
                type="primary"
                size="large"
                onClick={() => navigate("/dashboard")}
                key="dashboard"
              >
                Go to Dashboard
              </Button>,
            ]}
          />
        )}

        {/* ❌ ERROR STATE */}
        {status === "error" && (
          <Result
            status="error"
            icon={<WarningOutlined className="text-4xl text-red-500" />}
            title="Email Verification Failed"
            subTitle={errorMessage}
            extra={[
              <div className="flex justify-center">
                <Button size="large" onClick={() => navigate("/login")} key="login">
                  Back to Login
                </Button>
              </div>,
            ]}
          />
        )}
      </Card>
    </div>
  )
}

export default VerifiedEmail
