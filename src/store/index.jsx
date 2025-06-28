import { configureStore } from "@reduxjs/toolkit"
import authReducer from "./slices/authSlice"
import blogReducer from "./slices/blogSlice"
import userReducer from "./slices/userSlice"
import jobsReducer from "./slices/jobSlice"
import brandReducer from "./slices/brandSlice"
import analysisReducer from "./slices/analysisSlice"
import otherReducer from "./slices/otherSlice"
import gscReducer from "./slices/gscSlice"

export const store = configureStore({
  reducer: {
    auth: authReducer,
    blog: blogReducer,
    user: userReducer,
    jobs: jobsReducer,
    brand: brandReducer,
    analysis: analysisReducer,
    other: otherReducer,
    gsc: gscReducer,
  },
})
