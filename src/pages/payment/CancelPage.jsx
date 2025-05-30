import { Result, Button } from "antd"
import { useNavigate } from "react-router-dom"

export default function CancelPage() {
  const navigate = useNavigate()

  return (
    <Result
      status="error"
      title="Payment Cancelled"
      subTitle="You cancelled the payment. No changes were made."
      extra={[<Button onClick={() => navigate("/")}>Return to Dashboard</Button>]}
    />
  )
}
