import React from 'react';
import { Button, Typography, Space, ConfigProvider } from 'antd';
import { MailMinus } from 'lucide-react'; // Changed icon for better context

const { Title, Paragraph, Text } = Typography;

// Main App Component
const UnsubscribeEmail = () => {
  return (
    // Use Ant Design's ConfigProvider to set a global theme, like the font.
    <ConfigProvider
      theme={{
        token: {
          fontFamily: 'Inter, sans-serif',
        },
        components: {
          Button: {
            // Customize button styles globally if needed
            primaryColor: '#fff',
          }
        }
      }}
    >
      {/* Main container with a new gradient background */}
      <main className="bg-gradient-to-br from-blue-50 via-purple-50 to-white flex items-center justify-center min-h-screen p-4 font-sans">
        
        {/* The content area, no longer a card, but a centered container */}
        <div className="max-w-xl w-full text-center p-8">
          
          {/* 1. Updated Company Logo Placeholder */}
          <div className="mb-8">
            <MailMinus className="h-16 w-16 text-purple-500 mx-auto" strokeWidth={1.5} />
          </div>

          {/* 2. Bold and Friendly Headline */}
          <Title level={2} className="!text-4xl !font-bold !text-slate-900 !mb-3">
            We’re sad to see you go 😔
          </Title>

          {/* 3. Short Message */}
          <Paragraph className="!text-slate-600 !mb-10 !text-lg">
            You’re about to unsubscribe from our emails. Are you sure?
          </Paragraph>

          {/* 4. Action Buttons with new colors */}
          <Space direction="vertical" className="w-full sm:w-auto sm:!flex-row" size="middle">
            <Button
              type="primary"
              size="large"
              shape="round"
              className="!bg-gradient-to-r !from-purple-600 !to-blue-600 hover:!from-purple-700 hover:!to-blue-700 !h-12 !px-8 !text-base !font-semibold !shadow-lg !border-none transform hover:scale-105 transition-transform"
              onClick={() => console.log('Stay Subscribed clicked')}
            >
              Stay Subscribed
            </Button>
            <Button
              size="large"
              shape="round"
              className="!bg-transparent !h-12 !px-8 !text-base !font-semibold !text-purple-800 !border-purple-300 hover:!bg-purple-100 hover:!border-purple-400"
              onClick={() => console.log('Unsubscribe clicked')}
            >
              Unsubscribe
            </Button>
          </Space>

          {/* 5. Footer Note */}
          <div className="mt-16">
            <Text className="!text-sm !text-slate-500">
              You can resubscribe anytime from your account settings.
            </Text>
          </div>
          
        </div>
      </main>
    </ConfigProvider>
  );
};

export default UnsubscribeEmail;

