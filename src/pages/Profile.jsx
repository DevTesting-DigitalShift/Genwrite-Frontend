import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  CreditCardIcon,
  BanknotesIcon,
  CheckIcon,
  ShieldCheckIcon,
  LockClosedIcon,
  UserGroupIcon,
  EnvelopeIcon,
  ShareIcon,
  ClipboardDocumentIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/solid"
import { isEqual } from "lodash-es"
import { useSelector, useDispatch } from "react-redux"
import { loadAuthenticatedUser } from "@store/slices/authSlice"
import { DatePicker, message, Select, Tag, Tooltip, Switch } from "antd"
import dayjs from "dayjs"
import { Helmet } from "react-helmet"
import { updateProfile } from "@store/slices/userSlice"
import PasswordModal from "@components/PasswordModal"
import {
  updatePasswordAPI,
  getReferralStatsAPI,
  generateReferralCodeAPI,
  getEmailPreferencesAPI,
  updateEmailPreferencesAPI,
} from "@api/userApi"

const DEMO_PROFILE = {
  profilePicture: "",
  personalDetails: {
    name: "eg : Siva Dheeraj",
    email: "eg : sivadheeraj@example.com",
    phone: "eg : +91 9990292929",
    bio: "eg : Lead Product Designer",
    jobTitle: "eg : Senior UX Engineer",
    company: "eg : Tech Innovators Inc",
    dob: "eg : 1990-05-15",
    interests: ["technology", "art"],
  },
}

const INTEREST_OPTIONS = [
  { value: "technology", label: "Technology", color: "#1890ff" },
  { value: "sports", label: "Sports", color: "#52c41a" },
  { value: "music", label: "Music", color: "#722ed1" },
  { value: "art", label: "Art", color: "#eb2f96" },
  { value: "other", label: "Other", color: "#fa8c16" },
]

const PLAN_COLORS = {
  free: "from-gray-500 to-gray-600",
  basic: "from-blue-500 to-blue-600",
  pro: "from-purple-500 to-purple-600",
  enterprise: "from-yellow-500 to-yellow-600",
}

const STATUS_COLORS = {
  active: "bg-green-500",
  canceled: "bg-red-500",
  past_due: "bg-orange-500",
  unpaid: "bg-red-600",
}

const Profile = () => {
  const [profileData, setProfileData] = useState(DEMO_PROFILE)
  const [initialProfileData, setInitialProfileData] = useState(null)
  const { user } = useSelector(state => state.auth)
  const dispatch = useDispatch()
  const [passwordModalVisible, setPasswordModalVisible] = useState(false)
  const [referralStats, setReferralStats] = useState({ totalJoined: 0, converted: 0 })
  const [emailPreferences, setEmailPreferences] = useState({
    promotionalEmails: false,
    newFeatureUpdates: false,
    accountAlerts: false,
  })
  const [referralCode, setReferralCode] = useState("")

  useEffect(() => {
    dispatch(loadAuthenticatedUser())
  }, [dispatch])

  const totalCredits = (user?.credits?.base ?? 0) + (user?.credits?.extra ?? 0)

  useEffect(() => {
    if (!user) return

    const initialData = {
      profilePicture: user.avatar || "",
      personalDetails: {
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        bio: user.bio || "",
        jobTitle: user.jobTitle || "",
        company: user.company || "",
        dob: user.dob || "",
        interests: user.interests || ["other"],
      },
      subscription: {
        plan: user.subscription?.plan || "free",
        status: user.subscription?.status || "active",
      },
      emailVerified: user.emailVerified || false,
    }

    setProfileData(initialData)
    setInitialProfileData(initialData)

    if (user.referral?.referralId) {
      setReferralCode(user.referral.referralId)
    }
  }, [user])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, prefsRes] = await Promise.all([
          getReferralStatsAPI(),
          getEmailPreferencesAPI(),
        ])
        setReferralStats(statsRes)
        if (prefsRes.emailPreference) {
          setEmailPreferences(prev => ({ ...prev, ...prefsRes.emailPreference }))
        }
      } catch (error) {
        console.error("Failed to fetch additional profile data", error)
      }
    }

    if (user) {
      fetchData()
    }
  }, [user])

  const handleSave = async () => {
    if (!initialProfileData) return

    const changes = {}

    // Helper to check for changes
    if (profileData.profilePicture !== initialProfileData.profilePicture) {
      changes.avatar = profileData.profilePicture
    }

    const pd = profileData.personalDetails
    const ipd = initialProfileData.personalDetails

    if (pd.name !== ipd.name) changes.name = pd.name
    if (pd.bio !== ipd.bio) changes.bio = pd.bio
    if (pd.email !== ipd.email) changes.email = pd.email
    if (pd.phone !== ipd.phone) changes.phone = pd.phone
    if (pd.jobTitle !== ipd.jobTitle) changes.jobTitle = pd.jobTitle
    if (pd.company !== ipd.company) changes.company = pd.company
    if (pd.dob !== ipd.dob) changes.dob = pd.dob

    if (!isEqual(pd.interests, ipd.interests)) {
      changes.interests = pd.interests
    }

    if (Object.keys(changes).length === 0) {
      message.info("No changes to save")
      return
    }

    try {
      await dispatch(updateProfile(changes)).unwrap()
      message.success("Profile updated successfully!")
    } catch (err) {
      message.error("Error updating profile, try again")
    }
  }

  const handleInputChange = e => {
    const { name, value } = e.target

    if (name === "personalDetails.phone") {
      const numericValue = value.replace(/[^0-9]/g, "")
      if (numericValue.length > 15) {
        message.error("Phone number cannot exceed 15 digits.")
        return
      }
      setProfileData(prev => ({
        ...prev,
        personalDetails: { ...prev.personalDetails, phone: numericValue },
      }))
    } else if (name.startsWith("personalDetails.")) {
      setProfileData(prev => ({
        ...prev,
        personalDetails: { ...prev.personalDetails, [name.split(".")[1]]: value },
      }))
    }
  }

  const handleInterestsChange = selectedInterests => {
    setProfileData(prev => ({
      ...prev,
      personalDetails: { ...prev.personalDetails, interests: selectedInterests },
    }))
  }

  const handlePasswordSubmit = async values => {
    try {
      const payload = user?.hasPassword
        ? { oldPassword: values.oldPassword, newPassword: values.newPassword }
        : { newPassword: values.newPassword }

      const response = await updatePasswordAPI(payload)

      if (!response.success) {
        throw new Error(response.message || "Failed to update password")
      }

      // Reload user data to update hasPassword status
      dispatch(loadAuthenticatedUser())
    } catch (error) {
      throw error
    }
  }

  const handleGenerateReferral = async () => {
    try {
      const res = await generateReferralCodeAPI()
      setReferralCode(res.referralId)
      message.success("Referral code generated!")
      // Update user in store to reflect new referral code
      dispatch(loadAuthenticatedUser())
    } catch (error) {
      message.error("Failed to generate referral code")
    }
  }

  const copyReferralCode = () => {
    if (!referralCode) return
    const baseUrl = import.meta.env.VITE_FRONTEND_URL || window.location.origin
    const referralLink = `${baseUrl}/signup?referal=${referralCode}`
    navigator.clipboard.writeText(referralLink)
    message.success("Referral link copied to clipboard!")
  }

  const handleEmailPreferenceChange = async (key, checked) => {
    const newPrefs = { ...emailPreferences, [key]: checked }
    setEmailPreferences(newPrefs) // Optimistic update
    try {
      await updateEmailPreferencesAPI({ emailPreference: newPrefs })
      message.success("Preferences updated")
    } catch (error) {
      setEmailPreferences(emailPreferences) // Revert on failure
      message.error("Failed to update preferences")
    }
  }

  return (
    <>
      <Helmet>
        <title>Profile | GenWrite</title>
      </Helmet>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen p-3 sm:p-4 md:p-6 mt-5"
      >
        <div className="max-w-4xl mx-auto">
          {/* Header Card */}
          <motion.div
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 md:p-8 mb-4 sm:mb-6"
          >
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Profile Picture */}
              <div className="flex-shrink-0">
                {profileData?.profilePicture ? (
                  <img
                    src={profileData.profilePicture}
                    alt="Profile"
                    className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full border-4 border-gray-100 object-cover shadow-md"
                  />
                ) : (
                  <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full border-4 border-gray-100 bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center text-4xl sm:text-5xl font-bold shadow-md">
                    {profileData?.personalDetails?.name
                      ? `${profileData?.personalDetails.name[0]?.toUpperCase()}`
                      : "NA"}
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center sm:items-start justify-center sm:justify-start gap-2 mb-2">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {profileData.personalDetails.name || "Full Name"}
                  </h1>
                  {profileData.emailVerified && (
                    <Tooltip title="Email Verified">
                      <ShieldCheckIcon className="w-5 h-5 mt-2 sm:w-6 sm:h-6 text-blue-500" />
                    </Tooltip>
                  )}
                </div>
                <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4 line-clamp-2">
                  {profileData.personalDetails.bio || "Add your bio"}
                </p>
                <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                  <span
                    className={`px-3 sm:px-4 py-1 sm:py-1.5 bg-gradient-to-r ${
                      PLAN_COLORS[profileData.subscription?.plan] || PLAN_COLORS.free
                    } text-white rounded-full text-xs sm:text-sm font-medium capitalize`}
                  >
                    <CreditCardIcon className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
                    {profileData.subscription?.plan || "free"}
                  </span>
                  <span className="px-3 sm:px-4 py-1 sm:py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs sm:text-sm font-medium">
                    <BanknotesIcon className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
                    {totalCredits} Credits
                  </span>
                  <span
                    className={`px-3 sm:px-4 py-1 sm:py-1.5 ${
                      STATUS_COLORS[profileData.subscription?.status] || STATUS_COLORS.active
                    } text-white rounded-full text-xs sm:text-sm font-medium capitalize`}
                  >
                    {profileData.subscription?.status || "active"}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Personal Details Card */}
          <motion.div
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 md:p-8"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                <UserGroupIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
                Personal Details
              </h2>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setPasswordModalVisible(true)}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <LockClosedIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  {user?.hasPassword ? "Change Password" : "Set Password"}
                </button>
                <button
                  onClick={handleSave}
                  disabled={!initialProfileData || isEqual(profileData, initialProfileData)}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  Save Changes
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <ProfileField
                label="Full Name"
                name="personalDetails.name"
                value={profileData.personalDetails.name}
                onChange={handleInputChange}
                placeholder={DEMO_PROFILE.personalDetails.name}
              />

              <ProfileField
                label="Email"
                name="personalDetails.email"
                value={profileData.personalDetails.email}
                onChange={handleInputChange}
                placeholder={DEMO_PROFILE.personalDetails.email}
                disabled={true}
              />

              <ProfileField
                label="Phone"
                name="personalDetails.phone"
                value={profileData.personalDetails.phone}
                onChange={handleInputChange}
                placeholder={DEMO_PROFILE.personalDetails.phone}
                maxLength={15}
              />

              <ProfileField
                label="Job Title"
                name="personalDetails.jobTitle"
                value={profileData.personalDetails.jobTitle}
                onChange={handleInputChange}
                placeholder={DEMO_PROFILE.personalDetails.jobTitle}
              />

              <ProfileField
                label="Company"
                name="personalDetails.company"
                value={profileData.personalDetails.company}
                onChange={handleInputChange}
                placeholder={DEMO_PROFILE.personalDetails.company}
              />

              {/* Date of Birth */}
              <div className="space-y-2">
                <label className="block text-xs sm:text-sm font-medium text-gray-700">
                  Date of Birth
                </label>
                <DatePicker
                  format="YYYY-MM-DD"
                  value={
                    profileData.personalDetails.dob ? dayjs(profileData.personalDetails.dob) : null
                  }
                  onChange={(date, dateString) =>
                    handleInputChange({
                      target: { name: "personalDetails.dob", value: dateString },
                    })
                  }
                  className="w-full"
                  size="large"
                  placeholder={DEMO_PROFILE.personalDetails.dob}
                  disabledDate={current => current && current > dayjs().endOf("day")}
                />
              </div>

              {/* Bio - Full Width */}
              <div className="sm:col-span-2 space-y-2">
                <label className="block text-xs sm:text-sm font-medium text-gray-700">Bio</label>
                <textarea
                  name="personalDetails.bio"
                  value={profileData.personalDetails.bio || ""}
                  onChange={handleInputChange}
                  placeholder="Tell us about yourself..."
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none text-sm sm:text-base"
                  rows={4}
                />
              </div>

              {/* Interests - Full Width */}
              <div className="sm:col-span-2 space-y-2">
                <label className="block text-xs sm:text-sm font-medium text-gray-700">
                  Interests
                </label>
                <Select
                  mode="multiple"
                  value={profileData.personalDetails.interests}
                  onChange={handleInterestsChange}
                  className="w-full"
                  placeholder="Select your interests"
                  options={INTEREST_OPTIONS}
                  maxTagCount="responsive"
                  size="large"
                />
              </div>
            </div>
          </motion.div>

          {/* Referral Program Card */}
          <motion.div
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 md:p-8 mt-6"
          >
            <div className="flex items-center gap-2 mb-6">
              <ShareIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Referral Program</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <p className="text-gray-600 text-sm">
                  Share your referral code with friends and earn rewards when they subscribe.
                </p>
                {referralCode ? (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-mono text-lg font-bold text-gray-800 tracking-wider">
                      {referralCode}
                    </div>
                    <button
                      onClick={copyReferralCode}
                      className="p-3 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                      title="Copy Code"
                    >
                      <ClipboardDocumentIcon className="w-6 h-6" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleGenerateReferral}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-shadow"
                  >
                    <ArrowPathIcon className="w-5 h-5" />
                    Generate Referral Code
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {referralStats.totalJoined}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 font-medium">Referred Users</div>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-1">
                    {referralStats.converted}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 font-medium">Converted</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Email Preferences Card */}
          <motion.div
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 md:p-8 mt-6 mb-6"
          >
            <div className="flex items-center gap-2 mb-6">
              <EnvelopeIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Email Notifications</h2>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Account Alerts</h3>
                  <p className="text-sm text-gray-500">
                    Get notified about important security changes.
                  </p>
                </div>
                <Switch
                  checked={emailPreferences.accountAlerts}
                  disabled
                  onChange={checked => handleEmailPreferenceChange("accountAlerts", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Promotions & Offers</h3>
                  <p className="text-sm text-gray-500">
                    Receive emails about new discounts and deals.
                  </p>
                </div>
                <Switch
                  checked={emailPreferences.promotionalEmails}
                  onChange={checked => handleEmailPreferenceChange("promotionalEmails", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Feature Updates</h3>
                  <p className="text-sm text-gray-500">
                    Stay informed about new features and improvements.
                  </p>
                </div>
                <Switch
                  checked={emailPreferences.newFeatureUpdates}
                  onChange={checked => handleEmailPreferenceChange("newFeatureUpdates", checked)}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <PasswordModal
        visible={passwordModalVisible}
        onClose={() => setPasswordModalVisible(false)}
        hasPassword={user?.hasPassword || false}
        onSubmit={handlePasswordSubmit}
      />
    </>
  )
}

const ProfileField = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  maxLength,
  disabled = false,
}) => (
  <div className="space-y-2">
    <label className="block text-xs sm:text-sm font-medium text-gray-700">{label}</label>
    <input
      type={name === "personalDetails.phone" ? "tel" : "text"}
      name={name}
      value={value || ""}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:bg-gray-50 disabled:cursor-not-allowed text-sm sm:text-base"
      maxLength={maxLength}
      pattern={name === "personalDetails.phone" ? "[0-9]*" : undefined}
      disabled={disabled}
    />
  </div>
)

export default Profile
