import { Modal } from "antd"

export const openUpgradePopup = ({ featureName = "", navigate, fromPage = false, onCancel }) => {
  Modal.confirm({
    title: "Upgrade Required",
    content: (
      <>
        <p>
          <strong>{featureName}</strong> is only available for Pro and Enterprise users.</p>
        <p>Upgrade your plan to unlock this feature.</p>
      </>
    ),
    okText: "Buy Now",
    cancelText: "Cancel",
    onOk: () => navigate?.("/upgrade"),
    onCancel: () => {
      if (fromPage && navigate) navigate(-1)
      if (onCancel) onCancel()
    },
  })
}
