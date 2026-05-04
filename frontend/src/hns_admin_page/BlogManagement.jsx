/* eslint-disable no-unused-vars */
import API_BASE_URL from '../config';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/apiInstance';

function BlogManagement() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch posts from Flask backend
      const response = await api.get('/blogs');
      setPosts(response.data);
    } catch (err) {
      setError('Failed to fetch posts from backend.');
    } finally {
      setLoading(false);
    }
  };

  const handlePostClick = (post) => {
    setSelectedPost(post);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedPost(null);
  };

  const truncateText = (text, maxLength = 150) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Add edit and delete handlers
  const handleEdit = (blog) => {
    navigate(`/dashboard/create-blog`, { state: { blog } });
  };

  const handleDelete = async (blogId) => {
    if (!window.confirm('Are you sure you want to delete this blog?')) return;
    try {
      await api.delete(`/blogs/${blogId}`);
      fetchPosts();
      setShowModal(false);
    } catch (err) {
      alert('Failed to delete blog.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-lg shadow p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error Loading Posts</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={fetchPosts}
                    className="bg-red-100 text-red-800 px-4 py-2 rounded-md text-sm font-medium hover:bg-red-200"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Blog Management</h1>
              <p className="mt-2 text-gray-600">Manage your blogs from the admin dashboard</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard/create-blog')}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Create New Blog
              </button>
              <button
                onClick={fetchPosts}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh Posts
              </button>
              <div className="text-sm text-gray-500">
                {posts.length} posts found
              </div>
            </div>
          </div>
        </div>

        {/* Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handlePostClick(post)}
            >
              {/* Featured Image INSIDE the card */}
              {post.featured_image && (
                <img
                  src={`${API_BASE_URL}/uploads/${post.featured_image?.split('/').pop()}`}
                  alt={post.featured_image_alt || post.title}
                  className="w-full h-48 object-cover rounded-t-lg"
                  style={{ objectFit: 'cover' }}
                />
              )}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {truncateText(post.intro_paragraph, 120)}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                  <span>Slug: {post.slug}</span>
                  <span>{new Date(post.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                    onClick={e => { e.stopPropagation(); handleEdit(post); }}
                  >Edit</button>
                  <button
                    className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                    onClick={e => { e.stopPropagation(); handleDelete(post.id); }}
                  >Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {posts.length === 0 && !loading && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No posts found</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new post.</p>
          </div>
        )}
      </div>

      {/* Post Detail Modal */}
      {showModal && selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{selectedPost.title}</h2>
                <div className="flex gap-2">
                  <button
                    className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                    onClick={() => { handleEdit(selectedPost); }}
                  >Edit</button>
                  <button
                    className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                    onClick={() => { handleDelete(selectedPost.id); }}
                  >Delete</button>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600 ml-2"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Featured Image */}
              {selectedPost.featured_image && (
                <div className="mb-6">
                  <img
                    src={`${API_BASE_URL}/uploads/${selectedPost.featured_image?.split('/').pop()}`}
                    alt={selectedPost.featured_image_alt || selectedPost.title}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
              )}

              {/* Blog Content */}
              <div className="prose max-w-none">
                <p><strong>Intro:</strong> {selectedPost.intro_paragraph}</p>
                <h3>{selectedPost.subheading1}</h3>
                <p>{selectedPost.content1}</p>
                {selectedPost.image1 && (
                  <img src={`${API_BASE_URL}/uploads/${selectedPost.image1?.split('/').pop()}`} alt={selectedPost.alt_text1 || ''} style={{ maxWidth: 400 }} />
                )}
                <h3>{selectedPost.subheading2}</h3>
                <p>{selectedPost.content2}</p>
                {selectedPost.image2 && (
                  <img src={`${API_BASE_URL}/uploads/${selectedPost.image2?.split('/').pop()}`} alt={selectedPost.alt_text2 || ''} style={{ maxWidth: 400 }} />
                )}
                <h3>{selectedPost.subheading3}</h3>
                <p>{selectedPost.content3}</p>
                {selectedPost.image3 && (
                  <img src={`${API_BASE_URL}/uploads/${selectedPost.image3?.split('/').pop()}`} alt={selectedPost.alt_text3 || ''} style={{ maxWidth: 400 }} />
                )}
                {/* Interlinks */}
                {selectedPost.interlinks && selectedPost.interlinks.length > 0 && (
                  <div>
                    <h4>Related Articles</h4>
                    <ul>
                      {selectedPost.interlinks.map((link, idx) => (
                        <li key={idx}><a href={link}>{link}</a></li>
                      ))}
                    </ul>
                  </div>
                )}
                {/* External Links */}
                {selectedPost.external_links && selectedPost.external_links.length > 0 && (
                  <div>
                    <h4>External Resources</h4>
                    <ul>
                      {selectedPost.external_links.map((link, idx) => (
                        <li key={idx}><a href={link} target="_blank" rel="noopener noreferrer">{link}</a></li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="mt-4 text-xs text-gray-500">
                  <div>Slug: {selectedPost.slug}</div>
                  <div>Created: {new Date(selectedPost.created_at).toLocaleString()}</div>
                  <div>Updated: {new Date(selectedPost.updated_at).toLocaleString()}</div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-8 flex items-center justify-end pt-6 border-t border-gray-200">
                <button
                  onClick={closeModal}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BlogManagement; 