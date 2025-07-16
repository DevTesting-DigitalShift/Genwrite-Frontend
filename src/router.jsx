import { lazy, Suspense } from "react"
import { createBrowserRouter, Navigate } from "react-router-dom"
import { previewBlogLoader } from "@pages/preview/previewLoader"
import Loading from "@components/Loading"
const CreditLogsTable = lazy(() => import("@pages/CreditLogs"))
const Transactions = lazy(() => import("@pages/Transactions"))
const ErrorBoundary = lazy(() => import("@components/ErrorBoundary"))
const PublicRoutesLayout = lazy(() => import("@components/layout/PublicRoutesLayout"))
const PrivateRoutesLayout = lazy(() => import("@components/layout/PrivateRoutesLayout"))
const Dashboard = lazy(() => import("@components/Dashboard"))
const ToolBox = lazy(() => import("@components/toolbox/ToolBox"))
const ToolboxSettings = lazy(() => import("@components/toolbox/toolboxSettings"))
const MyProjects = lazy(() => import("@components/Projects/MyProjects"))
const PluginsMain = lazy(() => import("@components/plugins/PluginsMain"))
const BrandVoice = lazy(() => import("@components/brandvoice/BrandVoice"))
const PreviewBlog = lazy(() => import("@pages/preview/PreviewBlog"))
const jobs = lazy(() => import("@pages/Jobs"))
const trashcan = lazy(() => import("@pages/Trashcan"))
const pricing = lazy(() => import("@pages/Upgrade"))
const Profile = lazy(() => import("@pages/Profile"))
const Login = lazy(() => import("@components/auth/Login"))
const ForgotPassword = lazy(() => import("@components/auth/ForgotPassword"))
const ResetPassword = lazy(() => import("@components/auth/ResetPassword"))
const ErrorPage = lazy(() => import("@components/ErrorPage"))
const SuccessPage = lazy(() => import("@pages/payment/SuccessPage"))
const CancelPage = lazy(() => import("@pages/payment/CancelPage"))
const ContactUs = lazy(() => import("@pages/ContactUs"))
const SearchConsole = lazy(() => import("@pages/SearchConsole"))
const TermsAndConditions = lazy(() => import("@pages/TermsAndConditions"))
const PrivacyPolicy = lazy(() => import("@pages/Privacy"))
const HumanizeContent = lazy(() => import("@pages/HumanizeContent"))
const ManualBlog = lazy(() => import("@components/generateBlog/ManualBlogEditor.jsx/ManualBlog"))

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
      { path: "search-console", element: withSuspense(SearchConsole) },
      { path: "humanize-content", element: withSuspense(HumanizeContent) },
      { path: "blog-editor", element: withSuspense(ManualBlog) },
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
      { path: "signup", element: withSuspense(Login, { path: "signup" }) },
      { path: "forgot-password", element: withSuspense(ForgotPassword) },
      { path: "reset-password", element: withSuspense(ResetPassword) },
      { path: "privacy-policy", element: withSuspense(PrivacyPolicy) },
      { path: "terms-and-conditions", element: withSuspense(TermsAndConditions) },
      { path: "*", element: withSuspense(ErrorPage) },
      {
        path: "preview/:blogId",
        element: withSuspense(PreviewBlog),
        loader: previewBlogLoader,
        hydrateFallbackElement: <Loading />,
      },
    ],
  },
])

export default router
