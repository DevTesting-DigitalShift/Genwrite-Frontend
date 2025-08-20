import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Heart, 
  Gift, 
  ArrowLeft, 
  CheckCircle, 
  Star,
  Sparkles,
  Crown,
  Zap} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { updateProfile } from '@store/slices/userSlice';
import { message } from 'antd';
import { useConfirmPopup } from '@/context/ConfirmPopupContext';
import { WarningOutlined } from '@ant-design/icons';
import { cancelStripeSubscription } from '@api/otherApi';
import { useSelector } from 'react-redux';
import { selectUser } from '@store/slices/authSlice';
import { sendCancellationRelatedEvent } from '@utils/stripeGTMEvents';

const CancellationPage = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
const dispatch = useDispatch();
const navigate = useNavigate();
const user = useSelector(selectUser)
const {handlePopup} = useConfirmPopup()
  

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleStay = async () => {
    try{
      setIsProcessing(true);
      dispatch(updateProfile({"subscription.discountApplied":30}))
      setShowSuccess(true);
      sendCancellationRelatedEvent(user, "discount")
      message.success("30% More Credits applied successfully!");
    }catch(err){
      console.error("Error applying discount:", err);
      message.error("Failed to apply discount, please try again later.");
    }finally{
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    // setIsProcessing(true);
    // // Simulate API call for cancellation
    // setTimeout(() => {
    //   setIsProcessing(false);
    //   setShowSuccess(true);
    // }, 2000);
    handlePopup({
      title: "Cancel Subscription",
      description: <span>
        Are you sure you'd like to cancel your subscription? <br />
        You'll continue to enjoy all your benefits <strong>until the end of your current billing cycle</strong>.
      </span>,
      icon: <WarningOutlined style={{ fontSize: 40, color: "red" }}/>,
      onConfirm: async () => {
        try{
          setIsProcessing(true);
          const data = await cancelStripeSubscription();
          sendCancellationRelatedEvent(user, "cancel")
          console.log("Subscription cancelled");
          message.success("Subscription cancelled successfully!");
          navigate("/dashboard");
        }catch(err){
          console.error("Error cancelling subscription:", err);
          message.error("Failed to cancel subscription, please try again later.");
        }finally{
          setIsProcessing(false);
        }
      },
      confirmText: "Cancel Anyway",
      cancelText: "Go Back",
    })
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-8 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 to-blue-400/10 rounded-3xl" />
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
            className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="w-10 h-10 text-white" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold text-gray-900 mb-4"
          >
            Welcome Back! 🎉
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-gray-600 mb-6 leading-relaxed"
          >
            Your 30% More Credits has been applied successfully! We're thrilled to have you continue your journey with GenWrite.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6"
          >
            <div className="flex items-center justify-center gap-2 text-green-800 font-semibold">
              <Gift className="w-5 h-5" />
              <span>30% More Credits to Your Next Billing Cycle</span>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Link
              to="/dashboard"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
            >
              Continue to Dashboard
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="relative py-16">
        {/* <div className="">
          <motion.div
            animate={{ rotate: [0, 360], scale: [1, 1.1, 1] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ rotate: [360, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl"
          />
        </div> */}
        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            Don't Leave Yet! 😢
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl md:text-2xl font-semibold mb-6"
          >
            Stay with us and enjoy a <span className="text-orange-400 font-bold uppercase">30% MORE credits </span> on next billing cycle!  
          </motion.p>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 py-12 grid md:grid-cols-2 gap-8">
        {/* Offer Details */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl shadow-lg p-6 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-400/10 to-red-400/10 rounded-full -translate-y-12 translate-x-12" />
          <div className="flex items-center gap-3 mb-4">
            <Crown className="w-6 h-6 text-orange-600" />
            <h2 className="text-2xl font-bold text-gray-900">Exclusive Retention Offer</h2>
          </div>
          <div className="space-y-3 text-gray-700">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-orange-500" />
              <span>30% more credits on next billing cycle</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-orange-500" />
              <span>Better priority support and faster response times</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-orange-500" />
              <span>No long-term commitment required</span>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleStay}
            disabled={isProcessing}
            className={`w-full mt-6 py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-3 ${
              isProcessing ? 'opacity-70 cursor-not-allowed' : 'hover:from-blue-400 hover:to-purple-400'
            }`}
          >
            {isProcessing ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-white/30 rounded-full border-t-white"
                />
                <span>Applying Discount...</span>
              </>
            ) : (
              <>
                <Gift className="w-5 h-5" />
                <span>Claim 30% More Credits & Stay 🙌</span>
                <Zap className="w-5 h-5" />
              </>
            )}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleCancel}
            disabled={isProcessing}
            className={`w-full mt-3 py-4 px-6 border-2 border-red-500 text-gray-700 font-semibold rounded-xl transition-all duration-300 hover:border-red-600 hover:bg-red-100 ${
              isProcessing ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            Cancel Anyway
          </motion.button>
        </motion.div>

        {/* Benefits Section */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-6"
        >
          <h2 className="text-2xl font-bold text-gray-900">Why Stay with GenWrite?</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className="font-semibold text-gray-800">Powerful AI Writing Tools</h3>
                <p className="text-gray-600">Generate high-quality content effortlessly with our advanced AI features.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Heart className="w-6 h-6 text-red-600" />
              <div>
                <h3 className="font-semibold text-gray-800">Personalized Support</h3>
                <p className="text-gray-600">Get dedicated support to help you succeed with your writing projects.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Crown className="w-6 h-6 text-yellow-600" />
              <div>
                <h3 className="font-semibold text-gray-800">Premium Features</h3>
                <p className="text-gray-600">Access exclusive tools and templates to elevate your content creation.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Testimonial Section */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="text-2xl font-bold text-gray-900 text-center mb-8"
          >
            What Our Users Say
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-white rounded-2xl shadow-lg p-6 text-center"
          >
            <p className="text-gray-600 italic mb-4">"GenWrite has transformed the way I create content. The AI tools are a game-changer!"</p>
            <p className="font-semibold text-gray-800">— Sarah M., Content Creator</p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="flex items-center justify-center gap-6 text-xs text-gray-500 mb-4"
          >
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-500" />
              <span>No Hidden Fees</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-500" />
              <span>Cancel Anytime</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-500" />
              <span>Instant Activation</span>
            </div>
          </motion.div>
          <p className="text-xs text-gray-500">
            This offer is valid for existing subscribers only and cannot be combined with other promotions. 
            You can cancel anytime after applying the discount.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default CancellationPage;