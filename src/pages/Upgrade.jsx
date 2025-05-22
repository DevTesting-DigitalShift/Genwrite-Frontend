import React from "react";

const Upgrade = () => {
  return (
    <div className="min-h-screen bg-white text-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <h1 className="text-4xl font-bold text-center mb-2">Pricing</h1>
        <p className="text-center text-gray-600 mb-4">
          Choose the plan that works for you
        </p>

        {/* Toggle for Monthly/Yearly */}
        <div className="flex justify-center mb-8">
          <button className="px-4 py-2 bg-gray-200 text-gray-900 rounded-l-md focus:outline-none hover:bg-gray-300">
            MONTHLY
          </button>
          <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded-r-md focus:outline-none hover:bg-gray-200">
            YEARLY (SAVE 20%)
          </button>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Free Plan */}
          <div className="bg-gray-100 rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">Free</h2>
            <p className="text-gray-600 mb-6">Includes</p>
            <ul className="text-gray-600 space-y-2 mb-6">
              <li>✔ Pro two-week trial</li>
              <li>✔ 2000 completions</li>
              <li>✔ 50 slow requests</li>
            </ul>
            <div className="flex justify-between">
              <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
                Download
              </button>
              <button className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400">
                Others
              </button>
            </div>
          </div>

          {/* Premium Plan */}
          <div className="bg-gray-100 rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">Premium</h2>
            <p className="text-4xl font-bold mb-2 text-gray-900">$20</p>
            <p className="text-gray-600 mb-6">/month</p>
            <p className="text-gray-600 mb-6">Everything in Free, plus</p>
            <ul className="text-gray-600 space-y-2 mb-6">
              <li>✔ Unlimited completions</li>
              <li>✔ 500 requests per month</li>
              <li>✔ Unlimited slow requests</li>
              <li>✔ Max mode</li>
            </ul>
            <button className="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
              Get Started
            </button>
          </div>

          {/* Enterprise Plan */}
          <div className="bg-gray-100 rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">Enterprise</h2>
            <p className="text-4xl font-bold mb-2 text-gray-900">$40</p>
            <p className="text-gray-600 mb-6">/user/month</p>
            <p className="text-gray-600 mb-6">Everything in Premium, plus</p>
            <ul className="text-gray-600 space-y-2 mb-6">
              <li>✔ Enforce privacy mode org-wide</li>
              <li>✔ Centralized team billing</li>
              <li>✔ Admin dashboard with usage stats</li>
              <li>✔ SAML/OIDC SSO</li>
            </ul>
            <button className="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
              Get Started
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upgrade;