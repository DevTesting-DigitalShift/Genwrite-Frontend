import { useLocation, useNavigate } from "react-router-dom"
import { Card, Button, Descriptions, Typography } from "antd"
import axiosInstance from "@api/index"
import { loadStripe } from "@stripe/stripe-js"

const { Title } = Typography

// TODO remove this permanently, direclty go to stripe page
export default function PaymentConfirmation() {
  const navigate = useNavigate()
  const location = useLocation()
  const { plan, customCredits } = location.state || {}
  const handleProceed = async () => {
    
  }

  if (!plan?.name) throw new Error("Invalid Payment Request")

  return (
    <Card style={{ maxWidth: 600, margin: "40px auto" }}>
      <Title level={3}>Confirm Your Payment</Title>
      <Descriptions bordered column={1}>
        <Descriptions.Item label="Plan Name">{plan.name}</Descriptions.Item>
        <Descriptions.Item label="Type">{plan.type}</Descriptions.Item>
        <Descriptions.Item label="Price">{`$${(customCredits
          ? customCredits * 0.05
          : plan.price
        ).toFixed(2)}`}</Descriptions.Item>
        {customCredits > 0 && (
          <Descriptions.Item label="Credits">{customCredits}</Descriptions.Item>
        )}
      </Descriptions>
      <div style={{ marginTop: 24, textAlign: "center" }}>
        <Button type="primary" onClick={handleProceed}>
          Proceed to Pay
        </Button>
        <Button style={{ marginLeft: 12 }} onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </div>
    </Card>
  )
}
