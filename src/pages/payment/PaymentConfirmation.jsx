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
    const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

    try {
      const response = await axiosInstance.post("/stripe/checkout", {
        planName: plan.name.toLowerCase().includes("pro")
          ? "pro"
          : plan.name.toLowerCase().includes("enterprise")
          ? "enterprise"
          : "credits",
        credits: plan.type === "credit_purchase" ? customCredits : plan.credits,
        success_url: `${window.location.origin}/payment/success`,
        cancel_url: `${window.location.origin}/payment/cancel`,
      })

      // Redirect to Stripe checkout
      console.log(response.data)
      if (response?.data.sessionId) {
        const result = await stripe.redirectToCheckout({sessionId: response.data.sessionId})
        if(result?.error){
          throw error
        }
      }else{
        throw new Error("Something went wrong")
      }
    } catch (error) {
      console.error("Error creating checkout session:", error)
      alert("Failed to initiate checkout. Please try again.")
    }
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
