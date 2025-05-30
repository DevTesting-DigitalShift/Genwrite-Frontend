import { Result, Button } from "antd";
import { useNavigate } from "react-router-dom";

export default function SuccessPage() {
  const navigate = useNavigate();

  return (
    <Result
      status="success"
      title="Payment Successful!"
      subTitle="Your subscription or credit purchase has been processed."
      extra={[
        <Button type="primary" onClick={() => navigate("/")}>
          Go to Dashboard
        </Button>,
      ]}
    />
  );
}
