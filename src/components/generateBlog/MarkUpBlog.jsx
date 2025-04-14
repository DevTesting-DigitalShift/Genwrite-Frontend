import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const MarkUpBlog = ({blog}) => {
    if (!blog || !blog.content) {
        return <div>Loading...</div>;
      }
  return (
    <div className="prose max-w-none mx-auto p-4">
      {/* Render the markdown content safely */}
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {blog.content}
      </ReactMarkdown>
    </div>
  );
}

export default MarkUpBlog