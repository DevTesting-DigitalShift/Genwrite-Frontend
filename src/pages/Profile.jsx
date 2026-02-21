import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  CreditCard,
  Check,
  ShieldCheck,
  Lock,
  Users,
  Mail,
  Share2,
  Copy,
  User,
  Phone,
  Briefcase,
  Building2,
  Calendar,
  Heart,
  Camera,
  ChevronRight,
  Info,
  Type,
  Layout,
  Clock,
  Coins,
  Minus,
  X,
} from "lucide-react"
import isEqual from "lodash-es/isEqual"
import useAuthStore from "@store/useAuthStore"
import { useUpdateProfileMutation } from "@api/queries/userQueries"
import dayjs from "dayjs"
import { Helmet } from "react-helmet"
import PasswordModal from "@components/PasswordModal"
import {
  updatePasswordAPI,
  getReferralStatsAPI,
  generateReferralCodeAPI,
  getEmailPreferencesAPI,
  updateEmailPreferencesAPI,
} from "@api/userApi"
import toast from "@utils/toast"

const INTEREST_OPTIONS = [
  { value: "technology", label: "Technology" },
  { value: "sports", label: "Sports" },
  { value: "music", label: "Music" },
  { value: "art", label: "Art" },
  { value: "other", label: "Other" },
]

const Profile = () => {
  const { user, loadAuthenticatedUser } = useAuthStore()
  const { mutateAsync: updateProfileMutate } = useUpdateProfileMutation()

  const [profileData, setProfileData] = useState({
    profilePicture: "",
    personalDetails: {
      name: "",
      email: "",
      phone: "",
      bio: "",
      jobTitle: "",
      company: "",
      dob: "",
      interests: [],
    },
    subscription: { plan: "free", status: "active" },
    emailVerified: false,
  })
  const [initialProfileData, setInitialProfileData] = useState(null)
  const [passwordModalVisible, setPasswordModalVisible] = useState(false)
  const [referralStats, setReferralStats] = useState({ totalJoined: 0, converted: 0 })
  const [referralCode, setReferralCode] = useState("")
  const [emailPreferences, setEmailPreferences] = useState({
    promotionalEmails: false,
    newFeatureUpdates: false,
    accountAlerts: false,
  })

  useEffect(() => {
    loadAuthenticatedUser()
  }, [loadAuthenticatedUser])

  useEffect(() => {
    if (!user) return
    const data = {
      profilePicture: user.avatar || "",
      personalDetails: {
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        bio: user.bio || "",
        jobTitle: user.jobTitle || "",
        company: user.company || "",
        dob: user.dob ? dayjs(user.dob).format("YYYY-MM-DD") : "",
        interests: user.interests || ["other"],
      },
      subscription: {
        plan: user.subscription?.plan || "free",
        status: user.subscription?.status || "active",
      },
      emailVerified: user.emailVerified || false,
    }
    setProfileData(data)
    setInitialProfileData(data)
    if (user.referral?.referralId) setReferralCode(user.referral.referralId)
  }, [user])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, prefsRes] = await Promise.all([
          getReferralStatsAPI(),
          getEmailPreferencesAPI(),
        ])
        setReferralStats(statsRes)
        if (prefsRes.emailPreference)
          setEmailPreferences(prev => ({ ...prev, ...prefsRes.emailPreference }))
      } catch (error) {
        console.error(error)
      }
    }
    if (user) fetchData()
  }, [user])

  const handleSave = async () => {
    if (!initialProfileData) return
    const changes = {}
    if (profileData.profilePicture !== initialProfileData.profilePicture)
      changes.avatar = profileData.profilePicture
    const pd = profileData.personalDetails,
      ipd = initialProfileData.personalDetails
    if (pd.name !== ipd.name) changes.name = pd.name
    if (pd.bio !== ipd.bio) changes.bio = pd.bio
    if (pd.phone !== ipd.phone) changes.phone = pd.phone
    if (pd.jobTitle !== ipd.jobTitle) changes.jobTitle = pd.jobTitle
    if (pd.company !== ipd.company) changes.company = pd.company
    if (pd.dob !== ipd.dob) changes.dob = pd.dob
    if (!isEqual(pd.interests, ipd.interests)) changes.interests = pd.interests

    if (Object.keys(changes).length === 0) {
      toast.info("No changes detected")
      return
    }

    try {
      await updateProfileMutate(changes)
      toast.success("Profile synchronized successfully!")
      setInitialProfileData(profileData)
    } catch (err) {
      toast.error("Update failed. Try again.")
    }
  }

  const handleInputChange = e => {
    const { name, value } = e.target
    if (name === "personalDetails.phone") {
      const numericValue = value.replace(/[^0-9]/g, "").slice(0, 15)
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

  const toggleInterest = val => {
    setProfileData(prev => {
      const current = prev.personalDetails.interests
      const updated = current.includes(val) ? current.filter(i => i !== val) : [...current, val]
      return { ...prev, personalDetails: { ...prev.personalDetails, interests: updated } }
    })
  }

  const handlePasswordSubmit = async values => {
    try {
      const payload = user?.hasPassword
        ? { oldPassword: values.oldPassword, newPassword: values.newPassword }
        : { newPassword: values.newPassword }
      const res = await updatePasswordAPI(payload)
      if (!res.success) throw new Error(res.message)
      toast.success("Password updated successfully")
      loadAuthenticatedUser()
    } catch (error) {
      throw error
    }
  }

  const handleGenerateReferral = async () => {
    try {
      const res = await generateReferralCodeAPI()
      setReferralCode(res.referralId)
      toast.success("Referral program enabled!")
      loadAuthenticatedUser()
    } catch (error) {
      toast.error("Referral generation failed")
    }
  }

  const copyReferralCode = () => {
    if (!referralCode) return
    const link = `${window.location.origin}/signup?referal=${referralCode}`
    navigator.clipboard.writeText(link)
    toast.success("Affiliate link copied!")
  }

  const handleEmailPreferenceChange = async (key, checked) => {
    const newPrefs = { ...emailPreferences, [key]: checked }
    setEmailPreferences(newPrefs)
    try {
      await updateEmailPreferencesAPI({ emailPreference: newPrefs })
      toast.success("Preferences saved")
    } catch (error) {
      setEmailPreferences(emailPreferences)
      toast.error("Preference update failed")
    }
  }

  const isChanged = !initialProfileData || !isEqual(profileData, initialProfileData)

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 lg:p-12 mb-20 font-sans antialiased text-slate-800">
      <Helmet>
        <title>Profile Settings | GenWrite</title>
      </Helmet>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-8 shadow-sm border border-slate-200"
        >
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Avatar Section */}
            <div className="relative group">
              <div className="w-32 h-32 rounded-full border-4 border-slate-50 shadow-md overflow-hidden bg-slate-100 flex items-center justify-center text-4xl font-semibold text-slate-400">
                {profileData.profilePicture ? (
                  <img
                    src={profileData.profilePicture}
                    className="w-full h-full object-cover"
                    alt="Profile"
                  />
                ) : (
                  profileData.personalDetails.name?.[0] || <User size={48} />
                )}
              </div>
              <button className="absolute bottom-1 right-1 bg-white p-2 rounded-full shadow-lg border border-slate-100 text-slate-500 hover:text-blue-600 transition-colors">
                <Camera size={18} />
              </button>
            </div>

            {/* Profile Info Section */}
            <div className="flex-1 space-y-4 text-center md:text-left">
              <div className="space-y-1">
                <div className="flex flex-wrap justify-center md:justify-start items-center gap-2">
                  <h1 className="text-3xl font-semibold">
                    {profileData.personalDetails.name || "Set your name"}
                  </h1>
                  {profileData.emailVerified && (
                    <ShieldCheck className="size-6 text-blue-500 fill-blue-50" />
                  )}
                </div>
                <button className="font-semibold text-gray-500">
                  {profileData.personalDetails.bio}
                </button>
              </div>

              {/* Badges Row */}
              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                <div className="flex items-center gap-2 bg-purple-500 text-white px-4 py-1.5 rounded-full text-xs font-semibold uppercase shadow-sm">
                  <CreditCard size={14} className="opacity-80" />
                  {profileData.subscription?.plan}
                </div>
                <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-xs font-semibold border border-blue-100 shadow-sm">
                  <Coins size={14} />
                  {(user?.credits?.base || 0) + (user?.credits?.extra || 0)} Credits
                </div>
                <div className="flex items-center gap-2 bg-green-500 text-white px-4 py-1.5 rounded-full text-xs font-semibold uppercase shadow-sm tracking-wide">
                  Active
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Detailed Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-8 shadow-sm border border-slate-200"
        >
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-4 border-b border-slate-100 pb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                <Users size={24} />
              </div>
              <h2 className="text-2xl font-semibold text-slate-900">Personal Details</h2>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPasswordModalVisible(true)}
                className="btn bg-slate-600 hover:bg-slate-700 text-white border-none rounded-lg font-semibold px-6 h-12 gap-2"
              >
                <Lock size={18} /> Change Password
              </button>
              <button
                disabled={!isChanged}
                onClick={handleSave}
                className={`btn ${isChanged ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-slate-100 text-slate-400 cursor-not-allowed"} border-none rounded-lg font-semibold px-8 h-12 gap-2 shadow-sm transition-all`}
              >
                <Check size={18} /> Save Changes
              </button>
            </div>
          </div>

          {/* Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ProfileInput
              label="Full Name"
              name="personalDetails.name"
              value={profileData.personalDetails.name}
              onChange={handleInputChange}
              placeholder="Your full name"
            />
            <ProfileInput
              label="Email"
              value={profileData.personalDetails.email}
              disabled
              placeholder="your@email.com"
            />
            <ProfileInput
              label="Phone"
              name="personalDetails.phone"
              value={profileData.personalDetails.phone}
              onChange={handleInputChange}
              placeholder="eg : +91 9990292929"
            />
            <ProfileInput
              label="Job Title"
              name="personalDetails.jobTitle"
              value={profileData.personalDetails.jobTitle}
              onChange={handleInputChange}
              placeholder="eg : Senior UX Engineer"
            />
            <ProfileInput
              label="Company"
              name="personalDetails.company"
              value={profileData.personalDetails.company}
              onChange={handleInputChange}
              placeholder="eg : Tech Innovators Inc"
            />
            <ProfileInput
              label="Date of Birth"
              name="personalDetails.dob"
              type="date"
              value={profileData.personalDetails.dob}
              onChange={handleInputChange}
            />

            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-semibold text-slate-600 ml-1">Bio</label>
              <textarea
                name="personalDetails.bio"
                value={profileData.personalDetails.bio}
                onChange={handleInputChange}
                className="textarea w-full h-32 font-semibold rounded-lg mt-1 bg-white border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-700 p-4 transition-all"
                placeholder="Tell us about yourself..."
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-semibold text-slate-600 ml-1">Interests</label>
              <div className="relative">
                <div className="flex flex-wrap gap-2 p-3 min-h-[56px] mt-1 bg-white border border-slate-200 rounded-lg items-center">
                  {profileData.personalDetails.interests.map(val => (
                    <div
                      key={val}
                      className="flex items-center gap-2 bg-slate-100 text-slate-700 px-3 py-1 rounded-lg text-sm font-medium border border-slate-200"
                    >
                      {INTEREST_OPTIONS.find(o => o.value === val)?.label || val}
                      <button onClick={() => toggleInterest(val)} className="hover:text-red-500">
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                  <div className="relative">
                    <select
                      className="select select-sm focus:ring-0 outline-0 select-bordered w-full min-w-[140px] bg-base-100 text-slate-700 font-semibold shadow-sm focus:outline-none"
                      onChange={e => {
                        if (e.target.value) toggleInterest(e.target.value)
                        e.target.value = ""
                      }}
                      defaultValue=""
                    >
                      <option disabled value="">
                        Add Interest
                      </option>

                      {INTEREST_OPTIONS.filter(
                        o => !profileData.personalDetails.interests.includes(o.value)
                      ).map(o => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Referral Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg p-8 shadow-sm border border-slate-200 space-y-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                <Share2 size={24} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Referral Loop</h3>
                <p className="text-slate-500 text-sm">Grow our community & earn bonuses.</p>
              </div>
            </div>

            {referralCode ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <code className="text-lg font-semibold text-slate-700 font-mono flex-1">
                    {referralCode}
                  </code>
                  <button
                    onClick={copyReferralCode}
                    className="btn btn-sm btn-ghost hover:bg-blue-50 text-blue-600 rounded-xl"
                  >
                    <Copy size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50/50 p-4 rounded-2xl text-center">
                    <span className="block text-2xl font-medium text-blue-600">
                      {referralStats.totalJoined}
                    </span>
                    <span className="text-sm font-semibold text-slate-400">
                      Joined
                    </span>
                  </div>
                  <div className="bg-emerald-50/50 p-4 rounded-2xl text-center">
                    <span className="block text-2xl font-medium text-emerald-600">
                      {referralStats.converted}
                    </span>
                    <span className="text-sm font-semibold text-slate-400">
                      Converted
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={handleGenerateReferral}
                className="w-full h-16 rounded-2xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
              >
                Activate Referral <ChevronRight size={20} />
              </button>
            )}
          </motion.div>

          {/* Preferences Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg p-8 shadow-sm border border-slate-200 space-y-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                <Mail size={24} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Communication</h3>
                <p className="text-slate-500 text-sm">Manage your email preferences.</p>
              </div>
            </div>

            <div className="space-y-1">
              <MinimalToggle
                label="System Alerts"
                desc="Security & server updates."
                checked={emailPreferences.accountAlerts}
                onChange={() => {}}
                disabled
              />
              <MinimalToggle
                label="Marketing"
                desc="Promotions & tips."
                checked={emailPreferences.promotionalEmails}
                onChange={c => handleEmailPreferenceChange("promotionalEmails", c)}
              />
              <MinimalToggle
                label="Feature Updates"
                desc="New tools & protocols."
                checked={emailPreferences.newFeatureUpdates}
                onChange={c => handleEmailPreferenceChange("newFeatureUpdates", c)}
              />
            </div>
          </motion.div>
        </div>
      </div>

      <PasswordModal
        visible={passwordModalVisible}
        onClose={() => setPasswordModalVisible(false)}
        hasPassword={user?.hasPassword || false}
        onSubmit={handlePasswordSubmit}
      />
    </div>
  )
}

const ProfileInput = ({ label, ...props }) => (
  <div className="space-y-2">
    <label className="text-sm font-semibold text-slate-600 ml-1">{label}</label>
    <input
      {...props}
      className="w-full mt-1 h-14 px-5 rounded-lg bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-800 placeholder:text-slate-300 font-medium transition-all disabled:bg-slate-50 disabled:text-slate-400"
    />
  </div>
)

const MinimalToggle = ({ label, desc, checked, onChange, disabled }) => (
  <div className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-all">
    <div>
      <h4 className="font-semibold text-sm">{label}</h4>
      <p className="text-xs text-slate-400 font-medium">{desc}</p>
    </div>
    <input
      type="checkbox"
      checked={checked}
      onChange={e => onChange(e.target.checked)}
      disabled={disabled}
      className="toggle toggle-primary toggle-sm"
    />
  </div>
)

export default Profile
