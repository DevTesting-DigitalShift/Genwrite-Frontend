import React, { createContext, useCallback, useContext, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { AlertCircle } from "lucide-react"

const ConfirmPopupContext = createContext()

export const ConfirmPopupProvider = ({ children }) => {
  const [visible, setVisible] = useState(false)
  const [options, setOptions] = useState({})

  const handlePopup = useCallback(opts => {
    setOptions(opts)
    setVisible(true)
  }, [])

  const handleClose = e => {
    setVisible(false)
    if (options?.onCancel) {
      options.onCancel(e)
    } else {
      options?.onClose?.(e)
    }
  }

  const handleConfirm = async () => {
    try {
      if (options?.onConfirm) {
        await options.onConfirm()
      }
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
    icon = <AlertCircle size={40} className="text-amber-500" />,
    loading = false,
  } = options || {}

  return (
    <ConfirmPopupContext.Provider value={{ handlePopup }}>
      {children}
      <AnimatePresence>
        {visible && (
          <dialog className="modal modal-open">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="modal-box"
            >
              <h3 className="font-bold text-lg">{title}</h3>
              <p className="text-gray-600 text-sm text-justify py-4">
                {description}
              </p>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => handleClose({ source: "button" })}
                  className="btn"
                  {...cancelProps}
                >
                  {cancelText}
                </button>
                <button
                  onClick={handleConfirm}
                  className="btn"
                  disabled={loading}
                  {...confirmProps}
                >
                  {loading && <span className="loading loading-spinner"></span>}
                  {confirmText}
                </button>
              </div>
            </motion.div>
          </dialog>
        )}
      </AnimatePresence>
    </ConfirmPopupContext.Provider>
  )
}

export const useConfirmPopup = () => useContext(ConfirmPopupContext)
