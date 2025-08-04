import { Modal } from "antd"

export const openUpgradePopup = ({ featureName = "", navigate, fromPage = false, onCancel }) => {
  Modal.confirm({
    title: "Upgrade Required",
    content: (
      <>
        <p>
          <strong>{featureName}</strong> is only for subscribers.
        </p>
        <p>Upgrade your plan to unlock it.</p>
      </>
    ),
    okText: "Buy Now",
    cancelText: "Cancel",
    onOk: () => navigate?.("/pricing"),
    onCancel: () => {
      if (fromPage && navigate) navigate(-1)
      if (onCancel) onCancel()
    },
  })
}
