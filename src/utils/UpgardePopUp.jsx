import { Modal, Button } from "antd"

export const openUpgradePopup = ({ featureName = "", navigate, fromPage = false, onCancel }) => {
  const modal = Modal.info({
    title: "Upgrade Required",
    content: (
      <div className="p-3 text-base">
        <p>
          <strong>{featureName}</strong> is only for subscribers.
        </p>
        <p>Upgrade your plan to unlock it.</p>
      </div>
    ),
    icon: null,
    okButtonProps: { style: { display: "none" } }, // hide default OK button
    closable: false,
   centered: true,
  })

  modal.update({
    footer: (
      <div className="flex justify-end gap-4 mt-4">
        <Button
          onClick={() => {
            navigate?.("/pricing")
            modal.destroy()
          }}
          type="primary"
        >
          Buy Now
        </Button>
        <Button
          onClick={() => {
            if (fromPage && navigate) navigate(-1)
            if (onCancel) onCancel()
            modal.destroy()
          }}
        >
          Cancel
        </Button>
      </div>
    ),
  })
}
