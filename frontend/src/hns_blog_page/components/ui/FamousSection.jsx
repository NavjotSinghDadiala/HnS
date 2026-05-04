import React from 'react';
import { Link } from 'react-router-dom';
import "../../blog_page_css/FamousSection.css";
import { getBlogTargetFromSlug } from '../../../utils/blogSlug';

const FamousSection = () => {
  const famous = [
    {
      id: 1,
      featured_image: '/capsule.jpeg',
      featured_image_alt: 'Capsule Residences',
      title: 'Capsule Residences',
      slug: 'capsule-residences',
      created_at: '2022-11-15T00:00:00Z',
      intro_paragraph: 'Discover modern living at Capsule Residences, where innovative design meets comfort and convenience in every detail.'
    },
    {
      id: 2,
      featured_image: '/famous.jpg',
      featured_image_alt: 'Famous Heights',
      title: 'Famous Heights',
      slug: 'famous-heights',
      created_at: '2023-02-10T00:00:00Z',
      intro_paragraph: 'Famous Heights offers premium apartments with breathtaking views, top-notch amenities, and a vibrant community atmosphere.'
    },
    {
      id: 3,
      featured_image: '/hanging.webp',
      featured_image_alt: 'Hanging Gardens Towers',
      title: 'Hanging Gardens Towers',
      slug: 'hanging-gardens-towers',
      created_at: '2023-05-20T00:00:00Z',
      intro_paragraph: 'Experience luxury at Hanging Gardens Towers, featuring lush green spaces, modern architecture, and a prime city location.'
    },
  ];

  return (
    <div className="famous-section">
      <h2 className="famous-heading">
        Curated Picks Just for You
      </h2>

      <div className="famous-cards">
        {famous.map((blog) => (
          <div key={blog.id} className="famous-card group">
            <div className="famous-img-container">
              <img
                src={blog.featured_image}
                alt={blog.featured_image_alt || blog.title}
                className="famous-img"
              />
              <div className="famous-img-overlay"></div>
            </div>

            <div className="famous-card-body">
              <h3 className="famous-title">{blog.title}</h3>
              <div className="famous-date">
                <span>{new Date(blog.created_at).toLocaleDateString()}</span>
              </div>
              <p className="famous-intro">{blog.intro_paragraph?.slice(0, 80)}...</p>
              <div className="famous-link">
                <Link to={getBlogTargetFromSlug(blog.slug)} className="famous-view">View Post</Link>
                <svg className="famous-arrow" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FamousSection;
