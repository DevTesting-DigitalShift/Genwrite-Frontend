import { DollarSign, IndianRupee } from "lucide-react"

export function getCurrencySymbol(currency) {
  switch (currency) {
    case "usd":
      return "$"
    case "inr":
      return "₹"
    default:
      return "$"
  }
}

export function getCurrencyIcon(currency) {
  switch (currency) {
    case "usd":
      return DollarSign
    case "inr":
      return IndianRupee
    default:
      return DollarSign
  }
}
