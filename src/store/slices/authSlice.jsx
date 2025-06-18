import { createSlice } from "@reduxjs/toolkit";
import { loadUser, login, signup, Userlogout } from "@api/authApi";
import { getProfile } from "@api/userApi";

const initialState = {
  user: null,
  token: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action) => {
      if (action.payload.user) {
        state.user = action.payload.user;
        state.token = action.payload.token;
      } else {
        state.user = action.payload;
        state.token = localStorage.getItem("token");
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
    },
  },
});

export const { setUser, logout } = authSlice.actions;

export const loginUser =
  ({ email, password }) =>
  async (dispatch) => {
    try {
      const data = await login(email, password);
      if (data.token) {
        if (data.token) {
          localStorage.setItem("token", data.token);
        }
        await dispatch(setUser({ user: data.user, token: data.token }));
      }
      return { success: true };
    } catch (error) {
      console.error(error);
      return { success: false };
    }
  };

export const signupUser =
  ({ email, password, name }) =>
  async (dispatch) => {
    try {
      const data = await signup(email, password, name);
      if (data.token) {
        localStorage.setItem("token", data.token);
        await dispatch(setUser({ user: data.user, token: data.token }));
      }
      return { success: true };
    } catch (error) {
      console.error(error);
      return { success: false };
    }
  };

export const logoutUser = (navigate) => async (dispatch) => {
  try {
    const data = await Userlogout();
    if (data.success) {
      localStorage.removeItem("token");
      dispatch(logout());
      navigate("/login");
    }
    return { success: true };
  } catch (error) {
    console.error(error);
  }
};

// [s ] check the cause for showing nan credits & no user data on login via google at first but available after refresh or first polling
export const load = () => async (dispatch) => {
  try {
    const data = await loadUser();
    if (data.success) {
      const token = localStorage.getItem("token");
      if (token) {
        dispatch(setUser({ user: data.user, token }));
      }
    }
  } catch (error) {
    console.error(error);
  }
};

// [ ] call the load api once user is signed in 

export const getUser = () => async (dispatch) => {
  try {
    const token = localStorage.getItem("token");
    if (token) {
      const { user } = await getProfile();
      dispatch(setUser({ user, token }));
    }
  } catch (error) {
    console.error("Get user error:", error);
  }
};

export default authSlice.reducer;
