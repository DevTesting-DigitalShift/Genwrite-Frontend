// PricingCalculator.jsx
import React, { useState, useEffect } from "react"
import {
  Form,
  InputNumber,
  Switch,
  Radio,
  Card,
  Typography,
  Row,
  Col,
  Divider,
  Statistic,
  Button,
} from "antd"
import {
  CalculatorOutlined,
  RocketOutlined,
  PictureOutlined,
  CameraOutlined,
  UploadOutlined,
} from "@ant-design/icons"
import { motion } from "framer-motion"
import { pricingConfig } from "@/data/pricingConfig"
import "./calculator.css"

const { Title, Text } = Typography

const PricingCalculator = () => {
  const [form] = Form.useForm()
  const [totalCredits, setTotalCredits] = useState(0)

  const initialValues = {
    wordCount: 500,
    brandVoice: false,
    competitorResearch: false,
    keywordResearch: false,
    internalLinking: false,
    faqGeneration: false,
    automaticPosting: false,
    imageType: "none",
    uploadedImageCount: 0,
    aiModel: "gemini",
  }

  const calculateCredits = values => {
    let credits = 0
    const wordCountChunks = Math.ceil(values.wordCount / pricingConfig.wordCount.base)
    credits += wordCountChunks * pricingConfig.wordCount.cost

    Object.keys(pricingConfig.features).forEach(feature => {
      if (values[feature]) credits += pricingConfig.features[feature].cost
    })

    if (values.imageType === "stock") credits += pricingConfig.images.stock.featureFee
    else if (values.imageType === "ai") credits += pricingConfig.images.ai.featureFee
    else if (values.imageType === "upload")
      credits += (values.uploadedImageCount || 0) * pricingConfig.images.upload.perImageFee

    if (values.aiModel && pricingConfig.aiModels[values.aiModel]) {
      credits += pricingConfig.aiModels[values.aiModel].cost
    }

    return credits
  }

  const handleValuesChange = (_, allValues) => {
    setTotalCredits(calculateCredits(allValues))
  }

  useEffect(() => {
    setTotalCredits(calculateCredits(initialValues))
  }, [])

  return (
    <div className="calculator-wrapper">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="calculator-container"
      >
        <div className="calculator-header">
          <Title level={1} className="calculator-title">
            <CalculatorOutlined className="mr-2 icon-blue" /> Pricing Calculator
          </Title>
          <Text className="calculator-subtitle">
            Estimate the credit cost for your content generation.
          </Text>
        </div>

        <Row gutter={[24, 24]}>
          <Col xs={24} lg={16}>
            <Card className="calculator-card" bodyStyle={{ padding: "32px" }}>
              <Form
                layout="vertical"
                form={form}
                initialValues={initialValues}
                onValuesChange={handleValuesChange}
                size="large"
              >
                {/* Content Settings */}
                <div className="section-block">
                  <Title level={4} className="section-heading">
                    <span className="section-number">1</span> Content Settings
                  </Title>
                  <Form.Item name="wordCount" label="Target Word Count">
                    <InputNumber
                      min={pricingConfig.wordCount.base}
                      step={pricingConfig.wordCount.base}
                      className="w-full"
                      addonAfter="words"
                    />
                  </Form.Item>
                </div>

                <Divider />

                {/* Features */}
                <div className="section-block">
                  <Title level={4} className="section-heading">
                    <span className="section-number purple">2</span> Additional Features
                  </Title>

                  <Row gutter={[16, 16]}>
                    {Object.entries(pricingConfig.features).map(([key, config]) => (
                      <Col xs={12} sm={8} key={key}>
                        <Form.Item name={key} valuePropName="checked" noStyle>
                          <motion.div whileHover={{ scale: 1.02 }} className="feature-card">
                            <div className="feature-card-header">
                              <Text strong>{config.label}</Text>
                              <Form.Item name={key} valuePropName="checked" noStyle>
                                <Switch size="small" />
                              </Form.Item>
                            </div>
                            <Text className="feature-cost">+{config.cost} credits</Text>
                          </motion.div>
                        </Form.Item>
                      </Col>
                    ))}
                  </Row>
                </div>

                <Divider />

                {/* Image Settings */}
                <div className="section-block">
                  <Title level={4} className="section-heading">
                    <span className="section-number green">3</span> Image Settings
                  </Title>

                  <Form.Item name="imageType">
                    <Radio.Group className="calc-radio-grid">
                      <Radio.Button value="none" className="calc-radio-btn">
                        None
                      </Radio.Button>
                      <Radio.Button value="stock" className="calc-radio-btn">
                        <PictureOutlined /> Stock (+{pricingConfig.images.stock.featureFee})
                      </Radio.Button>
                      <Radio.Button value="ai" className="calc-radio-btn">
                        <CameraOutlined /> AI (+{pricingConfig.images.ai.featureFee})
                      </Radio.Button>
                      <Radio.Button value="upload" className="calc-radio-btn">
                        <UploadOutlined /> Upload
                      </Radio.Button>
                    </Radio.Group>
                  </Form.Item>

                  <Form.Item
                    noStyle
                    shouldUpdate={(prev, curr) => prev.imageType !== curr.imageType}
                  >
                    {({ getFieldValue }) =>
                      getFieldValue("imageType") === "upload" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                        >
                          <Form.Item name="uploadedImageCount" label="Number of Images to Upload">
                            <InputNumber min={1} className="w-full" />
                          </Form.Item>
                        </motion.div>
                      )
                    }
                  </Form.Item>
                </div>

                <Divider />

                {/* AI Model */}
                <div className="section-block">
                  <Title level={4} className="section-heading">
                    <span className="section-number orange">4</span> AI Model
                  </Title>
                  <Form.Item name="aiModel">
                    <Radio.Group className="calc-radio-grid">
                      {Object.entries(pricingConfig.aiModels).map(([key, config]) => (
                        <Radio.Button key={key} value={key} className="calc-radio-btn">
                          <span className="font-semibold">{config.label}</span>
                          <span className="text-xs text-gray-500 mx-4">+{config.cost}</span>
                        </Radio.Button>
                      ))}
                    </Radio.Group>
                  </Form.Item>
                </div>
              </Form>
            </Card>
          </Col>

          {/* Summary */}
          <Col xs={24} lg={8}>
            <div className="summary-sticky">
              <motion.div layout className="summary-box">
                <div className="summary-header">
                  <Text className="summary-label">Estimated Cost</Text>
                  <Statistic
                    value={totalCredits}
                    valueStyle={{ color: "#2563eb", fontSize: "3rem" }}
                    suffix={<span className="suffix-text">credits</span>}
                  />
                </div>

                <div className="summary-breakdown">
                  <div className="summary-row">
                    <Text>Base Cost</Text>
                    <Text strong>
                      {Math.ceil(
                        (form.getFieldValue("wordCount") || 500) / pricingConfig.wordCount.base
                      ) * pricingConfig.wordCount.cost}
                    </Text>
                  </div>
                  <div className="summary-row">
                    <Text>Features</Text>
                    <Text strong>
                      {Object.keys(pricingConfig.features).reduce(
                        (a, k) => a + (form.getFieldValue(k) ? pricingConfig.features[k].cost : 0),
                        0
                      )}
                    </Text>
                  </div>
                  <div className="summary-row">
                    <Text>Images</Text>
                    <Text strong>
                      {(() => {
                        const t = form.getFieldValue("imageType")
                        if (t === "stock") return pricingConfig.images.stock.featureFee
                        if (t === "ai") return pricingConfig.images.ai.featureFee
                        if (t === "upload")
                          return (
                            (form.getFieldValue("uploadedImageCount") || 0) *
                            pricingConfig.images.upload.perImageFee
                          )
                        return 0
                      })()}
                    </Text>
                  </div>
                  <div className="summary-row">
                    <Text>AI Model</Text>
                    <Text strong>
                      {pricingConfig.aiModels[form.getFieldValue("aiModel")]?.cost || 0}
                    </Text>
                  </div>
                </div>

                <Button
                  type="primary"
                  size="large"
                  block
                  icon={<RocketOutlined />}
                  className="start-btn"
                >
                  Start Generating
                </Button>
              </motion.div>
            </div>
          </Col>
        </Row>
      </motion.div>
    </div>
  )
}

export default PricingCalculator
