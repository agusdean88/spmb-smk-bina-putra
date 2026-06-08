import React, { Suspense, lazy } from 'react';
import DOMPurify from 'dompurify';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = lazy(() => import('react-quill-new'));

const RichTextEditor = ({ value, onChange, placeholder }) => {
  const modules = {
    toolbar: [
      ['bold', 'italic'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'image'],
      ['clean']
    ],
  };

  const formats = [
    'bold', 'italic',
    'list', 'bullet',
    'link', 'image'
  ];

  const handleChange = (content) => {
    // Sanitize HTML before sending to parent
    const sanitized = DOMPurify.sanitize(content);
    onChange(sanitized);
  };

  return (
    <div className="rich-text-editor bg-white rounded-xl overflow-hidden border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
      <Suspense fallback={<div className="h-40 flex items-center justify-center bg-slate-50 text-slate-400">Loading editor...</div>}>
        <ReactQuill
          theme="snow"
          value={value}
          onChange={handleChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          className="h-full min-h-[300px]"
        />
      </Suspense>
      <style>{`
        .ql-container.ql-snow {
          border: none !important;
          font-family: inherit;
          font-size: 0.875rem;
        }
        .ql-toolbar.ql-snow {
          border: none !important;
          border-bottom: 1px solid #e2e8f0 !important;
          background-color: #f8fafc;
        }
        .ql-editor {
          min-height: 250px;
          color: #1e293b;
        }
        .ql-editor.ql-blank::before {
          color: #94a3b8;
          font-style: normal;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
