import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Heart, 
  Gift, 
  ArrowLeft, 
  CheckCircle, 
  Star,
  Sparkles,
  Crown,
  Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';

const CancellationPage= () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleStay = async () => {
    setIsProcessing(true);
    
    // Simulate API call for applying discount
    setTimeout(() => {
      setIsProcessing(false);
      setShowSuccess(true);
      
      // Redirect to dashboard after showing success
      setTimeout(() => {
        // In a real app, you'd redirect to billing or dashboard
        console.log('Redirecting to dashboard with 30% discount applied');
      }, 2000);
    }, 2000);
  };

  const handleCancel = () => {
    // In a real app, this would process the cancellation
    console.log('Processing cancellation...');
    // You might show a confirmation modal or redirect to a cancellation form
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center relative overflow-hidden"
        >
          {/* Success Animation Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 to-blue-400/10 rounded-3xl" />
          
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
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
            Your 30% discount has been applied successfully! We're thrilled to have you continue your journey with GenWrite.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6"
          >
            <div className="flex items-center justify-center gap-2 text-green-800 font-semibold">
              <Gift className="w-5 h-5" />
              <span>30% OFF Applied to Your Next Billing Cycle</span>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ 
            rotate: [0, 360],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 20, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ 
            rotate: [360, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            duration: 25, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-cyan-400/20 rounded-full blur-3xl"
        />
      </div>

      {/* Main Content */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
        className="max-w-lg w-full bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 relative overflow-hidden"
      >
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-400/10 to-red-400/10 rounded-full -translate-y-16 translate-x-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-400/10 to-pink-400/10 rounded-full translate-y-12 -translate-x-12" />

        {/* Header */}
        <div className="relative text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6"
          >
            <Heart className="w-8 h-8 text-white" />
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-bold text-gray-900 mb-4"
          >
            Wait! Don't go just yet... 😢
          </motion.h1>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-3"
          >
            <p className="text-xl font-semibold text-gray-800">
              We'd love to have you stay. Here's <span className="text-orange-600 font-bold">30% OFF</span> just for you! 💸
            </p>
            <p className="text-gray-600 leading-relaxed">
              Don't miss out on all the amazing features that can transform your writing experience. 
              This exclusive offer won't last long! 🚀
            </p>
          </motion.div>
        </div>

        {/* Special Offer Highlight */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-2xl p-6 mb-8 relative overflow-hidden"
        >
          <div className="absolute top-2 right-2">
            <Sparkles className="w-6 h-6 text-orange-500" />
          </div>
          
          <div className="flex items-center gap-3 mb-3">
            <Crown className="w-6 h-6 text-orange-600" />
            <h3 className="text-lg font-bold text-gray-900">Exclusive Retention Offer</h3>
          </div>
          
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-orange-500" />
              <span>30% discount on your next billing cycle</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-orange-500" />
              <span>Keep all your premium features</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-orange-500" />
              <span>No commitment required</span>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-4"
        >
          {/* Primary Button - Stay */}
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleStay}
            disabled={isProcessing}
            className={`w-full py-4 px-6 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-3 ${
              isProcessing ? 'opacity-70 cursor-not-allowed' : 'hover:from-orange-600 hover:to-red-600'
            }`}
          >
            {isProcessing ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white/30 rounded-full border-t-white"
                />
                <span>Applying Discount...</span>
              </>
            ) : (
              <>
                <Gift className="w-5 h-5" />
                <span>Claim 30% Discount & Stay 🙌</span>
                <Zap className="w-5 h-5" />
              </>
            )}
          </motion.button>

          {/* Secondary Button - Cancel */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleCancel}
            disabled={isProcessing}
            className={`w-full py-4 px-6 border-2 border-gray-300 text-gray-700 font-semibold rounded-2xl transition-all duration-300 hover:border-gray-400 hover:bg-gray-50 ${
              isProcessing ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            Cancel Anyway
          </motion.button>
        </motion.div>

        {/* Footer Note */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-6 pt-6 border-t border-gray-200 text-center"
        >
          <p className="text-xs text-gray-500 leading-relaxed">
            This offer is valid for existing subscribers only and cannot be combined with other promotions. 
            You can cancel anytime after applying the discount.
          </p>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="mt-4"
        >
          <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
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
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default CancellationPage;