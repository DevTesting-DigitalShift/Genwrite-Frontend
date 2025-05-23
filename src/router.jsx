import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { previewBlogLoader } from "@pages/preview/previewLoader";
import Loading from "@components/Loading";

const ErrorBoundary = lazy(() => import("@components/ErrorBoundary"));
const PublicRoutesLayout = lazy(() => import("@components/layout/PublicRoutesLayout"));
const PrivateRoutesLayout = lazy(() => import("@components/layout/PrivateRoutesLayout"));
const Dashboard = lazy(() => import("@components/Dashboard"));
const ToolBox = lazy(() => import("@components/toolbox/ToolBox"));
const ToolboxSettings = lazy(() => import("@components/toolbox/toolboxSettings"));
const MyProjects = lazy(() => import("@components/Projects/MyProjects"));
const PluginsMain = lazy(() => import("@components/plugins/PluginsMain"));
const BrandVoice = lazy(() => import("@components/brandvoice/BrandVoice"));
const PreviewBlog = lazy(() => import("@pages/preview/PreviewBlog"));
const jobs = lazy(() => import("@pages/Jobs"));
const upgrade = lazy(() => import("@pages/Upgrade"));
const Profile = lazy(() => import("@pages/Profile"));
const Login = lazy(() => import("@components/auth/Login"));
const ErrorPage = lazy(() => import("@components/ErrorPage"));

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
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: withSuspense(PrivateRoutesLayout),
    errorElement: withSuspense(ErrorBoundary),
    children: [
      { index: true, element: <Navigate to="/dash" replace /> },
      { path: "dash", element: withSuspense(Dashboard) },
      { path: "toolbox", element: withSuspense(ToolboxSettings) },
      { path: "editor", element: withSuspense(ToolBox) },
      { path: "toolbox/:id", element: withSuspense(ToolBox) },
      { path: "project", element: withSuspense(MyProjects) },
      { path: "plugins", element: withSuspense(PluginsMain) },
      { path: "jobs", element: withSuspense(jobs) },
      { path: "upgrade", element: withSuspense(upgrade) },
      { path: "profile", element: withSuspense(Profile) },
      { path: "brandVoice", element: withSuspense(BrandVoice) },
      { path: "*", element: withSuspense(ErrorPage) },
    ],
  },
  {
    path: "/",
    element: withSuspense(PublicRoutesLayout),
    errorElement: withSuspense(ErrorBoundary),
    children: [
      { path: "login", element: withSuspense(Login, { path: "login" }) },
      { path: "signup", element: withSuspense(Login, { path: "signup" }) },
      {
        path: "preview/:blogId",
        element: withSuspense(PreviewBlog),
        loader: previewBlogLoader,
        hydrateFallbackElement: <Loading />,
      },
    ],
  },
]);

export default router;
