import { Suspense, useEffect } from "react"
import { useNavigate, Outlet, useLocation, useSearchParams } from "react-router-dom"
import { Helmet } from "react-helmet"
import LoadingScreen from "@components/UI/LoadingScreen"
import { connectSocket } from "@utils/socket"
import { message } from "antd"
import { useDispatch, useSelector } from "react-redux"
import { loadAuthenticatedUser } from "@store/slices/authSlice"

const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/privacy-policy",
  "/terms-and-conditions",
  "/unsubscribe",
  "/email-verify",
  "/verify-email",
]

const App = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    const params = Object.fromEntries(searchParams.entries())
    console.log(params)
  }, [searchParams])

  const { user } = useSelector(state => state.auth)

  console.log(user?.emailVerified)

  useEffect(() => {
    const init = async () => {
      try {
        await dispatch(loadAuthenticatedUser()).unwrap()
      } catch {
        navigate("/login")
      }
    }
    init()
  }, [])

  useEffect(() => {
    if (!user) return

    const isPublic = PUBLIC_PATHS.some(p => location.pathname.startsWith(p))

    // 🔥 unverified should never access private pages
    if (user.emailVerified === false && !isPublic) {
      navigate(`/email-verify/${user.email}`, { replace: true })
      return
    }

    // 🔥 verified user shouldn't stay on login/signup page
    if (user.emailVerified === true && isPublic) {
      navigate("/dashboard", { replace: true })
    }
  }, [user, location.pathname])

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) connectSocket(token)
  }, [])

  useEffect(() => {
    const hasShown = sessionStorage.getItem("desktopWarningShown")
    if (window.innerWidth < 1024 && !hasShown) {
      message.warning("For the best experience, please use desktop view.", 5)
      sessionStorage.setItem("desktopWarningShown", "true")
    }
  }, [])

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Helmet>
        <title>GenWrite</title>
      </Helmet>
      <Outlet />
    </Suspense>
  )
}

export default App
