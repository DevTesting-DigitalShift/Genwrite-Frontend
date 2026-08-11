import { useEffect, useRef } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { CheckCircle, AlertCircle, Loader2, ArrowLeft } from "lucide-react"
import useAuthStore from "@store/useAuthStore"
import { useAcceptInviteMutation } from "@api/queries/collaborationQueries"
import { setPostAuthRedirect } from "@utils/postAuthRedirect"

const AcceptInvite = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get("token")
  const { isAuthenticated } = useAuthStore()
  const hasAccepted = useRef(false)

  const { mutate: acceptInvite, isPending, isError, error, isSuccess } = useAcceptInviteMutation()

  useEffect(() => {
    if (!token) return
    if (!isAuthenticated) {
      setPostAuthRedirect(`/accept-invite?token=${token}`)
      return
    }
    if (hasAccepted.current || isPending) return
    hasAccepted.current = true
    acceptInvite(token)
  }, [token, isAuthenticated, isPending, acceptInvite])

  if (!token) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white shadow-2xl rounded-3xl p-12 text-center text-slate-800">
          <AlertCircle className="size-16 text-rose-600 mx-auto mb-6" />
          <h1 className="text-3xl font-black mb-4">Invalid Link</h1>
          <p className="text-gray-500 mb-8">No invite token found in the URL.</p>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="btn bg-slate-900 hover:bg-slate-800 text-white w-full rounded-2xl h-14 font-bold border-none transition-all active:scale-[0.98]"
          >
            <ArrowLeft className="size-5 mr-2 inline" /> Back to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white shadow rounded-3xl overflow-hidden animate-in fade-in zoom-in duration-500 text-slate-800">
        <div className="p-8 sm:p-12">
          {!isAuthenticated && (
            <div className="flex flex-col items-center text-center">
              <div className="bg-blue-50 p-6 rounded-full mb-8">
                <CheckCircle className="size-16 text-blue-600" />
              </div>
              <h1 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">
                You've been invited
              </h1>
              <p className="text-gray-500 font-medium text-lg mb-10 max-w-xs mx-auto">
                Sign in or create an account to accept this invite and get read-only access to the
                shared workspace.
              </p>
              <div className="flex flex-col w-full gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="w-full h-14 bg-[#3B4BB8] border-none hover:bg-[#3B4BB8]/90 text-white rounded-2xl font-bold transition-all active:scale-[0.98]"
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/signup")}
                  className="btn btn-ghost btn-lg w-full rounded-2xl font-black text-gray-500 hover:text-gray-700 normal-case"
                >
                  Create an account
                </button>
              </div>
            </div>
          )}

          {isAuthenticated && isPending && (
            <div className="flex flex-col items-center text-center py-10">
              <div className="bg-blue-50 p-6 rounded-full animate-pulse mb-6">
                <Loader2 className="size-12 text-blue-600 animate-spin" />
              </div>
              <h1 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">
                Accepting invite...
              </h1>
              <p className="text-gray-500 font-medium">Just a moment.</p>
            </div>
          )}

          {isAuthenticated && isSuccess && (
            <div className="flex flex-col items-center text-center">
              <div className="bg-emerald-50 p-6 rounded-full mb-8 animate-in bounce-in duration-700">
                <CheckCircle className="size-16 text-emerald-600" />
              </div>
              <h1 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">
                Invite accepted!
              </h1>
              <p className="text-gray-500 font-medium text-lg mb-10 max-w-xs mx-auto">
                You now have read-only access to this workspace. Switch into it any time from
                Collaboration.
              </p>
              <button
                type="button"
                onClick={() => navigate("/collaboration")}
                className="group w-full h-14 bg-[#3B4BB8] border-none hover:bg-[#3B4BB8]/90 text-white rounded-2xl font-bold flex items-center justify-center transition-all active:scale-[0.98]"
              >
                Go to Collaboration
              </button>
            </div>
          )}

          {isAuthenticated && isError && (
            <div className="flex flex-col items-center text-center">
              <div className="bg-rose-50 p-6 rounded-full mb-8 animate-in shake duration-500">
                <AlertCircle className="size-16 text-rose-600" />
              </div>
              <h1 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">
                Couldn't accept invite
              </h1>
              <p className="text-gray-500 font-medium text-lg mb-10 max-w-xs mx-auto">
                {error?.response?.data?.message || "This invite may be invalid or expired."}
              </p>
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="btn btn-ghost btn-lg w-full rounded-2xl font-black text-gray-400 hover:text-gray-600 normal-case"
              >
                <ArrowLeft className="size-5 mr-2" /> Back to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AcceptInvite
