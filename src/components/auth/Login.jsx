import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import GoogleButton from "react-google-button";
import { FaEnvelope, FaLock } from "react-icons/fa";
import { loginUser, signupUser, setUser } from "../../store/slices/authSlice";
import { unwrapResult } from "@reduxjs/toolkit";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import axiosInstance from "@api/index";

const Auth = ({ path }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
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

          // Ensure we have the complete user data
          const userData = {
            _id: response.data.user._id,
            name: response.data.user.name,
            email: response.data.user.email,
            avatar: response.data.user.avatar,
            interests: response.data.user.interests || [],
          };

          // Dispatch the user data to Redux immediately
          dispatch(setUser(userData));

          // Navigate to dashboard
          navigate("/dash");
        } else {
          throw new Error(response.data.message || "Invalid response from server");
        }
      } catch (error) {
        console.error("Google login error:", error);
        setError("Google login failed. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    onError: (error) => {
      console.error("Google OAuth error:", error);
      setError("Google login failed to initialize. Please try again.");
      setLoading(false);
    },
  });

  useEffect(() => {
    setIsSignup(path === "signup");
  }, [path]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (path === "login") {
        const response = await dispatch(loginUser({ email, password }));
        console.log(response, "resp");
        if (response?.success) {
          setLoading(false);
          navigate("/dash");
        }
      } else {
        const response = await dispatch(signupUser({ email, password, name }));
        if (response?.success) {
          setLoading(false);
          navigate("/dash");
        }
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-6 bg-gradient-to-r from-blue-500 to-purple-600">
      <div className="mb-1 animate-bounce">
        <img
          src="/Images/logo_genwrite.png"
          alt="Logo"
          width={250}
          height={80}
          loading="lazy"
          className="pl-4"
        />
      </div>
      <div className="max-w-md w-full p-8 bg-white shadow-lg rounded-lg">
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
          {isSignup ? "Sign Up" : "Login"} now
        </h2>
        <div className="mb-6 flex justify-center flex-col items-center">
          <p className="text-center text-gray-600 mb-4">
            {isSignup ? "Sign up with your account" : "Login with your account"}:
          </p>
          <GoogleButton onClick={handleGoogleLogin} className="w-full" />
        </div>
        <div className="flex items-center my-4">
          <hr className="flex-grow border-t border-gray-300" />
          <span className="px-3 text-gray-500 bg-white">Or</span>
          <hr className="flex-grow border-t border-gray-300" />
        </div>
        <form onSubmit={handleSubmit}>
          {isSignup && (
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                Name
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="name"
                type="text"
                placeholder="Enter your name"
                value={name}
                disabled={loading}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
              Email
            </label>
            <div className="relative">
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline pl-10"
                id="email"
                type="email"
                placeholder="Enter your email"
                required
                value={email}
                disabled={loading}
                onChange={(e) => setEmail(e.target.value)}
              />
              <FaEnvelope className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline pl-10"
                id="password"
                type="password"
                placeholder="Enter your password"
                required
                value={password}
                disabled={loading}
                onChange={(e) => setPassword(e.target.value)}
              />
              <FaLock className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <input type="checkbox" id="remember" className="mr-2" />
              <label htmlFor="remember" className="text-sm text-gray-600">
                Remember me
              </label>
            </div>
            <a href="#" className="text-sm text-blue-500 hover:text-blue-800">
              Forgot password?
            </a>
          </div>
          <button
            disabled={loading}
            className={`${
              loading ? "animate-pulse" : ""
            } bg-blue-500  hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full`}
            type="submit"
          >
            {isSignup ? (loading ? "Signing In" : "Sign Up") : loading ? "Signing In" : "Sign In"}
          </button>
        </form>
      </div>
      <p className="mt-8 text-center text-gray-300">
        {isSignup ? "Already have an account? " : "Don't have an account? "}
        <Link
          to={isSignup ? "/login" : "/signup"}
          className={`${loading ? "hidden" : ""} font-bold hover:underline`}
        >
          {isSignup ? "Login" : "Sign up"}
        </Link>
      </p>
    </div>
  );
};

export default Auth;
