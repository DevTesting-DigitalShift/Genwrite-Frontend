import { marked } from "marked";
import DOMPurify from "dompurify";
import { useEffect, useState } from "react";
import "./preview.css";
import { useLoaderData } from "react-router-dom";
import { Card, Typography } from "antd";
const { Title, Text } = Typography;

function estimateReadingTime(text) {
  const words = text.trim().split(/\s+/).length;
  return `${Math.ceil(words / 200)} min read`;
}

function generateTOC(markdown) {
  const lines = markdown.split("\n");

  const seen = new Set();
  const toc = [];
  let h2Found = false;

  for (const line of lines) {
    if (/^## /.test(line)) {
      h2Found = true;
      let text = line.replace(/^## /, "").trim();

      // Strip markdown formatting
      text = text
        .replace(/!\[.*?\]\(.*?\)/g, "")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/[*_~`]+/g, "")
        .replace(/<[^>]*>/g, "")
        .trim();

      const id = text.toLowerCase().replace(/[^\w]+/g, "-").replace(/^-+|-+$/g, "");

      if (!seen.has(id)) {
        seen.add(id);
        toc.push({ text, id, level: 2 });
      }
    }

    else if (/^### /.test(line) && !h2Found) {
      let text = line.replace(/^### /, "").trim();

      // Strip markdown formatting
      text = text
        .replace(/!\[.*?\]\(.*?\)/g, "")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/[*_~`]+/g, "")
        .replace(/<[^>]*>/g, "")
        .trim();

      const id = text.toLowerCase().replace(/[^\w]+/g, "-").replace(/^-+|-+$/g, "");

      if (!seen.has(id)) {
        seen.add(id);
        toc.push({ text, id, level: 3 });
      }
    }
  }

  return toc;
}

function addHeadingIds(markdown) {
  return markdown.replace(/^(#{2,3}) (.+)$/gm, (_, hashes, text) => {
    const id = text.toLowerCase().replace(/[^\w]+/g, "-");
    return `${hashes} <a id="${id}"></a>${text}`;
  });
}

export default function PreviewBlog() {
  const blog = useLoaderData();
  const [html, setHtml] = useState("");
  const [toc, setTOC] = useState([]);

  useEffect(() => {
    if (blog) {
      const { title, content } = blog;
      const withAnchors = addHeadingIds(content);
      const rawHtml = marked.parse(withAnchors);
      const safeHtml = DOMPurify.sanitize(rawHtml);
      setHtml(safeHtml);
      setTOC(generateTOC(content));

      document.title = title;
    }
  }, [blog]);

  const { title, author, createdAt, content } = blog;
  const readingTime = estimateReadingTime(content);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 scroll-smooth">
      <Card className="rounded-lg shadow-lg">
        <header className="mb-6 text-right">
          <Title level={1} className="mb-2 text-center text-pretty ">
            {title}
          </Title>
          <Text type="secondary">
            By <Text strong>{author?.name}</Text> &nbsp;·&nbsp;
            {new Date(createdAt).toLocaleDateString("en-US", {
              month: "long",
              day: "2-digit",
              year: "numeric",
            })}
            &nbsp;·&nbsp;{readingTime}
          </Text>
        </header>

        {toc.length > 0 && (
          <Card type="inner" title="Table of Contents" className="mb-6">
            <ul className="pl-4 space-y-1">
              {toc.map(({ text, id, level }) => (
                <li key={id} className={`ml-${level === 3 ? "4" : "0"} list-disc`}>
                  <a href={`#${id}`} className="link no-underline hover:underline">
                    {text}
                  </a>
                </li>
              ))}
            </ul>
          </Card>
        )}

        <article
          className="blog-content prose max-w-none"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </Card>
    </div>
  );
}
