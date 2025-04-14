import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import SimpleMDE from "react-simplemde-editor";
import "easymde/dist/easymde.min.css";

const MarkdownEditor = ({ blog }) => {
  const [markdown, setMarkdown] = useState(blog?.content || "");

  const handleMarkdownChange = (value) => {
    setMarkdown(value);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        padding: "20px",
      }}
    >
      <h1>Markdown Editor</h1>

      {/* Markdown Editor */}
      <div>
        <SimpleMDE value={markdown} onChange={handleMarkdownChange} />
      </div>

      {/* Markdown Preview */}
      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: "8px",
          padding: "10px",
        }}
      >
        <h2>Preview</h2>
        <ReactMarkdown>{markdown}</ReactMarkdown>
      </div>
    </div>
  );
};

export default MarkdownEditor;
