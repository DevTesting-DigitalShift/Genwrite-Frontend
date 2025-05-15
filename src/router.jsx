import { lazy } from "react";
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
const Login = lazy(() => import("@components/auth/Login"));
const ErrorPage = lazy(() => import("@components/ErrorPage"));

const router = createBrowserRouter([
  {
    path: "/",
    element: <PrivateRoutesLayout />,
    errorElement: <ErrorBoundary />,
    children: [
      { index: true, element: <Navigate to="/dash" replace /> },
      { path: "dash", element: <Dashboard /> },
      { path: "toolbox", element: <ToolboxSettings /> },
      { path: "editor", element: <ToolBox /> },
      { path: "toolbox/:id", element: <ToolBox /> },
      { path: "project", element: <MyProjects /> },
      { path: "plugins", element: <PluginsMain /> },
      { path: "brandVoice", element: <BrandVoice /> },
      { path: "*", element: <ErrorPage /> },
    ],
  },
  {
    path: "/",
    element: <PublicRoutesLayout />,
    errorElement: <ErrorBoundary />,
    children: [
      { path: "login", element: <Login path="login" /> },
      { path: "signup", element: <Login path="signup" /> },
      {
        path: "preview/:blogId",
        element: <PreviewBlog />,
        loader: previewBlogLoader,
        hydrateFallbackElement: <Loading />,
      },
    ],
  },
]);

export default router;
