"use client"

import React, { useState, useEffect } from "react"
import { Card, Input, Button, Form, Typography, Alert, Space, Result, message } from "antd"
import { MailOutlined, CheckCircleOutlined, ReloadOutlined } from "@ant-design/icons"
import { useParams, useNavigate } from "react-router-dom"
import axiosInstance from "@api/index"

const { Title, Text } = Typography

export default function EmailVerification() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [verified, setVerified] = useState(false)
  const [error, setError] = useState("")
  const [email, setEmail] = useState("")
  const [showOTP, setShowOTP] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(0)
  const [canResend, setCanResend] = useState(true)

  const { email: emailParam } = useParams()
  const navigate = useNavigate()

  // Load email from URL param but DO NOT show OTP yet
  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam)
      form.setFieldsValue({ email: emailParam })
    }
  }, [emailParam])

  // Resend countdown logic
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setCanResend(true)
    }
  }, [resendCountdown])

  const startResendCountdown = () => {
    setResendCountdown(60)
    setCanResend(false)
  }

  // STEP 1 → send code
  const handleSendCode = async () => {
    try {
      setLoading(true)
      setError("")

      const values = await form.validateFields(["email"])
      setEmail(values.email)

      await axiosInstance.post("/auth/resend-verification-email", {
        email: values.email,
      })

      message.success("Verification code sent!")
      startResendCountdown()
      setShowOTP(true)
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send verification email")
    } finally {
      setLoading(false)
    }
  }

  // STEP 2 → verify code
  const handleVerify = async values => {
    try {
      setLoading(true)
      setError("")

      // DEMO ONLY — replace with real API later
      if (values.code === "123456") {
        setVerified(true)
        message.success("Email Verified 🎉")
        setTimeout(() => navigate("/dashboard"), 1200)
      } else {
        setError("Invalid verification code. Try: 123456")
      }
    } catch (err) {
      setError("Verification failed.")
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!canResend) return
    await handleSendCode()
  }

  // SUCCESS PAGE
  if (verified) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <Result
          status="success"
          icon={<CheckCircleOutlined className="text-green-500 text-6xl" />}
          title="Email Verified!"
          subTitle={
            <span>
              Your email <strong>{email}</strong> is verified.
            </span>
          }
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        {/* Header */}
        <div className="flex flex-col items-center justify-center text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <MailOutlined className="text-blue-600 text-2xl" />
          </div>
          <Title level={3}>Verify Your Email</Title>
        </div>

        <Form form={form} layout="vertical" onFinish={handleVerify}>
          <Space direction="vertical" size="large" className="w-full">
            {/* Email Input */}
            <Form.Item
              name="email"
              rules={[
                { required: true, message: "Email required" },
                { type: "email", message: "Invalid email" },
              ]}
            >
              <Input
                placeholder="you@example.com"
                size="large"
                disabled={!!email} // 🔥 IMPORTANT: disable if URL email found
              />
            </Form.Item>

            {/* STEP 1 — SEND CODE SCREEN */}
            {!showOTP && (
              <Button type="primary" size="large" loading={loading} block onClick={handleSendCode}>
                Send Code
              </Button>
            )}

            {/* STEP 2 — OTP SCREEN */}
            {showOTP && (
              <>
                <Alert
                  message={
                    <div>
                      <Text strong>{email}</Text>
                      <br />
                      <Text type="secondary">A 6-digit code was sent to your inbox.</Text>
                    </div>
                  }
                  type="info"
                  showIcon
                />

                <Form.Item
                  name="code"
                  rules={[
                    { required: true, message: "Enter the 6-digit code" },
                    { len: 6, message: "Code must be 6 digits" },
                  ]}
                >
                  <Input.OTP length={6} />
                </Form.Item>

                {error && <Alert message={error} type="error" showIcon />}

                <div className="flex gap-3">
                  <Button
                    type="primary"
                    size="large"
                    htmlType="submit"
                    loading={loading}
                    className="flex-1"
                  >
                    Verify
                  </Button>

                  <Button
                    size="large"
                    onClick={handleResend}
                    disabled={!canResend || loading}
                    icon={resendCountdown > 0 ? <ReloadOutlined spin /> : <ReloadOutlined />}
                  >
                    {resendCountdown > 0 ? `${resendCountdown}s` : "Resend"}
                  </Button>
                </div>
              </>
            )}
          </Space>
        </Form>
      </Card>
    </div>
  )
}
