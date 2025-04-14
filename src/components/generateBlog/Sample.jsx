import React, { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Import Quill's CSS for styling

const RichTextEditor = ({blog}) => {
  const [editorContent, setEditorContent] = useState(blog?.content);

  const handleEditorChange = (value) => {
    setEditorContent(value);
  };

  return (
    <div className="text-editor">
      <h2>Rich Text Editor (Like MS Word)</h2>
      <ReactQuill
        value={editorContent}
        onChange={handleEditorChange}
        modules={modules}
        formats={formats}
        theme="snow"
      />
      <div>
        <h3>Preview:</h3>
        <div dangerouslySetInnerHTML={{ __html: editorContent }} />
      </div>
    </div>
  );
};

// Editor modules for toolbar customization
const modules = {
  toolbar: [
    [{ 'header': '1'}, {'header': '2'}, { 'font': [] }],
    [{size: []}],
    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
    [{'list': 'ordered'}, {'list': 'bullet'}, 
     {'indent': '-1'}, {'indent': '+1'}],
    ['link', 'image', 'video'],
    ['clean']                                         
  ],
};

// Formats supported by the editor
const formats = [
  'header', 'font', 'size',
  'bold', 'italic', 'underline', 'strike', 'blockquote',
  'list', 'bullet', 'indent',
  'link', 'image', 'video'
];

export default RichTextEditor;
