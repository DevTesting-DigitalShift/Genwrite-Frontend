import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Zap, X, ShoppingCart } from "lucide-react"

export const openUpgradePopup = ({ featureName = "", navigate, fromPage = false, onCancel }) => {
  // Since we want an imperative API like Modal.info, we'll create a temporary container
  const container = document.createElement("div")
  container.id = "upgrade-popup-container"
  document.body.appendChild(container)

  const destroy = () => {
    document.body.removeChild(container)
  }

  const modalHtml = `
    <dialog class="modal modal-open bg-slate-900/40 backdrop-blur-sm">
      <div class="modal-box bg-white rounded-[32px] shadow-2xl border border-slate-100 p-0 overflow-hidden max-w-md">
        <div class="bg-linear-to-r from-blue-600 to-indigo-600 p-8 text-white relative">
          <button class="absolute top-4 right-4 text-white/50 hover:text-white transition-colors" onclick="window.closeUpgradePopup(false)">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div class="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 class="text-2xl font-black">Upgrade Required</h3>
          <p class="text-blue-100 font-bold opacity-80 mt-1">Unlock premium capabilities</p>
        </div>
        
        <div class="p-8 space-y-6">
          <div class="bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <p class="text-slate-600 font-bold leading-relaxed">
              <span class="text-indigo-600 font-black">${featureName || "This feature"}</span> is exclusively available to our subscribed users. Join the professional tier to boost your productivity.
            </p>
          </div>
          
          <div class="flex flex-col gap-3">
            <button class="btn btn-primary h-14 rounded-2xl font-black text-lg bg-linear-to-r from-blue-600 to-indigo-600 border-none text-white shadow-xl shadow-blue-200 normal-case hover:scale-[1.02] transition-transform" onclick="window.closeUpgradePopup(true)">
              Upgrade Now
            </button>
            <button class="btn btn-ghost h-14 rounded-2xl font-black text-slate-400 hover:bg-slate-50 normal-case" onclick="window.closeUpgradePopup(false)">
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </dialog>
  `

  container.innerHTML = modalHtml

  window.closeUpgradePopup = confirm => {
    if (confirm) {
      navigate?.("/pricing")
    } else {
      if (fromPage && navigate) navigate(-1)
      if (onCancel) onCancel()
    }
    destroy()
    delete window.closeUpgradePopup
  }
}
