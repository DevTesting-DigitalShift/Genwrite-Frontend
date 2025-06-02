// hooks/useConfirmPopup.js
import { useState, useCallback } from "react"
import { Modal } from "antd"
import { ExclamationCircleOutlined } from "@ant-design/icons"
import { AnimatePresence, motion } from "framer-motion"

export const useConfirmPopup = () => {
  const [visible, setVisible] = useState(false)
  const [options, setOptions] = useState(null)

  const showConfirm = useCallback((opts) => {
    setOptions(opts)
    setVisible(true)
  }, [])

  const handleClose = () => {
    setVisible(false)
  }

  const ConfirmPopup = () => {
    if (!options) return null
    const {
      title,
      description,
      confirmText = "Confirm",
      cancelText = "Cancel",
      onConfirm,
      loading = false,
    } = options

    return (
      <AnimatePresence>
        {visible && (
          <Modal
            open={visible}
            onCancel={handleClose}
            onOk={() => {
              onConfirm?.()
              handleClose()
            }}
            okText={confirmText}
            cancelText={cancelText}
            confirmLoading={loading}
            centered
            maskClosable
            footer={null}
            closeIcon={null}
            className="rounded-xl"
            modalRender={(dom) => (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                {dom}
              </motion.div>
            )}
          >
            <div className="flex items-start gap-3 mt-2">
              <ExclamationCircleOutlined className="text-yellow-500 text-xl mt-1" />
              <div>
                <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
                <p className="text-sm text-gray-600 mt-1">{description}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={handleClose}
                className="px-4 py-1.5 text-sm border rounded-md hover:bg-gray-100"
              >
                {cancelText}
              </button>
              <button
                onClick={() => {
                  onConfirm?.()
                  handleClose()
                }}
                className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {confirmText}
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    )
  }

  return { showConfirm, ConfirmPopup }
}
