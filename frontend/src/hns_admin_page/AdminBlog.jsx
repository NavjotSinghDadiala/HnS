import API_BASE_URL from '../config';
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/apiInstance';

const AdminBlog = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const editingBlog = location.state?.blog;
  const [formData, setFormData] = useState({
    title: '',
    introParagraph: '',
    subheading1: '',
    content1: '',
    image1: null,
    altText1: '',
    subheading2: '',
    content2: '',
    image2: null,
    altText2: '',
    subheading3: '',
    content3: '',
    image3: null,
    altText3: '',
    interlinks: ['', '', ''],
    externalLinks: ['', ''],
    metaDescription: '',
    focusKeywords: '',
    slug: '',
    featuredImage: null,
    featuredImageAlt: ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [imagePreview, setImagePreview] = useState({
    image1: null,
    image2: null,
    image3: null,
    featuredImage: null
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleArrayInputChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const handleImageChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        [field]: file
      }));

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(prev => ({
          ...prev,
          [field]: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const buildHTMLContent = () => {
    let htmlContent = `<p>${formData.introParagraph}</p>`;

    // Add subheadings and content
    for (let i = 1; i <= 3; i++) {
      const subheading = formData[`subheading${i}`];
      const content = formData[`content${i}`];

      if (subheading && content) {
        htmlContent += `<h2>${subheading}</h2>`;
        htmlContent += `<p>${content}</p>`;
      }
    }

    // Add interlinks
    const validInterlinks = formData.interlinks.filter(link => link.trim());
    if (validInterlinks.length > 0) {
      htmlContent += '<h3>Related Articles</h3><ul>';
      validInterlinks.forEach(link => {
        htmlContent += `<li><a href="${link}">${link}</a></li>`;
      });
      htmlContent += '</ul>';
    }

    // Add external links
    const validExternalLinks = formData.externalLinks.filter(link => link.trim());
    if (validExternalLinks.length > 0) {
      htmlContent += '<h3>External Resources</h3><ul>';
      validExternalLinks.forEach(link => {
        htmlContent += `<li><a href="${link}" target="_blank" rel="noopener noreferrer">${link}</a></li>`;
      });
      htmlContent += '</ul>';
    }

    return htmlContent;
  };

  // Prefill form if editing
  useEffect(() => {
    if (editingBlog) {
      setFormData({
        title: editingBlog.title || '',
        introParagraph: editingBlog.intro_paragraph || '',
        subheading1: editingBlog.subheading1 || '',
        content1: editingBlog.content1 || '',
        image1: null,
        altText1: editingBlog.alt_text1 || '',
        subheading2: editingBlog.subheading2 || '',
        content2: editingBlog.content2 || '',
        image2: null,
        altText2: editingBlog.alt_text2 || '',
        subheading3: editingBlog.subheading3 || '',
        content3: editingBlog.content3 || '',
        image3: null,
        altText3: editingBlog.alt_text3 || '',
        interlinks: editingBlog.interlinks?.length ? editingBlog.interlinks : ['', '', ''],
        externalLinks: editingBlog.external_links?.length ? editingBlog.external_links : ['', ''],
        metaDescription: editingBlog.meta_description || '',
        focusKeywords: editingBlog.focus_keywords || '',
        slug: editingBlog.slug || '',
        featuredImage: null,
        featuredImageAlt: editingBlog.featured_image_alt || ''
      });
      setImagePreview({
        image1: editingBlog.image1 ? `${API_BASE_URL}/uploads/${editingBlog.image1}` : null,
        image2: editingBlog.image2 ? `${API_BASE_URL}/uploads/${editingBlog.image2}` : null,
        image3: editingBlog.image3 ? `${API_BASE_URL}/uploads/${editingBlog.image3}` : null,
        featuredImage: editingBlog.featured_image ? `${API_BASE_URL}/uploads/${editingBlog.featured_image}` : null
      });
    }
  }, [editingBlog]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Prepare FormData for multipart/form-data
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('introParagraph', formData.introParagraph);
      formDataToSend.append('subheading1', formData.subheading1);
      formDataToSend.append('content1', formData.content1);
      // Only append image files if they're actual File objects
      if (formData.image1 instanceof File) formDataToSend.append('image1', formData.image1);
      formDataToSend.append('altText1', formData.altText1);
      formDataToSend.append('subheading2', formData.subheading2);
      formDataToSend.append('content2', formData.content2);
      if (formData.image2 instanceof File) formDataToSend.append('image2', formData.image2);
      formDataToSend.append('altText2', formData.altText2);
      formDataToSend.append('subheading3', formData.subheading3);
      formDataToSend.append('content3', formData.content3);
      if (formData.image3 instanceof File) formDataToSend.append('image3', formData.image3);
      formDataToSend.append('altText3', formData.altText3);
      if (formData.featuredImage instanceof File) formDataToSend.append('featuredImage', formData.featuredImage);
      formDataToSend.append('featuredImageAlt', formData.featuredImageAlt);
      formDataToSend.append('interlinks', JSON.stringify(formData.interlinks));
      formDataToSend.append('externalLinks', JSON.stringify(formData.externalLinks));
      formDataToSend.append('metaDescription', formData.metaDescription);
      formDataToSend.append('focusKeywords', formData.focusKeywords);
      formDataToSend.append('slug', formData.slug);

      let response;
      if (editingBlog) {
        // Edit mode: PUT request
        response = await api.put(`/blogs/${editingBlog.id}`, formDataToSend);
      } else {
        // Create mode: POST request
        response = await api.post(`/blogs`, formDataToSend);
      }

      if (response.data.success) {
        setMessage({
          type: 'success',
          text: editingBlog ? 'Blog updated successfully!' : `Blog post created successfully! Slug: ${response.data.blog.slug}`
        });
        if (editingBlog) {
          setTimeout(() => navigate('/dashboard/blogs'), 1200);
        } else {
          // Reset form
          setFormData({
            title: '',
            introParagraph: '',
            subheading1: '',
            content1: '',
            image1: null,
            altText1: '',
            subheading2: '',
            content2: '',
            image2: null,
            altText2: '',
            subheading3: '',
            content3: '',
            image3: null,
            altText3: '',
            interlinks: ['', '', ''],
            externalLinks: ['', ''],
            metaDescription: '',
            focusKeywords: '',
            slug: '',
            featuredImage: null,
            featuredImageAlt: ''
          });
          setImagePreview({
            image1: null,
            image2: null,
            image3: null,
            featuredImage: null
          });
        }
      } else {
        setMessage({
          type: 'error',
          text: response.data.error || 'Failed to save blog post'
        });
      }
    } catch (error) {
      console.error('Blog creation error:', error);
      let errorMessage = 'Failed to save blog post';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      setMessage({
        type: 'error',
        text: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              {editingBlog ? 'Edit Blog Post' : 'Create New Blog Post'}
            </h1>
            <p className="text-lg text-gray-600">{editingBlog ? 'Update your blog content' : 'Craft engaging content and publish to your blog'}</p>
          </div>
        </div>

        {/* Message Display */}
        {message.text && (
          <div className={`mb-8 p-6 rounded-xl shadow-lg ${message.type === 'success'
            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-800'
            : 'bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-800'
            }`}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {message.type === 'success' ? (
                  <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{message.text}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">1</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Basic Information</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200"
                    placeholder="Enter your blog post title..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Slug (URL) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200"
                    placeholder="Enter URL slug..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Intro Paragraph <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="introParagraph"
                    rows={4}
                    value={formData.introParagraph}
                    onChange={handleInputChange}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200 resize-none"
                    placeholder="Write an engaging introduction..."
                    required
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Featured Image <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e, 'featuredImage')}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600 transition-all duration-200 cursor-pointer"
                    required
                  />

                  {imagePreview.featuredImage && (
                    <div className="mt-3">
                      <img
                        src={imagePreview.featuredImage}
                        alt="Featured Image Preview"
                        className="w-32 h-32 object-cover rounded-lg border"
                      />
                    </div>
                  )}

                  <input
                    type="text"
                    name="featuredImageAlt"
                    placeholder="Describe this image for accessibility..."
                    value={formData.featuredImageAlt}
                    onChange={handleInputChange}
                    className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Content Sections */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">2</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Content Sections</h2>
            </div>

            {/* Section 1 */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 space-y-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-teal-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">1</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900">Section 1</h3>
                <span className="text-red-500 text-sm">*</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Subheading 1
                    </label>
                    <input
                      type="text"
                      name="subheading1"
                      value={formData.subheading1}
                      onChange={handleInputChange}
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200"
                      placeholder="Enter subheading 1..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Content 1
                    </label>
                    <textarea
                      name="content1"
                      rows={6}
                      value={formData.content1}
                      onChange={handleInputChange}
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200 resize-none"
                      placeholder="Write content for section 1..."
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Image 1
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange(e, 'image1')}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600 transition-all duration-200 cursor-pointer"
                    />

                    {imagePreview.image1 && (
                      <div className="mt-3">
                        <img
                          src={imagePreview.image1}
                          alt="Image 1 Preview"
                          className="w-32 h-32 object-cover rounded-lg border"
                        />
                      </div>
                    )}

                    <input
                      type="text"
                      name="altText1"
                      placeholder="Describe this image for accessibility..."
                      value={formData.altText1}
                      onChange={handleInputChange}
                      className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2 */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 space-y-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-teal-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">2</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900">Section 2</h3>
                <span className="text-red-500 text-sm">*</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Subheading 2
                    </label>
                    <input
                      type="text"
                      name="subheading2"
                      value={formData.subheading2}
                      onChange={handleInputChange}
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200"
                      placeholder="Enter subheading 2..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Content 2
                    </label>
                    <textarea
                      name="content2"
                      rows={6}
                      value={formData.content2}
                      onChange={handleInputChange}
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200 resize-none"
                      placeholder="Write content for section 2..."
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Image 2
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange(e, 'image2')}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600 transition-all duration-200 cursor-pointer"
                    />

                    {imagePreview.image2 && (
                      <div className="mt-3">
                        <img
                          src={imagePreview.image2}
                          alt="Image 2 Preview"
                          className="w-32 h-32 object-cover rounded-lg border"
                        />
                      </div>
                    )}

                    <input
                      type="text"
                      name="altText2"
                      placeholder="Describe this image for accessibility..."
                      value={formData.altText2}
                      onChange={handleInputChange}
                      className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3 (Optional) */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 space-y-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">3</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900">Section 3 (Optional)</h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Subheading 3
                    </label>
                    <input
                      type="text"
                      name="subheading3"
                      value={formData.subheading3}
                      onChange={handleInputChange}
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200"
                      placeholder="Enter subheading 3..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Content 3
                    </label>
                    <textarea
                      name="content3"
                      rows={6}
                      value={formData.content3}
                      onChange={handleInputChange}
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200 resize-none"
                      placeholder="Write content for section 3..."
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Image 3
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange(e, 'image3')}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600 transition-all duration-200 cursor-pointer"
                    />

                    {imagePreview.image3 && (
                      <div className="mt-3">
                        <img
                          src={imagePreview.image3}
                          alt="Image 3 Preview"
                          className="w-32 h-32 object-cover rounded-lg border"
                        />
                      </div>
                    )}

                    <input
                      type="text"
                      name="altText3"
                      placeholder="Describe this image for accessibility..."
                      value={formData.altText3}
                      onChange={handleInputChange}
                      className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Links & SEO */}
          <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">3</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Links & SEO</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Links */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Links</h3>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Interlinks (Related Articles)
                  </label>
                  <div className="space-y-3">
                    {formData.interlinks.map((link, index) => (
                      <input
                        key={index}
                        type="url"
                        value={link}
                        onChange={(e) => handleArrayInputChange(index, 'interlinks', e.target.value)}
                        placeholder={`Related article link ${index + 1}`}
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200"
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    External Links
                  </label>
                  <div className="space-y-3">
                    {formData.externalLinks.map((link, index) => (
                      <input
                        key={index}
                        type="url"
                        value={link}
                        onChange={(e) => handleArrayInputChange(index, 'externalLinks', e.target.value)}
                        placeholder={`External resource link ${index + 1}`}
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200"
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* SEO */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">SEO</h3>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Meta Description
                  </label>
                  <textarea
                    name="metaDescription"
                    rows={4}
                    value={formData.metaDescription}
                    onChange={handleInputChange}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200 resize-none"
                    placeholder="Brief description for search engines..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Focus Keywords
                  </label>
                  <input
                    type="text"
                    name="focusKeywords"
                    value={formData.focusKeywords}
                    onChange={handleInputChange}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200"
                    placeholder="keyword1, keyword2, keyword3"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center space-x-4 pt-8">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="px-8 py-3 border-2 border-gray-300 rounded-lg shadow-md text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold transform hover:scale-105"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>{editingBlog ? 'Saving Changes...' : 'Creating Post...'}</span>
                </div>
              ) : (
                editingBlog ? 'Save Changes' : 'Create Blog Post'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminBlog; 