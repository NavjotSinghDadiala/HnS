import React from 'react';
import { Link } from 'react-router-dom';
import "../../blog_page_css/TrendingNowSection.css";
import { getBlogTargetFromSlug } from '../../../utils/blogSlug';

const TrendingNowSection = ({ blogs = [] }) => {
  const fallbackItems = [
    {
      id: 'trend1',
      featured_image: '/1484471303-realty-getty.jpg',
      featured_image_alt: 'Navi Mumbai',
      title: 'Navi Mumbai Set for Major Infrastructure Boost',
      category: 'Exclusive',
      badge: 'Hot',
      author: 'Admin',
      created_at: new Date().toISOString(),
      slug: 'navi-mumbai-infra',
    },
    {
      id: 'trend2',
      featured_image: '/Defining-Demand.jpg',
      featured_image_alt: 'Trade Rumors',
      title: "Boeser Trade Rumors: What's the Reality?",
      category: 'Breaking',
      badge: 'Trending',
      author: 'Editor',
      created_at: new Date().toISOString(),
      slug: 'boeser-trade-rumors',
    },
    {
      id: 'trend3',
      featured_image: '/news.jpg',
      featured_image_alt: 'Real Estate Market',
      title: 'Maharashtra Real Estate Market Hits New High',
      category: 'Market',
      badge: 'New',
      author: 'Reporter',
      created_at: new Date().toISOString(),
      slug: 'maharashtra-market-high',
    },
  ];

  const trendingItems = blogs.length > 0
    ? blogs.slice(0, 3).map((blog) => ({
      id: blog.id,
      featured_image: blog.featured_image ? `/uploads/${blog.featured_image}` : '/news.jpg',
      featured_image_alt: blog.featured_image_alt || blog.title,
      title: blog.title,
      category: 'Trending',
      badge: 'Hot',
      author: blog.author || 'Unknown',
      created_at: blog.created_at,
      slug: blog.slug,
    }))
    : fallbackItems;

  return (
    <section className="trending-section">
      <div className="trending-header">
        <div className="icon-wrapper">
          <svg className="trending-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        <h2 className="trending-title">Trending Now</h2>
      </div>

      <div className="trending-cards-container">
        {trendingItems.map((news) => (
          <Link key={news.id} to={getBlogTargetFromSlug(news.slug)} className="trending-card-link">
            <article className="trending-card">
              <div className="card-image-wrapper">
                {news.badge && (
                  <span className={`badge badge-${news.badge.toLowerCase()}`}>
                    {news.badge}
                  </span>
                )}
                <img
                  src={news.featured_image}
                  alt={news.featured_image_alt || news.title}
                  className="card-image"
                  loading="lazy"
                />
              </div>

              <div className="card-content">
                <div className="card-meta-top">
                  <span className="meta-category">{news.category}</span>
                  <span className="meta-dot">•</span>
                  <span className="meta-date">{new Date(news.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                </div>

                <h3 className="card-title">{news.title}</h3>

                <div className="card-footer">
                  <span className="author-name">By {news.author}</span>
                  <div className="read-more-btn">
                    <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </div>
                </div>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default TrendingNowSection;