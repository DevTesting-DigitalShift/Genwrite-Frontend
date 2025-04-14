import { useNavigate } from "react-router-dom";
import { Card, Tabs, Input, Button } from "antd";
import {
  SettingOutlined,
  EditOutlined,
  SearchOutlined,
  ThunderboltOutlined,
  GlobalOutlined,
  FileTextOutlined,
  ShareAltOutlined,
  BookOutlined,
} from "@ant-design/icons";

export default function ToolboxPage() {
  const navigate = useNavigate();

  return (
    <div className="p-6 max-w-7xl  mx-auto space-y-8">
      <div className="flex justify-between items-center mt-20">
        <div>
          <h1 className="text-3xl font-bold">Toolbox</h1>
          <p className="text-gray-500">
            All your content creation tools in one place
          </p>
        </div>
        <Button
          type="primary"
          className=""
          icon={<EditOutlined />}
          onClick={() => navigate("/dash")}
        >
          New Blog Post
        </Button>
      </div>

      <Tabs
        defaultActiveKey="content"
        items={[
          {
            key: "content",
            label: "Content Tools",
            children: (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card title="AI Writer" extra={<ThunderboltOutlined />}>
                  <p className="mb-4 text-gray-500">
                    Generate blog content with AI assistance
                  </p>
                  <Button block onClick={() => navigate("/editor")}>
                    Open Editor
                  </Button>
                </Card>

                <Card title="Content Research" extra={<SearchOutlined />}>
                  <p className="mb-4 text-gray-500">
                    Research topics and trending content
                  </p>
                  <Button block>Research Topics</Button>
                </Card>

                <Card title="Draft Manager" extra={<FileTextOutlined />}>
                  <p className="mb-4 text-gray-500">
                    Manage and organize your blog drafts
                  </p>
                  <Button block>View Drafts</Button>
                </Card>
              </div>
            ),
          },
          {
            key: "seo",
            label: "SEO Tools",
            children: (
              <div className="space-y-4">
                <Card title="Keyword Research">
                  <p className="mb-4 text-gray-500">
                    Find and analyze keywords for your blog
                  </p>
                  <div className="flex gap-2 mb-4">
                    <Input placeholder="Enter a keyword" />
                    <Button type="primary">Analyze</Button>
                  </div>
                  <p className="text-sm text-gray-500">
                    Recent searches will appear here
                  </p>
                </Card>

                <Card title="Competitor Analysis" extra={<GlobalOutlined />}>
                  <p className="mb-4 text-gray-500">
                    Analyze top performing content in your niche
                  </p>
                  <Button block>Start Analysis</Button>
                </Card>
              </div>
            ),
          },
          {
            key: "integrations",
            label: "Integrations",
            children: (
              <div className="space-y-4">
                <Card
                  title="WordPress Integration"
                  extra={<ShareAltOutlined />}
                >
                  <p className="mb-4 text-gray-500">
                    Coming soon - Connect your WordPress site
                  </p>
                  <Button block disabled>
                    Connect WordPress
                  </Button>
                </Card>

                <Card title="Content Platforms" extra={<BookOutlined />}>
                  <p className="mb-4 text-gray-500">
                    Manage your content distribution
                  </p>
                  <Button block>Manage Platforms</Button>
                </Card>
              </div>
            ),
          },
        ]}
      />

      <Card title="Quick Settings" extra={<SettingOutlined />}>
        <p className="mb-4 text-gray-500">Configure your toolbox preferences</p>
        <Button block>Open Settings</Button>
      </Card>
    </div>
  );
}
