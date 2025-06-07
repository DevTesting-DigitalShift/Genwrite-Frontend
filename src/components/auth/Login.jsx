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
    <div className="min-h-screen relative p-8 bg-gradient-to-r from-gray-300 via-gray-100 to-gray-300 overflow-hidden">
      {/* Logo */}
      <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 z-10">
        <img 
          src="/Images/logo_genwrite_2.png" 
          alt="Logo" 
          className="w-48 scale-150" 
        />
      </div>

      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
          className="w-full max-w-md bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-300 p-8 relative"
        >
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-800">
              {isSignup ? "Create Account" : "Welcome Back"}
            </h1>
            <p className="text-gray-600 mt-2">
              {isSignup ? "Get started with GenWrite" : "Continue your AI writing journey"}
            </p>
          </div>

          {/* Google Button */}
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-6 bg-white border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all mb-6"
          >
            <FcGoogle className="text-xl" />
            <span className="font-medium">
              {isSignup ? "Sign up with Google" : "Sign in with Google"}
            </span>
          </motion.button>

          {/* Divider */}
          <div className="flex items-center my-6">
            <hr className="flex-1 border-gray-300" />
            <span className="px-4 text-gray-500 text-sm">or continue with email</span>
            <hr className="flex-1 border-gray-300" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignup && (
              <div className="relative">
                <FaUser className="absolute top-4 left-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                />
              </div>
            )}

            <div className="relative">
              <FaEnvelope className="absolute top-4 left-4 text-gray-400" />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              />
            </div>

            <div className="relative">
              <FaLock className="absolute top-4 left-4 text-gray-400 mb-2" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 transition-colors"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            {/* {!isSignup && (
              <div className="text-right">
                <Link to="/forgot-password" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  Forget?
                </Link>
              </div>
            )} */}

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-red-500 text-center text-sm "
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 px-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-semibold rounded-xl transition-all  ${
                loading ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2 mt-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="w-5 h-5 border-2 border-white/50 rounded-full border-t-transparent"
                  />
                  Processing...
                </div>
              ) : isSignup ? (
                <span >Sign Up</span>
              ) : (
                "Sign In"
              )}
            </motion.button>
          </form>

          {/* Bottom Link */}
          <p className="text-center text-gray-600 mt-6">
            {isSignup ? "Already have an account? " : "Don't have an account? "}
            <Link
              to={isSignup ? "/login" : "/signup"}
              className="text-blue-600 font-semibold hover:text-blue-800 transition-colors"
            >
              {isSignup ? "Sign in" : "Sign up"}
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;