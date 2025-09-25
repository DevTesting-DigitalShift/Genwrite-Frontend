import React, { createContext, useCallback, useContext, useState } from "react"
import { Modal, Button, Card, Typography } from "antd"
import { AnimatePresence, motion } from "framer-motion"
import { ExclamationCircleOutlined } from "@ant-design/icons"

const { Title, Paragraph } = Typography

const ConfirmPopupContext = createContext()

export const ConfirmPopupProvider = ({ children }) => {
  const [visible, setVisible] = useState(false)
  const [options, setOptions] = useState({})

  const handlePopup = useCallback((opts) => {
    // [s ] get credit cost (optional) here & use it for checking user has enough credits
    setOptions(opts)
    setVisible(true)
  }, [])

  const handleClose = (e) => {
    setVisible(false)
    if (options?.onCancel) {
      options.onCancel(e)
    } else {
      options?.onClose?.(e)
    }
  }

  const handleConfirm = () => {
    try {
      // [s ] Check for credits that user has sufficient amount for operation if not abort & give warning
      options?.onConfirm?.()
      setVisible(false)
    } catch (err) {
      throw err
    }
  }

  const {
    title,
    description,
    confirmText = "Confirm",
    cancelText = "Cancel",
    confirmProps = {},
    cancelProps = {},
    icon = <ExclamationCircleOutlined style={{ fontSize: 40, color: "#d97706" }} />,
    loading = false,
  } = options || {}

  return (
    <ConfirmPopupContext.Provider value={{ handlePopup }}>
      {children}
      <AnimatePresence>
        {visible && (
          <Modal
            open={visible}
            footer={null}
            onCancel={() => handleClose({ source: "mask" })}
            centered
            closable={false}
            maskClosable
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
            className="rounded-2xl"
          >
            <div className="flex items-start gap-3 mt-2">
              <div className="p-1">{icon}</div>
              <div>
                <Title level={4} className="!mb-1 !text-gray-800">
                  {title}
                </Title>
                <Paragraph className="!mb-0 !text-gray-600 text-justify tracking-wide">
                  {description}
                </Paragraph>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button
                type="text"
                danger
                onClick={() => handleClose({ source: "button" })}
                {...cancelProps}
              >
                {cancelText}
              </Button>
              <Button type="primary" loading={loading} onClick={handleConfirm} {...confirmProps}>
                {confirmText}
              </Button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </ConfirmPopupContext.Provider>
  )
}

export const useConfirmPopup = () => useContext(ConfirmPopupContext)
