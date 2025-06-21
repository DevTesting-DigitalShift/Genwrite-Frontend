import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { loginUser, signupUser } from "../../store/slices/authSlice";
import { useGoogleLogin } from "@react-oauth/google";
import axiosInstance from "@api/index";
import { motion, AnimatePresence } from "framer-motion";
import { FaEnvelope, FaLock, FaUser, FaEye, FaEyeSlash, FaShieldAlt, FaRocket } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { setUserBlogs } from "@store/slices/blogSlice";
import { Sparkles, Zap, PenTool, CheckCircle } from "lucide-react";
import { toast } from "react-toastify";

const Auth = ({ path }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSignup, setIsSignup] = useState(path === "signup");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleGoogleLogin = useGoogleLogin({
    flow: "implicit",
    redirect_uri: "https://genwrite-frontend-eight.vercel.app/login",
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        const response = await axiosInstance.post("/auth/google-signin", {
          access_token: tokenResponse.access_token,
        });

        if (response.data.success && response.data.token) {
          localStorage.setItem("token", response.data.token);
          const userData = {
            _id: response.data.user._id,
            name: response.data.user.name,
            email: response.data.user.email,
            avatar: response.data.user.avatar,
            interests: response.data.user.interests || [],
          };
          dispatch(setUserBlogs(userData));
          navigate("/dash");
        }
      } catch (error) {
        setError("Google login failed. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError("Google login failed to initialize."),
  });

  useEffect(() => setIsSignup(path === "signup"), [path]);
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError(null);

  try {
    const action = isSignup
      ? signupUser({ email, password, name })
      : loginUser({ email, password });

    const response = await dispatch(action).unwrap(); // unwrap to catch errors

    console.log({ response });

    // Success
    toast.success(isSignup ? "Signup successful!" : "Login successful!");
    navigate("/dash");
  } catch (err) {
    console.error(err);

    const backendError = err?.message || err?.payload?.message || "Something went wrong.";
    setError(backendError);
    toast.error(backendError);
  } finally {
    setLoading(false);
  }
};

  const features = [
    { icon: <PenTool className="w-5 h-5" />, text: "AI-Powered Writing" },
    { icon: <Zap className="w-5 h-5" />, text: "Lightning Fast" },
    { icon: <FaShieldAlt className="w-5 h-5" />, text: "Secure & Private" }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ 
            rotate: [0, 360],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 20, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ 
            rotate: [360, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            duration: 25, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-cyan-400/20 rounded-full blur-3xl"
        />
      </div>

      {/* Logo */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="absolute top-8 left-1/2 transform -translate-x-1/2 z-10"
      >
        <img 
          src="/Images/logo_genwrite_2.png" 
          alt="GenWrite Logo" 
          className="w-40 h-auto" 
        />
      </motion.div>

      <div className="flex items-center justify-center min-h-screen px-4 pt-20 pb-8">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Side - Features & Branding */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hidden lg:block space-y-8"
          >
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                AI-Powered Writing Platform
              </div>
              
              <h1 className="text-5xl font-bold text-gray-900 leading-tight">
                Transform Your
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Writing</span>
                <br />
                with AI
              </h1>
              
              <p className="text-xl text-gray-600 leading-relaxed">
                Join thousands of writers who use GenWrite to create compelling content, 
                boost productivity, and unlock their creative potential.
              </p>
            </div>

            <div className="space-y-4">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="flex items-center gap-3 text-gray-700"
                >
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white">
                    {feature.icon}
                  </div>
                  <span className="font-medium">{feature.text}</span>
                </motion.div>
              ))}
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Free to Start</h3>
                  <p className="text-sm text-gray-600">No credit card required</p>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Get started with 500 free AI credits and explore all features risk-free.
              </p>
            </div>
          </motion.div>

          {/* Right Side - Auth Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="w-full max-w-md mx-auto"
          >
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 relative overflow-hidden">
              
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full -translate-y-16 translate-x-16" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-400/10 to-cyan-400/10 rounded-full translate-y-12 -translate-x-12" />

              {/* Header */}
              <div className="relative mb-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.5 }}
                  className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4"
                >
                  <FaRocket className="text-white text-2xl" />
                </motion.div>
                
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {isSignup ? "Join GenWrite" : "Welcome Back"}
                </h2>
                <p className="text-gray-600">
                  {isSignup ? "Start your AI writing journey today" : "Continue creating amazing content"}
                </p>
              </div>

              {/* Google Button */}
              <motion.button
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-white border-2 border-gray-200 rounded-2xl text-gray-700 hover:border-gray-300 hover:shadow-lg transition-all duration-300 mb-6 font-medium disabled:opacity-50"
              >
                <FcGoogle className="text-2xl" />
                <span>
                  {isSignup ? "Sign up with Google" : "Continue with Google"}
                </span>
              </motion.button>

              {/* Divider */}
              <div className="flex items-center my-6">
                <hr className="flex-1 border-gray-200" />
                <span className="px-4 text-gray-500 text-sm font-medium">or</span>
                <hr className="flex-1 border-gray-200" />
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <AnimatePresence mode="wait">
                  {isSignup && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="relative"
                    >
                      <div className="absolute top-4 left-4 text-gray-400 z-10">
                        <FaUser />
                      </div>
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full pl-12 pr-4 py-4 bg-gray-50/80 border-2 border-gray-200 rounded-2xl text-gray-800 placeholder-gray-500 focus:border-blue-500 focus:bg-white focus:shadow-lg outline-none transition-all duration-300"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="relative">
                  <div className="absolute top-4 left-4 text-gray-400 z-10">
                    <FaEnvelope />
                  </div>
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-4 bg-gray-50/80 border-2 border-gray-200 rounded-2xl text-gray-800 placeholder-gray-500 focus:border-blue-500 focus:bg-white focus:shadow-lg outline-none transition-all duration-300"
                  />
                </div>

                <div className="relative">
                  <div className="absolute top-4 left-4 text-gray-400 z-10">
                    <FaLock />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-12 pr-12 py-4 bg-gray-50/80 border-2 border-gray-200 rounded-2xl text-gray-800 placeholder-gray-500 focus:border-blue-500 focus:bg-white focus:shadow-lg outline-none transition-all duration-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 transition-colors z-10"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="bg-red-50 border border-red-200 rounded-xl p-3"
                    >
                      <p className="text-red-600 text-sm text-center font-medium">
                        {error}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button
                  whileHover={{ y: -2, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className={`w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl ${
                    loading ? "opacity-70 cursor-not-allowed" : "hover:from-blue-700 hover:to-purple-700"
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-3">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white/30 rounded-full border-t-white"
                      />
                      <span>Processing...</span>
                    </div>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      {isSignup ? (
                        <>
                          <FaRocket />
                          Create Account
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          Sign In
                        </>
                      )}
                    </span>
                  )}
                </motion.button>
              </form>

              {/* Bottom Link */}
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-center text-gray-600 mt-8"
              >
                {isSignup ? "Already have an account? " : "Don't have an account? "}
                <Link
                  to={isSignup ? "/login" : "/signup"}
                  className="text-blue-600 font-semibold hover:text-blue-800 transition-colors hover:underline"
                >
                  {isSignup ? "Sign in here" : "Sign up free"}
                </Link>
              </motion.p>

              {/* Trust Indicators */}
              {isSignup && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                  className="mt-6 pt-6 border-t border-gray-200"
                >
                  <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <FaShieldAlt className="text-green-500" />
                      <span>Secure</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      <span>Free Start</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap className="w-3 h-3 text-blue-500" />
                      <span>Instant Access</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Auth;