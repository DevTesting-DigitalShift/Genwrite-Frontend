import { createSlice } from "@reduxjs/toolkit";
import { login, signup, Userlogout, loadUser } from "@api/authApi";
import { getProfile } from "@api/userApi";

const initialState = {
  user: null,
  token: localStorage.getItem("token") || null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem("token");
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const { setUser, logout, setLoading, setError } = authSlice.actions;
export default authSlice.reducer;

// ───────────────────────────────────────────────────────────────
// 🔐 Thunk: Login
export const loginUser = ({ email, password }) => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    const data = await login(email, password);
    if (data.token) {
      localStorage.setItem("token", data.token);
      dispatch(setUser({ user: data.user, token: data.token }));
    }
    return { success: true };
  } catch (error) {
    dispatch(setError("Login failed"));
    console.error("Login error:", error);
    return { success: false };
  } finally {
    dispatch(setLoading(false));
  }
};

// 📝 Thunk: Signup
export const signupUser = ({ email, password, name }) => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    const data = await signup(email, password, name);
    if (data.token) {
      localStorage.setItem("token", data.token);
      dispatch(setUser({ user: data.user, token: data.token }));
    }
    return { success: true };
  } catch (error) {
    dispatch(setError("Signup failed"));
    console.error("Signup error:", error);
    return { success: false };
  } finally {
    dispatch(setLoading(false));
  }
};

// 🚪 Thunk: Logout
export const logoutUser = (navigate) => async (dispatch) => {
  try {
    await Userlogout();
  } catch (error) {
    console.warn("Logout error (ignored)", error);
  }

  dispatch(logout());
  navigate("/login");
};

// 🧠 Thunk: Load User (fix for Google login)
export const loadAuthenticatedUser = () => async (dispatch) => {
  const token = localStorage.getItem("token");
  if (!token) return;

  dispatch(setLoading(true));
  try {
    const data = await loadUser(); // or getProfile() if needed
    if (data.success && data.user) {
      dispatch(setUser({ user: data.user, token }));
    }
  } catch (error) {
    dispatch(setError("Failed to load user"));
    console.error("Auth reload error:", error);
  } finally {
    dispatch(setLoading(false));
  }
};

// 🧠 Thunk: Get Profile (optional if loadUser doesn't exist)
export const getUser = () => async (dispatch) => {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const { user } = await getProfile();
    dispatch(setUser({ user, token }));
  } catch (error) {
    console.error("Get profile error:", error);
    dispatch(setError("Failed to fetch profile"));
  }
};

// 📦 Optional: Selectors
export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectToken = (state) => state.auth.token;
export const selectAuthLoading = (state) => state.auth.loading;
