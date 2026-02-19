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
              className="modal-box rounded-2xl"
            >
              <div className="flex items-start gap-3 mt-2">
                <div className="p-1">{icon}</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">{title}</h3>
                  <p className="text-gray-600 text-justify tracking-wide leading-relaxed">
                    {description}
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => handleClose({ source: "button" })}
                  className="btn btn-ghost text-error"
                  {...cancelProps}
                >
                  {cancelText}
                </button>
                <button
                  onClick={handleConfirm}
                  className="btn btn-primary"
                  disabled={loading}
                  {...confirmProps}
                >
                  {loading && <span className="loading loading-spinner"></span>}
                  {confirmText}
                </button>
              </div>
            </motion.div>
            <form method="dialog" className="modal-backdrop">
              <button onClick={() => handleClose({ source: "mask" })}>close</button>
            </form>
          </dialog>
        )}
      </AnimatePresence>
    </ConfirmPopupContext.Provider>
  )
}

export const useConfirmPopup = () => useContext(ConfirmPopupContext)
