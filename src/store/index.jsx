import { configureStore } from "@reduxjs/toolkit"
import authReducer from "./slices/authSlice"
import blogReducer from "./slices/blogSlice"
import userReducer from "./slices/userSlice"
import jobsReducer from "./slices/jobSlice"
import brandReducer from "./slices/brandSlice"
import analysisReducer from "./slices/analysisSlice"
import wordpressReducer from "./slices/otherSlice"
import gscReducer from "./slices/gscSlice"
import humanizeReducer from "./slices/humanizeSlice"
import creditLogsReducer from "./slices/creditLogSlice"

export const store = configureStore({
  reducer: {
    auth: authReducer,
    blog: blogReducer,
    user: userReducer,
    jobs: jobsReducer,
    brand: brandReducer,
    analysis: analysisReducer,
    wordpress: wordpressReducer,
    gsc: gscReducer,
    humanize: humanizeReducer,
    creditLogs: creditLogsReducer,
  },
})
