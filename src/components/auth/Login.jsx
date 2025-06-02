import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { loginUser, signupUser, setUser } from "../../store/slices/authSlice";
import { useGoogleLogin } from "@react-oauth/google";
import axiosInstance from "@api/index";
import { motion, AnimatePresence } from "framer-motion";
import { FaEnvelope, FaLock, FaUser, FaEye, FaEyeSlash } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";

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

  // Add glow animation variants
  const glowVariants = {
    initial: { opacity: 0.5, scale: 0.95 },
    animate: { opacity: 1, scale: 1.05 },
  };

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
          dispatch(setUser(userData));
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
    try {
      setLoading(true);
      const action = isSignup 
        ? signupUser({ email, password, name })
        : loginUser({ email, password });
      
      const response = await dispatch(action);
      if (response?.success) navigate("/dash");
      else setError(isSignup ? "Signup failed" : "Invalid credentials");
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative p-8 bg-gradient-to-br from-blue-600 via-purple-700 to-pink-500 overflow-hidden">
     
      
      {/* Floating Logo */}
      {/* <motion.div   (Not needed, removing as per Aryan sir's instruction)
        initial={{ y: 0 }}
        animate={{
          y: [-10, 10, -10],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -top-1 left-[42%] -translate-x-1/2 z-999"
      >
        <img 
          src="/Images/logo_genwrite.png" 
          alt="Logo" 
          className="w-60 drop-shadow-2xl" 
        />
      </motion.div> */}

      {/* Main Card */}
      <div className="flex items-center -mt-3 justify-center min-h-screen">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
          className="w-full max-w-md bg-white/10 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.18)] border border-white/20 p-8 relative overflow-hidden"
        >
          {/* Card inner glow */}
          <div className="absolute inset-0 rounded-2xl shadow-[inset_0_0_20px_rgba(255,255,255,0.1)]" />
          
          {/* Header */}
          <motion.div
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            className="mb-8 text-center"
          >
            <h1 className="text-3xl font-bold text-white drop-shadow-md">
              {isSignup ? "Create Account" : "Welcome Back"}
            </h1>
            <p className="text-white/80 mt-2 tracking-wide">
              {isSignup ? "Get started with GenWrite" : "Continue your AI writing journey"}
            </p>
          </motion.div>

          {/* Google Button */}
          <motion.button
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-6 bg-white/10 hover:bg-white/20 border-2 border-white/20 rounded-xl text-white hover:border-white/40 transition-all mb-8 group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity -translate-x-full group-hover:translate-x-full duration-300" />
            <FcGoogle className="text-xl bg-white rounded-full" />
            <span className="font-medium tracking-wide">
              {isSignup ? "Sign up with Google" : "Sign in with Google"}
            </span>
          </motion.button>

          {/* Divider */}
          <div className="flex items-center my-8">
            <hr className="flex-1 border-white/20" />
            <span className="px-4 text-white/70 text-sm tracking-wide">or continue with email</span>
            <hr className="flex-1 border-white/20" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {isSignup && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="relative"
              >
                <FaUser className="absolute top-4 left-4 text-white/70" />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder-white/60 focus:border-white/40 focus:bg-white/20 outline-none transition-all focus:ring-2 focus:ring-white/30"
                />
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative"
            >
              <FaEnvelope className="absolute top-4 left-4 text-white/70" />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder-white/60 focus:border-white/40 focus:bg-white/20 outline-none transition-all focus:ring-2 focus:ring-white/30"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative"
            >
              <FaLock className="absolute top-4 left-4 text-white/70" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-12 pr-12 py-3 bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder-white/60 focus:border-white/40 focus:bg-white/20 outline-none transition-all focus:ring-2 focus:ring-white/30"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-4 text-white/70 hover:text-white/90 transition-colors"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </motion.div>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-red-300 text-center text-sm tracking-wide"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button
  whileHover={{ 
    y: -2,
    scale: 1.02,
    background: "linear-gradient(45deg, #6366f1, #8b5cf6, #ec4899)",
    boxShadow: "0 4px 20px rgba(99, 102, 241, 0.3)"
  }}
  whileTap={{ scale: 0.98 }}
  type="submit"
  disabled={loading}
  className={`w-full py-3.5 px-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl transition-all relative overflow-hidden group ${
    loading ? "opacity-70 cursor-not-allowed" : ""
  }`}
>
  {/* Animated shine effect */}
  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity -translate-x-full group-hover:translate-x-full duration-300" />

  {/* Text with loading animation */}
  {loading ? (
    <div className="flex items-center justify-center gap-2">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity }}
        className="w-5 h-5 border-2 border-white/50 rounded-full border-t-transparent"
      />
      Processing...
    </div>
  ) : isSignup ? (
    "Create Account"
  ) : (
    "Sign In"
  )}
</motion.button>
          </form>

          {/* Bottom Link */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-white/80 mt-6 tracking-wide"
          >
            {isSignup ? "Already have an account? " : "Don't have an account? "}
            <Link
              to={isSignup ? "/login" : "/signup"}
              className="text-white font-semibold hover:text-white/90 transition-colors relative group"
            >
              {isSignup ? "Sign in" : "Sign up"}
              <span className="absolute bottom-0 left-0 w-0 h-px bg-white group-hover:w-full transition-all duration-300" />
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;