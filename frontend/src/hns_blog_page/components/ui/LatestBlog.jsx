import API_BASE_URL from '../../../config';
import React from "react";
import { Link } from "react-router-dom";
import "../../blog_page_css/Latestblog.css";
import { getBlogTargetFromSlug } from '../../../utils/blogSlug';

const LatestBlog = ({ filteredBlogs }) => {
  if (!filteredBlogs || filteredBlogs.length === 0) {
    return null;
  }

  return (
    <div className="latestblog-wrapper">
      <div className="latestblog-section">
        {/* Featured Blog */}
        {filteredBlogs[0] && (
          <div className="featured-blog">
            <Link to={getBlogTargetFromSlug(filteredBlogs[0].slug)} className="block group" tabIndex={0}>
              <div className="featured-card">
                <div className="relative">
                  <img
                    src={
                      filteredBlogs[0].featured_image
                        ? `${API_BASE_URL}/uploads/${filteredBlogs[0].featured_image}`
                        : "/news.jpg"
                    }
                    alt={filteredBlogs[0].featured_image_alt || filteredBlogs[0].title}
                    className="featured-img"
                    onError={(e) => {
                      e.target.src = "/news.jpg";
                    }}
                  />
                  <span className="latest-badge">Latest</span>
                </div>
                <div className="featured-content">
                  <h2 className="featured-title">{filteredBlogs[0].title}</h2>
                  <p className="featured-intro">{filteredBlogs[0].intro_paragraph}</p>
                  <div className="featured-meta">
                    <span>By {filteredBlogs[0].author || "Unknown"}</span>
                    <span className="date">
                      • {new Date(filteredBlogs[0].created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Side Blogs */}
        <div className="side-blogs">
          {filteredBlogs.slice(1, 4).map((blog) => (
            <Link key={blog.id} to={getBlogTargetFromSlug(blog.slug)} className="block group w-full" tabIndex={0}>
              <div className="side-card">
                <span className="side-badge">Featured</span>
                <img
                  src={
                    blog.featured_image
                      ? `${API_BASE_URL}/uploads/${blog.featured_image}`
                      : "/news.jpg"
                  }
                  alt={blog.featured_image_alt || blog.title}
                  className="side-img"
                  onError={(e) => {
                    e.target.src = "/news.jpg";
                  }}
                />
                <div className="side-content">
                  <h3 className="side-title">{blog.title}</h3>
                  <p className="side-intro">{blog.intro_paragraph}</p>
                  <div className="side-meta">
                    By {blog.author || "Unknown"} • {new Date(blog.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LatestBlog;
