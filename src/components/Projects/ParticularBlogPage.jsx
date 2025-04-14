import React from 'react';
import { useLocation } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Import Quill styles

const ParticularBlogPage = () => {
    const location = useLocation();
    const blog = location.state?.blog; // Retrieve blog from state

    if (!blog) {
        return <p className="text-center text-red-500 font-semibold">No blog data available.</p>;
    }

    return (
        <>
            <h1 className='text-center text-3xl font-bold m-8'>Welcome to the Blog with Id={blog._id}</h1>
            <div className="p-6 max-w-4xl mx-auto  shadow-[0_20px_50px_rgba(8,_112,_184,_0.7)] rounded-lg">
                <h1 className="uppercase text-4xl text-center font-extrabold mb-4 text-gray-800">{blog.title}</h1>
                <div className='flex justify-between items-center text-2xl capitalize m-4 mb-12'>
                    <p className=" text-gray-800">
                        <strong className="text-blue-600">Topic:</strong> {blog.topic}
                    </p>
                    <p className=" text-gray-800">
                        <strong className="text-blue-600">Tone:</strong> {blog.tone}
                    </p>
                </div>
                {/* Display the content with React Quill */}
                <div className="mb-6">
                    <ReactQuill
                        value={blog.content}
                        readOnly={true} // Make the editor read-only
                        theme="snow" // You can use other themes like 'bubble'
                    />
                </div>


                
                <div className="space-y-2 mb-6">

                    <p className="text-lg text-gray-800">
                        <strong className="text-blue-600">Category:</strong> {blog.category}
                    </p>
                    <p className="text-lg text-gray-800">
                        <strong className="text-blue-600">Template:</strong> {blog.template}
                    </p>
                    <p className="text-lg text-gray-800">
                        <strong className="text-blue-600">User Defined Length:</strong> {blog.userDefinedLength}
                    </p>
                </div>

                <div className="border-t-4 flex justify-around items-center border-black p-4">
                    <strong className="text-lg text-blue-600">Author <i class="fa-solid fa-user"></i> :</strong>
                    <h3 className='text-lg text-gray-800'> {blog.author?.name} ({blog.author?.email})</h3>
                </div>

                <div className='flex justify-evenly items-center gap-6  border-t-4 border-black p-4 text-xl'>

                    <p className="text-lg text-gray-800 ">
                        <strong className="text-blue-600">Created:</strong> {new Date(blog.createdAt).toLocaleString()}
                    </p>
                    <p className="text-lg text-gray-800 ">
                        <strong className="text-blue-600">Updated:</strong> {new Date(blog.updatedAt).toLocaleString()}
                    </p>

                    <p className="text-lg text-gray-800 ">
                        <strong className="text-blue-600">AI Response :</strong> {blog.aiContentResponseJson.length ? JSON.stringify(blog.aiContentResponseJson) : 'None'}
                    </p>
                </div>




                <div className='flex justify-evenly items-center gap-6 border-t-4 border-black p-4 text-xl'>
                    <p className="text-lg text-gray-800 mb-2">
                        <strong className="text-blue-600"><i className="text-black fa-solid fa-eye"></i></strong> {blog.views}
                    </p>
                    <p className="text-lg text-gray-800 mb-2">
                        <strong className="text-blue-600"><i className="text-black fa-solid fa-thumbs-up"></i></strong> {blog.likes.length}
                    </p>
                    <p className="text-lg text-gray-800 mb-2">
                        <strong className="text-blue-600"><i className="text-black fa-solid fa-comment"></i></strong> {blog.comments.length}
                    </p>

                </div>
            </div>
        </>
    );
};

export default ParticularBlogPage;
