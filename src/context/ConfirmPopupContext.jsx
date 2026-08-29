import { createContext, useCallback, useContext, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

// These are native buttons, but call sites still pass antd-shaped props left over
// from the old modal: `danger`, and `type="text"`. Translate `danger`, drop the
// rest so they never reach the DOM, and merge `className` with the base classes
// instead of letting it replace them (which stripped the button styling entirely).
const buttonProps = ({ className, danger, type: _antdType, ...rest } = {}) => ({
  ...rest,
  className: cn("btn rounded-md", danger && "btn-error", className),
})

const ConfirmPopupContext = createContext()

export const ConfirmPopupProvider = ({ children }) => {
  const [visible, setVisible] = useState(false)
  const [options, setOptions] = useState({})

  const handlePopup = useCallback((opts) => {
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

  const handleConfirm = async () => {
    if (options?.onConfirm) {
      await options.onConfirm()
    }
    setVisible(false)
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
              <div className="flex items-center gap-3">
                {icon}
                <h3 className="font-bold text-lg">{title}</h3>
              </div>
              <p className="text-gray-600 text-sm text-justify py-4">{description}</p>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => handleClose({ source: "button" })}
                  {...buttonProps(cancelProps)}
                >
                  {cancelText}
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={loading}
                  {...buttonProps(confirmProps)}
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
