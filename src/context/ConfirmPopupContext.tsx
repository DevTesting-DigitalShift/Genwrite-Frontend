import { AnimatePresence, motion } from "framer-motion"
import { AlertCircle } from "lucide-react"
import {
  type ButtonHTMLAttributes,
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useState,
} from "react"

/** Why the popup closed — `handleClose` passes this to `onCancel`/`onClose`. */
export interface CloseReason {
  source: string
}

export interface ConfirmPopupOptions {
  title?: ReactNode
  description?: ReactNode
  confirmText?: string
  cancelText?: string
  confirmProps?: ButtonHTMLAttributes<HTMLButtonElement>
  cancelProps?: ButtonHTMLAttributes<HTMLButtonElement>
  icon?: ReactNode
  loading?: boolean
  onConfirm?: () => void | Promise<void>
  onCancel?: (reason: CloseReason) => void
  onClose?: (reason: CloseReason) => void
}

interface ConfirmPopupContextValue {
  handlePopup: (opts: ConfirmPopupOptions) => void
}

// Undefined default so `useConfirmPopup` can tell "no provider" from "no options yet".
const ConfirmPopupContext = createContext<ConfirmPopupContextValue | undefined>(undefined)

export const ConfirmPopupProvider = ({ children }: { children: ReactNode }) => {
  const [visible, setVisible] = useState(false)
  const [options, setOptions] = useState<ConfirmPopupOptions>({})

  const handlePopup = useCallback((opts: ConfirmPopupOptions) => {
    setOptions(opts)
    setVisible(true)
  }, [])

  const handleClose = (e: CloseReason) => {
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
                  className="btn rounded-md"
                  {...cancelProps}
                >
                  {cancelText}
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="btn rounded-md"
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

export const useConfirmPopup = (): ConfirmPopupContextValue => {
  const ctx = useContext(ConfirmPopupContext)
  if (!ctx) {
    throw new Error("useConfirmPopup must be used within a ConfirmPopupProvider")
  }
  return ctx
}
