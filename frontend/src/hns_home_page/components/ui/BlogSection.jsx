import API_BASE_URL from '../../../config';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchBlogs } from '../../../services/api';

const fallbackFeatured = {
  img: '/building.webp',
  title: 'Real Estate Market Update: Q2 Trends & Insights',
  subtitle: 'A snapshot of current property prices, demand, and buyer behavior.',
  tagline: 'Stay ahead of the curve with every curve!',
  button: 'View Article',
};

const fallbackArticles = [
  {
    img: '/kalpa.jpg',
    title: 'Paperwork During Buying Property',
    subtitle: '10 Documents You Need for Property Purchase',
    icon: '→',
  },
  {
    img: 'palm.jpg',
    title: "Home Buying 101: A Beginner's Guide",
    subtitle: 'Start smart, buy smarter',
  },
  {
    img: 'presidental.jpeg',
    title: 'Down Payment Demystified',
    subtitle: 'How much down payment is ideal, and how it impacts your loan burden.',
  },
  {
    img: 'rustomujee.jpg',
    title: 'What is CIBIL Score and Why It Matters?',
    subtitle: 'Learn how your credit score impacts your home loan approval.',
  },
  {
    img: 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=800&q=80',
    title: 'Why Green Homes Are the New Standard',
    subtitle: 'Explore how eco-friendly features are becoming non-negotiable.',
  },
  {
    img: 'lodha.jpg',
    title: 'Top 7 Questions to ask a Builder before Booking',
    subtitle: 'Don\'t fall for the brochure—know what really matters.',
  },
];

const BlogSection = ({ id }) => {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const loadBlogs = async () => {
      try {
        const data = await fetchBlogs({ live: true });
        if (isMounted) {
          setBlogs(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Failed to refresh blogs:', error);
      }
    };

    loadBlogs();
    const intervalId = setInterval(loadBlogs, 30000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  const featured = useMemo(() => {
    if (!blogs.length) {
      return fallbackFeatured;
    }
    const first = blogs[0];
    return {
      img: first.featured_image ? `${API_BASE_URL}/uploads/${first.featured_image}` : '/news.jpg',
      title: first.title || 'Untitled Blog',
      subtitle: first.intro_paragraph || 'Read the latest real estate insights.',
      tagline: 'Fresh updates from our blog',
      button: 'View Article',
      slug: first.slug,
    };
  }, [blogs]);

  const articles = useMemo(() => {
    if (blogs.length <= 1) {
      return fallbackArticles;
    }
    return blogs.slice(1, 7).map((blog) => ({
      img: blog.featured_image ? `${API_BASE_URL}/uploads/${blog.featured_image}` : '/news.jpg',
      title: blog.title || 'Untitled Blog',
      subtitle: blog.intro_paragraph || 'Tap to read this article.',
      slug: blog.slug,
    }));
  }, [blogs]);

  const handleFeaturedClick = () => {
    if (featured.slug) {
      navigate(`/blog/${featured.slug}`);
    }
  };

  const handleArticleClick = (article) => {
    if (article.slug) {
      navigate(`/blog/${article.slug}`);
    }
  };

  return (
    <section id={id} className="blog-section">
      <div className="section-header">
        <h2 className="section-title">
          Know Before You Buy
        </h2>
        <span className="section-underline" />
      </div>

      {/* Featured Article Card */}
      <div className="featured-card">
        <img src={featured.img} alt={featured.title} className="featured-image" />
        <div className="featured-overlay" />
        <div className="latest-badge">LATEST</div>
        <div className="featured-content">
          <h2 className="featured-title">{featured.title}</h2>
          <p className="featured-subtitle">{featured.subtitle}</p>
          <p className="featured-tagline">{featured.tagline}</p>
          <button className="featured-button" onClick={handleFeaturedClick}>
            VIEW ARTICLE
          </button>
        </div>
      </div>

      {/* Grid of Other Articles */}
      <div className="articles-grid">
        {articles.map((article, idx) => (
          <button
            key={idx}
            className="article-card"
            onClick={() => handleArticleClick(article)}
          >
            <img src={article.img} alt={article.title} className="article-image" />
            <div className="article-content">
              <h3 className="article-title">{article.title}</h3>
              <p className="article-subtitle">{article.subtitle}</p>
            </div>
          </button>
        ))}
      </div>

      <style>{`
        .blog-section {
          padding: 40px 20px;
          max-width: 1200px;
          margin: 0 auto;
          box-sizing: border-box;
        }
        .section-header {
          text-align: center;
          margin-bottom: 60px;
        }
        .section-title {
          font-size: 2.5rem;
          font-weight: 800;
          color: #223A5F;
          margin: 0;
          letter-spacing: -0.5px;
          font-family: "'Abril Fatface', serif";
        }
        .section-underline {
          display: block;
          width: 80px;
          height: 4px;
          background: linear-gradient(90deg, #F1D97A 0%, #e6c76a 100%);
          margin: 12px auto 0;
          border-radius: 2px;
          box-shadow: 0 2px 4px rgba(241, 217, 122, 0.3);
        }
        
        /* --- Featured Card Styles --- */
        .featured-card {
          width: 100%;
          height: 450px;
          border-radius: 24px;
          overflow: hidden;
          position: relative;
          display: block;
          cursor: pointer;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          text-align: left;
          margin-bottom: 48px;
          background: #223A5F;
        }
        .featured-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(34, 58, 95, 0.2);
        }
        .featured-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s ease;
        }
        .featured-card:hover .featured-image {
          transform: scale(1.05);
        }
        .featured-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%);
          z-index: 2;
        }
        .latest-badge {
          position: absolute;
          left: 0;
          top: 0;
          z-index: 3;
          background: #F9D87A;
          color: #223A5F;
          font-weight: 700;
          font-size: 13px;
          border-radius: 0 0 16px 0;
          padding: 10px 20px;
          letter-spacing: 1px;
          text-transform: uppercase;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        .featured-content {
          position: absolute;
          left: 32px;
          top: 50%;
          transform: translateY(-50%);
          right: 32px;
          z-index: 3;
          color: #fff;
        }
        .featured-title {
          font-size: 2rem;
          font-weight: 700;
          margin: 0 0 12px 0;
          line-height: 1.2;
          text-shadow: 0 2px 8px rgba(0,0,0,0.6);
          color: #fff;
        }
        .featured-subtitle {
          font-size: 1.1rem;
          margin: 0 0 8px 0;
          opacity: 0.95;
          line-height: 1.4;
          text-shadow: 0 1px 4px rgba(0,0,0,0.5);
        }
        .featured-tagline {
          font-size: 1rem;
          font-weight: 600;
          margin: 0 0 24px 0;
          opacity: 0.9;
          font-style: italic;
          text-shadow: 0 1px 4px rgba(0,0,0,0.5);
        }
        .featured-button {
          background: #F9D87A;
          color: #223A5F;
          font-weight: 700;
          font-size: 14px;
          border-radius: 24px;
          padding: 12px 28px;
          border: none;
          cursor: pointer;
          text-transform: uppercase;
          letter-spacing: 1px;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(249, 216, 122, 0.3);
        }
        .featured-button:hover {
          background: #f1d06b;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(249, 216, 122, 0.4);
        }

        /* --- Articles Grid (Desktop First) --- */
        .articles-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        .article-card {
          border: none;
          cursor: pointer;
          text-align: left;
          padding: 0;
          position: relative;
          border-radius: 18px;
          overflow: hidden;
          height: 250px;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          background: #223A5F;
        }
        .article-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(34, 58, 95, 0.15);
        }
        .article-image {
          position: absolute;
          top: 0; left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          z-index: 1;
          transition: transform 0.4s ease;
        }
        .article-card:hover .article-image {
          transform: scale(1.05);
        }
        .article-content {
          padding: 20px;
          color: #fff;
          z-index: 2;
          position: relative;
          background: linear-gradient(0deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%);
        }
        .article-title {
          font-size: 1.1rem;
          font-weight: 700;
          line-height: 1.3;
          margin: 0 0 4px 0;
          text-shadow: 0 2px 4px rgba(0,0,0,0.7);
        }
        .article-subtitle {
          font-size: 0.9rem;
          opacity: 0.9;
          line-height: 1.4;
          margin: 0;
          font-weight: 400;
          text-shadow: 0 1px 2px rgba(0,0,0,0.6);
        }

        /* --- Tablet Responsiveness (426px - 1024px) --- */
        @media (min-width: 426px) and (max-width: 1024px) {
          .featured-card {
            height: 380px;
            margin-bottom: 40px;
          }
          .featured-content {
            left: 24px;
            bottom: 24px;
            right: 24px;
          }
          .featured-title {
            font-size: 1.6rem;
          }
          .featured-subtitle {
            font-size: 1rem;
          }
          .featured-tagline {
            font-size: 0.95rem;
            margin-bottom: 20px;
          }
          .latest-badge {
            font-size: 12px;
            padding: 8px 16px;
          }
          .articles-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .article-card:first-child {
            height: 280px;
          }
          .article-card:first-child .article-title {
            font-size: 1.2rem;
          }
        }

        /* --- Mobile Responsiveness (<= 425px) --- */
        @media (max-width: 425px) {
          .section-title {
            font-size: 2rem;
          }
          .section-header {
            margin-bottom: 40px;
          }
          .featured-card {
            height: 320px;
            margin-bottom: 32px;
            border-radius: 18px;
          }
          .featured-content {
            left: 20px;
            bottom: 20px;
            right: 20px;
          }
          .featured-title {
            font-size: 1.3rem;
            margin-bottom: 8px;
          }
          .featured-subtitle {
            font-size: 0.9rem;
            margin-bottom: 6px;
          }
          .featured-tagline {
            font-size: 0.85rem;
            margin-bottom: 16px;
          }
          .featured-button {
            font-size: 12px;
            padding: 10px 20px;
          }
          .latest-badge {
            font-size: 11px;
            padding: 8px 14px;
            border-radius: 0 0 12px 0;
          }
          .articles-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          .article-card {
            flex-direction: row;
            height: auto;
            min-height: 120px;
            background: #ffffff;
            border: 1px solid #e0e0e0;
          }
          .article-card:hover {
             box-shadow: 0 4px 12px rgba(34, 58, 95, 0.1);
          }
          .article-image {
            position: relative;
            width: 100px;
            height: auto;
            flex-shrink: 0;
            object-fit: cover;
          }
          .article-card:hover .article-image {
            transform: none;
          }
          .article-content {
            color: #223A5F;
            background: none;
            padding: 16px;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }
          .article-title {
            font-size: 1rem;
            text-shadow: none;
          }
          .article-subtitle {
            font-size: 0.85rem;
            color: #556278;
            opacity: 1;
            text-shadow: none;
          }
        }

        /* --- Extra Small Mobile (<= 375px) --- */
        @media (max-width: 375px) {
          .featured-card {
            height: 280px;
          }
          .featured-title {
            font-size: 1.15rem;
          }
          .featured-subtitle {
            font-size: 0.85rem;
          }
          .featured-tagline {
            font-size: 0.8rem;
          }
          .latest-badge {
            font-size: 10px;
            padding: 6px 12px;
          }
        }
      `}</style>
    </section>
  );
};

export default BlogSection;
