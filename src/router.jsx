import { lazy, Suspense } from "react"
import { createBrowserRouter, Navigate } from "react-router-dom"
import LoadingScreen from "@components/ui/LoadingScreen"
import App from "./App"
import ErrorBoundary from "./layout/error/ErrorBoundary"
import VerifiedEmail from "@pages/VerifiedEmail"
const CreditLogsTable = lazy(() => import("@pages/CreditLogs"))
const Transactions = lazy(() => import("@pages/Transactions"))
const PublicRoutesLayout = lazy(() => import("./layout/PublicRoutesLayout"))
const PrivateRoutesLayout = lazy(() => import("./layout/PrivateRoutesLayout"))
const Dashboard = lazy(() => import("@pages/Dashboard"))
const ToolBox = lazy(() => import("@pages/MainEditorPage"))
const BlogsPage = lazy(() => import("@pages/BlogsPage"))
const PluginsMain = lazy(() => import("@pages/PluginsMain"))
const BrandVoice = lazy(() => import("@pages/BrandVoice"))
const jobs = lazy(() => import("@pages/Jobs"))
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
const EmailVerification = lazy(() => import("@pages/EmailVerification"))
const ShopifyVerification = lazy(() => import("@pages/ShopifyVerification"))
const PricingCalculator = lazy(() => import("@pages/PricingCalculator"))
const ImageGallery = lazy(() => import("@pages/ImageGallery"))
const Onboarding = lazy(() => import("@pages/Onboarding"))
const AiContentDetection = lazy(() => import("@pages/AiContentDetection"))
const YouTubeSummarization = lazy(() => import("@pages/YouTubeSummarization"))
const KeywordScraping = lazy(() => import("@pages/KeywordScraping"))
const ChatWithPdf = lazy(() => import("@pages/ChatWithPdf"))
const CompetitorLikeBlog = lazy(() => import("@pages/CompetitorLikeBlog"))
const WebsiteRanking = lazy(() => import("@pages/WebsiteRanking"))
const PerformanceMonitoring = lazy(() => import("@pages/PerformanceMonitoring"))
const CompetitiveAnalysis = lazy(() => import("@pages/CompetitiveAnalysis"))

const RouteFallback = () => <div className="min-h-screen bg-slate-50/50 animate-pulse" />

function withLayoutSuspense(Layout, props = {}) {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Layout {...props} />
    </Suspense>
  )
}

const r = (Component, props = {}) => <Component {...props} />

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        path: "/",
        element: withLayoutSuspense(PublicRoutesLayout),
        children: [
          { path: "login", element: r(Login, { path: "login" }) },
          { path: "unsubscribe", element: r(UnsubscribeEmail) },
          { path: "signup", element: r(Login, { path: "signup" }) },
          { path: "forgot-password", element: r(ForgotPassword) },
          { path: "reset-password", element: r(ResetPassword) },
          { path: "privacy-policy", element: r(PrivacyPolicy) },
          { path: "terms-and-conditions", element: r(TermsAndConditions) },
          { path: "email-verify/:email", element: r(EmailVerification) },
          { path: "verify-email", element: <VerifiedEmail /> },
          {
            path: "payment",
            children: [
              { path: "success", element: r(SuccessPage) },
              { path: "cancel", element: r(CancelPage) },
            ],
          },
          { path: "shopify-verify", element: r(ShopifyVerification) },
          { path: "pricing-calculator", element: r(PricingCalculator) },
          { path: "onboarding", element: r(Onboarding) },
          { path: "*", element: r(ErrorPage) },
        ],
      },
      {
        path: "/",
        element: withLayoutSuspense(PrivateRoutesLayout),
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: "dashboard", element: r(Dashboard) },
          { path: "editor", element: r(ToolBox) },
          { path: "blog/:id", element: r(ToolBox) },
          { path: "blogs", element: r(BlogsPage) },
          { path: "integrations", element: r(PluginsMain) },
          { path: "jobs", element: r(jobs) },
          { path: "trashcan", element: r(BlogsPage) },
          { path: "pricing", element: r(pricing) },
          { path: "profile", element: r(Profile) },
          { path: "brand-voice", element: r(BrandVoice) },
          { path: "transactions", element: r(Transactions) },
          { path: "credit-logs", element: r(CreditLogsTable) },
          { path: "contact", element: r(ContactUs) },
          { path: "blog-performance", element: r(SearchConsole) },
          { path: "humanize-content", element: r(HumanizeContent) },
          { path: "outline", element: r(OutlineEditor) },
          { path: "blog-editor", element: r(ToolBox) },
          { path: "blog-editor/:id", element: r(ToolBox) },
          { path: "cancel-subscription", element: r(CancellationPage) },
          { path: "analytics", element: r(AnalyticsPage) },
          { path: "generate-metadata", element: r(GenerateMetaData) },
          { path: "prompt-content", element: r(PromptContent) },
          { path: "image-gallery", element: r(ImageGallery) },
          { path: "content-detection", element: r(AiContentDetection) },
          { path: "youtube-summarization", element: r(YouTubeSummarization) },
          { path: "keyword-scraping", element: r(KeywordScraping) },
          { path: "chat-with-pdf", element: r(ChatWithPdf) },
          { path: "competitor-like-blog", element: r(CompetitorLikeBlog) },
          { path: "website-ranking", element: r(WebsiteRanking) },
          { path: "performance-monitoring", element: r(PerformanceMonitoring) },
          { path: "competitive-analysis", element: r(CompetitiveAnalysis) },
        ],
      },
    ],
  },
])

export default router
