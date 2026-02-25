import React from "react"
import { motion } from "framer-motion"
import { AlertTriangle, Lock, ChevronRight, CreditCard } from "lucide-react"
import { useCreatePortalSession } from "@api/queries/paymentQueries"
import { toast } from "sonner"

const PaymentPendingModal = ({ user }) => {
  const isOpen = ["past_due"].includes(user?.subscription?.status)
  const { mutate: createPortalSession, isPending } = useCreatePortalSession()

  const handleResolveIssue = () => {
    createPortalSession(undefined, {
      onSuccess: data => {
        if (data?.url) {
          window.location.href = data.url
        } else {
          toast.error("Failed to generate payment link")
        }
      },
      onError: () => {
        toast.error("Unable to access payment portal")
      },
    })
  }

  return (
    <dialog className={`modal ${isOpen ? "modal-open" : ""}`}>
      <div className="modal-box p-0 w-[500px] max-w-full rounded-xl overflow-hidden backdrop-blur-sm">
        <div className="relative overflow-hidden">
          {/* Content Section */}
          <div className="md:p-6 p-3 md:mt-0 mt-6">
            <div className="space-y-6">
              <div className="flex items-start gap-4 p-5 rounded-2xl bg-rose-50 border border-rose-100">
                <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h4 className="font-bold text-rose-900 text-sm uppercase tracking-wider mb-1">
                    Payment Failed
                  </h4>
                  <p className="text-rose-700/80 text-sm font-medium leading-relaxed">
                    We couldn't process your last subscription payment. Please update your billing
                    details on Stripe.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Status</p>
                  <p className="text-sm font-semibold text-slate-700 capitalize">
                    {user?.subscription?.status?.replace("_", " ")}
                  </p>
                </div>
                <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Access</p>
                  <div className="flex items-center gap-1.5 text-rose-600">
                    <Lock className="w-3.5 h-3.5" />
                    <p className="text-sm font-semibold">Restricted</p>
                  </div>
                </div>
              </div>

              <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                <button
                  onClick={handleResolveIssue}
                  className="w-full h-16 bg-purple-300 hover:bg-purple-200 text-purple-900 rounded-2xl font-bold text-lg shadow-xl transition-all flex items-center justify-center gap-3 group"
                >
                  <CreditCard className="w-5 h-5 text-purple-900 group-hover:text-white transition-colors" />
                  <span>Resolve Payment Now</span>
                  <ChevronRight className="w-5 h-5 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </button>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  )
}

export default PaymentPendingModal
