import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  CreditCard,
  Banknotes,
  Check,
  ShieldCheck,
  Lock,
  Users,
  Mail,
  Share2,
  Copy,
  RefreshCw,
  User,
  Phone,
  Briefcase,
  Building2,
  Calendar,
  Heart,
  Camera,
  LogOut,
  ChevronRight,
  Info,
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
  { value: "technology", label: "Technology", color: "blue" },
  { value: "sports", label: "Sports", color: "emerald" },
  { value: "music", label: "Music", color: "purple" },
  { value: "art", label: "Art", color: "rose" },
  { value: "other", label: "Other", color: "orange" },
]

const PLAN_THEMES = {
  free: { bg: "bg-slate-500", text: "text-white", label: "Basic Tier" },
  basic: { bg: "bg-blue-600", text: "text-white", label: "Basic Pro" },
  pro: { bg: "bg-indigo-600", text: "text-white", label: "Professional" },
  enterprise: { bg: "bg-amber-500", text: "text-white", label: "Corporate" },
}

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
      toast.error("Deployment of changes failed. Try again.")
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
      toast.success("Security credentials updated")
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
    toast.success("Affiliate link ready to share!")
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

  return (
    <div className="min-h-screen bg-linear-to-b from-white to-slate-50 p-6 lg:p-12 mb-32">
      <Helmet>
        <title>Settings & Identity | GenWrite</title>
      </Helmet>

      <div className="max-w-5xl mx-auto space-y-10">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[40px] shadow-2xl shadow-indigo-100/40 border border-slate-100 overflow-hidden"
        >
          <div className="h-40 bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600"></div>
          <div className="px-10 pb-10">
            <div className="relative -mt-20 mb-8 flex flex-col md:flex-row items-end gap-6">
              <div className="relative group">
                {profileData.profilePicture ? (
                  <img
                    src={profileData.profilePicture}
                    className="w-40 h-40 rounded-[32px] border-8 border-white object-cover shadow-xl"
                    alt="PFP"
                  />
                ) : (
                  <div className="w-40 h-40 rounded-[32px] border-8 border-white bg-linear-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-6xl font-black shadow-xl uppercase">
                    {profileData.personalDetails.name?.[0] || "G"}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/20 rounded-[32px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                  <Camera className="text-white size-8" />
                </div>
              </div>
              <div className="flex-1 pb-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-4xl font-black text-slate-900">
                    {profileData.personalDetails.name || "Identified User"}
                  </h1>
                  {profileData.emailVerified && (
                    <div className="tooltip tooltip-right" data-tip="Enterprise Verified Account">
                      <ShieldCheck className="size-8 text-blue-500 fill-blue-50" />
                    </div>
                  )}
                </div>
                <p className="text-slate-500 font-bold mt-1">
                  {profileData.personalDetails.jobTitle || "Citizen of GenWrite"} @{" "}
                  {profileData.personalDetails.company || "Stealth Startup"}
                </p>
              </div>
              <div className="flex gap-2">
                <div
                  className={`badge h-12 px-6 rounded-2xl font-black border-none uppercase tracking-widest text-xs ${PLAN_THEMES[profileData.subscription?.plan]?.bg} text-white`}
                >
                  {profileData.subscription?.plan} tier
                </div>
                <div className="badge h-12 px-6 rounded-2xl font-black border-none bg-emerald-100 text-emerald-700 uppercase tracking-widest text-xs">
                  Auto-Active
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-8">
                <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                  <User className="size-6 text-blue-600" /> Identity Matrix
                </h3>
                <div className="grid grid-cols-1 gap-6">
                  <ProfileInput
                    label="Full Identity Name"
                    name="personalDetails.name"
                    value={profileData.personalDetails.name}
                    onChange={handleInputChange}
                    icon={<User className="size-4" />}
                  />
                  <ProfileInput
                    label="Primary Email"
                    value={profileData.personalDetails.email}
                    disabled
                    icon={<Mail className="size-4" />}
                  />
                  <ProfileInput
                    label="Mobile Access"
                    name="personalDetails.phone"
                    value={profileData.personalDetails.phone}
                    onChange={handleInputChange}
                    icon={<Phone className="size-4" />}
                  />
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                      Current Job Role
                    </label>
                    <div className="relative">
                      <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                      <input
                        name="personalDetails.jobTitle"
                        value={profileData.personalDetails.jobTitle}
                        onChange={handleInputChange}
                        className="input input-bordered w-full h-14 pl-12 rounded-2xl font-bold bg-slate-50 border-none focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all text-slate-700"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                  <Heart className="size-6 text-rose-500" /> Engagement Layer
                </h3>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                      Neural Bio
                    </label>
                    <textarea
                      name="personalDetails.bio"
                      value={profileData.personalDetails.bio}
                      onChange={handleInputChange}
                      className="textarea textarea-bordered w-full h-40 rounded-3xl font-bold bg-slate-50 border-none focus:bg-white focus:ring-4 focus:ring-rose-100 transition-all text-slate-700 p-5"
                      placeholder="Tell us about your digital footprint..."
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                      Interest Nodes
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {INTEREST_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => toggleInterest(opt.value)}
                          className={`btn btn-sm rounded-xl border-none font-bold normal-case px-4 h-10 transition-all ${profileData.personalDetails.interests.includes(opt.value) ? `bg-${opt.color}-500 text-white shadow-lg shadow-${opt.color}-100` : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 pt-10 border-t border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center">
              <button
                onClick={() => setPasswordModalVisible(true)}
                className="btn btn-ghost h-14 rounded-2xl px-8 font-black text-slate-500 hover:bg-slate-100 gap-3"
              >
                <Lock className="size-5" /> Security Vault
              </button>
              <button
                disabled={!initialProfileData || isEqual(profileData, initialProfileData)}
                onClick={handleSave}
                className="btn btn-primary h-14 rounded-2xl px-12 font-black text-lg bg-linear-to-r from-blue-600 to-indigo-600 border-none text-white shadow-xl shadow-blue-200 normal-case hover:scale-[1.02] transition-transform"
              >
                Finalize Synchronization
              </button>
            </div>
          </div>
        </motion.div>

        {/* Action Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Referral */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-[40px] p-10 shadow-2xl shadow-indigo-100/30 border border-slate-100"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-emerald-100 rounded-[20px] flex items-center justify-center">
                <Share2 className="size-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-800">Affiliate Loop</h3>
                <p className="text-slate-400 font-bold text-sm">Grow our ecosystem & earn fuel.</p>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {referralCode ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div className="flex items-center gap-3 bg-slate-50 p-6 rounded-3xl border border-dashed border-slate-200">
                    <code className="text-2xl font-black text-slate-700 font-mono tracking-widest flex-1">
                      {referralCode}
                    </code>
                    <button
                      onClick={copyReferralCode}
                      className="btn btn-primary btn-square rounded-2xl bg-blue-600 border-none text-white shadow-lg shadow-blue-100"
                    >
                      <Copy className="size-5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50/50 p-6 rounded-3xl text-center">
                      <p className="text-3xl font-black text-blue-600">
                        {referralStats.totalJoined}
                      </p>
                      <p className="text-xs font-black uppercase text-slate-400 tracking-widest mt-1">
                        Involved
                      </p>
                    </div>
                    <div className="bg-emerald-50/50 p-6 rounded-3xl text-center">
                      <p className="text-3xl font-black text-emerald-600">
                        {referralStats.converted}
                      </p>
                      <p className="text-xs font-black uppercase text-slate-400 tracking-widest mt-1">
                        Converted
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <button
                  onClick={handleGenerateReferral}
                  className="btn btn-block h-20 rounded-3xl bg-slate-900 border-none text-white font-black text-xl hover:bg-slate-800 shadow-xl shadow-slate-200"
                >
                  Initialize Program <ChevronRight className="ml-2 size-6" />
                </button>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Preferences */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-[40px] p-10 shadow-2xl shadow-indigo-100/30 border border-slate-100"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-blue-100 rounded-[20px] flex items-center justify-center">
                <Mail className="size-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-800">Signal Filters</h3>
                <p className="text-slate-400 font-bold text-sm">Manage internal communications.</p>
              </div>
            </div>

            <div className="space-y-6">
              <SignalToggle
                label="Force System Alerts"
                desc="Critical security and server status updates."
                checked={emailPreferences.accountAlerts}
                onChange={() => {}}
                disabled
              />
              <SignalToggle
                label="Signal Transmissions"
                desc="Exclusive promotional data and upgrade loops."
                checked={emailPreferences.promotionalEmails}
                onChange={c => handleEmailPreferenceChange("promotionalEmails", c)}
              />
              <SignalToggle
                label="Protocol Updates"
                desc="New feature documentation and API rollouts."
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

const ProfileInput = ({ label, icon, ...props }) => (
  <div className="space-y-2">
    <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
      {label}
    </label>
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">{icon}</div>
      <input
        {...props}
        className="input input-bordered w-full h-14 pl-12 rounded-2xl font-bold bg-slate-50 border-none focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all text-slate-700 disabled:bg-slate-100/50 disabled:text-slate-400 placeholder:text-slate-300"
      />
    </div>
  </div>
)

const SignalToggle = ({ label, desc, checked, onChange, disabled }) => (
  <div className="flex items-center justify-between group p-2 hover:bg-slate-50 rounded-2xl transition-all">
    <div>
      <h4 className="font-black text-slate-800">{label}</h4>
      <p className="text-xs font-bold text-slate-400">{desc}</p>
    </div>
    <input
      type="checkbox"
      checked={checked}
      onChange={e => onChange(e.target.checked)}
      disabled={disabled}
      className="toggle toggle-primary h-8 w-14"
    />
  </div>
)

export default Profile
