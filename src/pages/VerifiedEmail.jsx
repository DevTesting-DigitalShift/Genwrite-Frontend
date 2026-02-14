import React, { useEffect, useState, useRef } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { Card, Typography, Button, Result, Spin } from "antd"
import { CheckCircleOutlined, WarningOutlined } from "@ant-design/icons"
import axiosInstance from "@api/index"
import { useVerifyEmail } from "@/api/queries/authQueries"

const { Title, Text } = Typography

const VerifiedEmail = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const token = searchParams.get("token")
  const hasVerified = useRef(false)
  const { mutate: verifyEmail, isPending, isError, error, isSuccess, data } = useVerifyEmail()

  const [errorMessage, setErrorMessage] = useState("")

  // Update error message when mutation fails
  useEffect(() => {
    if (error) {
      setErrorMessage(error.response?.data?.message || error.message || "Verification failed")
    }
  }, [error])

  // Update error message if success = false in data
  useEffect(() => {
    if (data && !data.success) {
      setErrorMessage(data.message || "Verification failed")
    }
  }, [data])

  // 🔥 VERIFY EMAIL USING TOKEN
  useEffect(() => {
    if (!token) return

    if (hasVerified.current) {
      console.debug("Already verified, skipping duplicate call")
      return
    }

    verifyEmail(
      { token },
      {
        onSuccess: data => {
          hasVerified.current = true
          if (!data.success) {
            // Handle logical error if success is false but status is 200
            // (Though in axios success usually means 2xx, API might return success: false)
          }
        },
        onError: err => {
          console.error("Verification error:", err)
        },
      }
    )
  }, [token, verifyEmail])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-xl rounded-2xl border-0 p-6">
        {/* ⏳ LOADING STATE */}
        {isPending && (
          <div className="flex flex-col items-center text-center p-10">
            <Spin size="large" />
            <Title level={4} className="mt-4">
              Verifying your email…
            </Title>
            <Text type="secondary">Please wait a moment.</Text>
          </div>
        )}

        {/* ✅ SUCCESS STATE */}
        {isSuccess && data?.success && (
          <Result
            className="p-0"
            status="success"
            title="Email Verified Successfully 🎉"
            subTitle="You're all set. You can now access your dashboard."
            extra={[
              <Button
                type="primary"
                size="large"
                onClick={() => navigate("/dashboard")}
                key="dashboard"
                className="w-full"
              >
                Go to Dashboard
              </Button>,
            ]}
          />
        )}

        {/* ❌ ERROR STATE */}
        {(isError || (isSuccess && !data?.success) || (!token && !isPending)) && (
          <Result
            status="error"
            icon={<WarningOutlined className="text-4xl text-red-500" />}
            title="Email Verification Failed"
            subTitle={errorMessage}
            extra={[
              <div className="flex justify-center">
                <Button size="large" onClick={() => navigate(-1)} key="back">
                  Back
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
