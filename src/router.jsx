import { lazy, Suspense } from "react"
import { createBrowserRouter, Navigate } from "react-router-dom"
import Loading from "@components/UI/Loading"
const CreditLogsTable = lazy(() => import("@pages/CreditLogs"))
const Transactions = lazy(() => import("@pages/Transactions"))
const ErrorBoundary = lazy(() => import("./layout/error/ErrorBoundary"))
const PublicRoutesLayout = lazy(() => import("./layout/PublicRoutesLayout"))
const PrivateRoutesLayout = lazy(() => import("./layout/PrivateRoutesLayout"))
const Dashboard = lazy(() => import("@pages/Dashboard"))
const ToolBox = lazy(() => import("@pages/MainEditorPage"))
const ToolboxSettings = lazy(() => import("@pages/ToolboxPage"))
const MyProjects = lazy(() => import("@pages/MyProjects"))
const PluginsMain = lazy(() => import("@pages/PluginsMain"))
const BrandVoice = lazy(() => import("@pages/BrandVoice"))
const jobs = lazy(() => import("@pages/Jobs"))
const trashcan = lazy(() => import("@pages/Trashcan"))
const pricing = lazy(() => import("@pages/Upgrade"))
const Profile = lazy(() => import("@pages/Profile"))
const Login = lazy(() => import("@pages/auth/Login"))
const ForgotPassword = lazy(() => import("@pages/auth/ForgotPassword"))
const ResetPassword = lazy(() => import("@pages/auth/ResetPassword"))
const ErrorPage = lazy(() => import("./layout/error/ErrorPage"))
const SuccessPage = lazy(() => import("@pages/payment/SuccessPage"))
const CancelPage = lazy(() => import("@pages/payment/CancelPage"))
const ContactUs = lazy(() => import("@pages/ContactUs"))
const SearchConsole = lazy(() => import("@pages/SearchConsole/SearchConsole.jsx"))
const TermsAndConditions = lazy(() => import("@pages/TermsAndConditions"))
const PrivacyPolicy = lazy(() => import("@pages/Privacy"))
const HumanizeContent = lazy(() => import("@pages/HumanizeContent"))
const CancellationPage = lazy(() => import("@pages/CancellationPage"))
const AnalyticsPage = lazy(() => import("@pages/AnalyticsPage"))
const OutlineEditor = lazy(() => import("@pages/OutlineEditor"))
const GenerateMetaData = lazy(() => import("@pages/GenerateMetaData"))
const PromptContent = lazy(() => import("@pages/PromptContent"))
const UnsubscribeEmail = lazy(() => import("@pages/UnsubscribeEmail"))

/**
 * Wraps a component in React.Suspense with fallback support.
 *
 * @param {React.ComponentType} Component - The lazy-loaded or regular component.
 * @param {Object} props - The props to pass to the component.
 * @param {React.ReactNode} [fallback=null] - Optional fallback content.
 * @returns {JSX.Element}
 */
function withSuspense(Component, props = {}, fallback = null) {
  return (
    <Suspense fallback={<Loading />}>
      <Component {...props} />
    </Suspense>
  )
}

const router = createBrowserRouter([
  {
    path: "/",
    element: withSuspense(PrivateRoutesLayout),
    errorElement: withSuspense(ErrorBoundary),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: withSuspense(Dashboard) },
      { path: "toolbox", element: withSuspense(ToolboxSettings) },
      { path: "editor", element: withSuspense(ToolBox) },
      { path: "toolbox/:id", element: withSuspense(ToolBox) },
      { path: "blogs", element: withSuspense(MyProjects) },
      { path: "integrations", element: withSuspense(PluginsMain) },
      { path: "jobs", element: withSuspense(jobs) },
      { path: "trashcan", element: withSuspense(trashcan) },
      { path: "pricing", element: withSuspense(pricing) },
      { path: "profile", element: withSuspense(Profile) },
      { path: "brand-voice", element: withSuspense(BrandVoice) },
      { path: "transactions", element: withSuspense(Transactions) },
      { path: "credit-logs", element: withSuspense(CreditLogsTable) },
      { path: "contact", element: withSuspense(ContactUs) },
      { path: "blog-performance", element: withSuspense(SearchConsole) },
      { path: "humanize-content", element: withSuspense(HumanizeContent) },
      { path: "outline", element: withSuspense(OutlineEditor) },
      { path: "blog-editor", element: withSuspense(ToolBox) },
      { path: "blog-editor/:id", element: withSuspense(ToolBox) },
      { path: "cancel-subscription", element: withSuspense(CancellationPage) },
      { path: "analytics", element: withSuspense(AnalyticsPage) },
      { path: "generate-metadata", element: withSuspense(GenerateMetaData) },
      { path: "prompt-content", element: withSuspense(PromptContent) },
      {
        path: "payment",
        children: [
          {
            path: "success",
            element: withSuspense(SuccessPage),
          },
          {
            path: "cancel",
            element: withSuspense(CancelPage),
          },
        ],
      },
    ],
  },
  {
    path: "/",
    element: withSuspense(PublicRoutesLayout),
    errorElement: withSuspense(ErrorBoundary),
    children: [
      { path: "login", element: withSuspense(Login, { path: "login" }) },
      { path: "unsubscribe", element: withSuspense(UnsubscribeEmail) },
      { path: "signup", element: withSuspense(Login, { path: "signup" }) },
      { path: "forgot-password", element: withSuspense(ForgotPassword) },
      { path: "reset-password", element: withSuspense(ResetPassword) },
      { path: "privacy-policy", element: withSuspense(PrivacyPolicy) },
      { path: "terms-and-conditions", element: withSuspense(TermsAndConditions) },
      { path: "*", element: withSuspense(ErrorPage) },
    ],
  },
])

export default router
