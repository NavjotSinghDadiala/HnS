import API_BASE_URL from './config';
import React, { useEffect, useState, useRef } from 'react';
import { fetchBlogs } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import { FaUserCircle, FaBars, FaChevronLeft, FaChevronRight, FaHome } from 'react-icons/fa';
import { getBlogTargetFromSlug } from './utils/blogSlug';

const categoryCarousel = [
  {
    title: 'Reality Check',
    subtitle: 'Avoid Costly Mistakes →',
    img: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=facearea&w=64&h=64',
  },
  {
    title: 'Market Watch',
    subtitle: 'Read On →',
    img: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=facearea&w=64&h=64',
  },
  {
    title: "Buyer's Playbook",
    subtitle: 'New to Home Buying? →',
    img: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=facearea&w=64&h=64',
  },
  {
    title: 'Builder Insights',
    subtitle: 'Are You Trusting  Right?',
    img: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=facearea&w=64&h=64',
  },
  {
    title: 'Gabie Sheber',
    subtitle: 'Blog title long...',
    img: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=facearea&w=64&h=64',
  },
];

const BlogLanding = () => {
  const [blogs, setBlogs] = useState([]);
  const [category, setCategory] = useState('All');
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef();
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/');
  };

  useEffect(() => {
    fetchBlogs().then(setBlogs).catch(console.error);
  }, []);

  // Close menu on outside click
  useEffect(() => {
    if (!mobileMenuOpen) return;
    function handleClick(e) {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [mobileMenuOpen]);

  // Filter blogs by selected category
  const filteredBlogs = category === "All"
    ? blogs
    : blogs.filter(blog => blog.title && blog.title.toLowerCase().includes(category.toLowerCase()));

  // Helper: get sections
  const latest = filteredBlogs.slice(0, 1);
  const latestSide = filteredBlogs.slice(1, 3);
  const news = filteredBlogs.slice(3, 5);
  // Dummy data for Famous section
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
  const more = filteredBlogs.slice(8, 14);
  const theLatest = filteredBlogs.slice(0, 5);

  // Carousel logic
  const visibleCategories = categoryCarousel.slice(carouselIdx, carouselIdx + 5);
  const canScrollLeft = carouselIdx > 0;
  const canScrollRight = carouselIdx + 5 < categoryCarousel.length;

  return (
    <div className="bg-[#f8f9fa] min-h-screen font-sans">
      {/* Navbar */}
      <div className="bg-[#1a3263] rounded-b-3xl px-8 py-3 flex items-center justify-between relative">
        {/* Logo */}
        <span className="text-white text-2xl font-bold tracking-wide">HousenSeek</span>
        {/* Centered Nav (desktop) */}
        <div className="flex-1 hidden md:flex justify-center gap-10">
          <Link to="/search" className="text-white text-lg hover:underline">Search</Link>
          <Link to="/" className="text-white text-lg hover:underline">Home</Link>
          <Link to="/builders" className="text-white text-lg hover:underline">Builders</Link>
          <Link to="/blogs" className="text-white text-lg hover:underline font-semibold">Blogs</Link>
        </div>
        {/* Hamburger (mobile) */}
        <button className="block md:hidden text-white text-2xl focus:outline-none z-20" onClick={() => setMobileMenuOpen(v => !v)} aria-label="Open navigation menu">
          <FaBars />
        </button>
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div ref={mobileMenuRef} className="absolute top-full left-0 w-full bg-[#1a3263] shadow-lg rounded-b-2xl flex flex-col items-center py-4 animate-fade-in z-30">
            <Link to="/search" className="text-white text-lg py-2 w-full text-center hover:bg-blue-900" onClick={() => setMobileMenuOpen(false)}>Search</Link>
            <Link to="/" className="text-white text-lg py-2 w-full text-center hover:bg-blue-900" onClick={() => setMobileMenuOpen(false)}>Home</Link>
            <Link to="/builders" className="text-white text-lg py-2 w-full text-center hover:bg-blue-900" onClick={() => setMobileMenuOpen(false)}>Builders</Link>
            <Link to="/blogs" className="text-white text-lg py-2 w-full text-center hover:bg-blue-900 font-semibold" onClick={() => setMobileMenuOpen(false)}>Blogs</Link>
          </div>
        )}
      </div>

      {/* Sub-header: Breadcrumbs + User Icon */}
      <div className="bg-[#fdf8ef] flex items-center justify-between px-8 py-3">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <button
            type="button"
            onClick={handleBack}
            className="text-lg hover:text-gray-600 transition-colors"
            aria-label="Go back"
          >
            <FaChevronLeft />
          </button>
          <FaHome className="text-gray-300" />
          <span className="mx-1">View Builders</span>
          <FaChevronRight />
          <span>Neelkanth Palm Avenue</span>
          <FaChevronRight />
          <span className="text-gray-700 font-semibold">Detail</span>
        </div>
        {/* User Icon */}
        <FaUserCircle className="text-2xl text-gray-700" />
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div ref={mobileMenuRef} className="absolute top-full left-0 w-full bg-[#1a3263] shadow-lg rounded-b-2xl flex flex-col items-center py-4 animate-fade-in z-30">
          <Link to="/search" className="text-white text-lg py-2 w-full text-center hover:bg-blue-900" onClick={() => setMobileMenuOpen(false)}>Search</Link>
          <Link to="/" className="text-white text-lg py-2 w-full text-center hover:bg-blue-900" onClick={() => setMobileMenuOpen(false)}>Home</Link>
          <Link to="/builders" className="text-white text-lg py-2 w-full text-center hover:bg-blue-900" onClick={() => setMobileMenuOpen(false)}>Builders</Link>
          <Link to="/blogs" className="text-white text-lg py-2 w-full text-center hover:bg-blue-900 font-semibold" onClick={() => setMobileMenuOpen(false)}>Blogs</Link>
        </div>
      )}

      <div className="max-w-[1320px] mx-auto p-4 grid grid-cols-12 gap-4">
        {/* Left 4 cards */}
        <div className="col-span-4 grid grid-cols-2 gap-4">
          {[
            {
              title: "How to compare interiors?",
              subtitle: "Look into Interiors with us!",
              image: "/interior.jpeg",
            },
            {
              title: "Pre-Launch or Ready-to-Move?",
              subtitle: "Weigh your wait vs value.",
              image: "/prelaunch.jpeg",
            },
            {
              title: "How Much House Can You Afford?",
              subtitle: "Budgeting tools that do the math.",
              image: "/afford.jpeg",
            },
            {
              title: "How to correctly search homes?",
              subtitle: "The correct way to find!",
              image: "/search-homes.jpeg",
            },
          ].map((card, index) => (
            <div
              key={index}
              className="group relative h-[240px] rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <img
                src={card.image}
                alt={card.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/0 to-black/70 group-hover:from-black/40 group-hover:to-black/80 transition-all duration-300" />
              <div className="absolute bottom-4 left-4 right-4 text-[#f3ecdc]">
                <h3 className="font-['Abril_Fatface'] text-base leading-snug">
                  {card.title}
                </h3>
                <p className="font-['Red_Hat_Display'] text-xs font-semibold opacity-80">
                  {card.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Middle big card */}
        <div className="col-span-4">
          <div className="group relative h-full min-h-[500px] rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <img
              src="/checklist.webp"
              alt="Checklist Before You Commit!"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/0 to-black/70 group-hover:from-black/40 group-hover:to-black/80 transition-all duration-300" />
            <div className="absolute bottom-4 left-4 right-4 text-[#f3ecdc]">
              <h3 className="font-['Abril_Fatface'] text-xl leading-snug">
                Checklist Before You Commit!
              </h3>
              <p className="font-['Red_Hat_Display'] text-sm font-semibold opacity-80">
                Don’t sign anything without this list.
              </p>
            </div>
          </div>
        </div>

        {/* Right 4 cards */}
        <div className="col-span-4 grid grid-cols-2 gap-4">
          {[
            {
              title: "Fake Listings. Real Consequences.",
              subtitle: "Spot scams before they spot you.",
              image: "/fake listing.jpg",
            },
            {
              title: "India’s Most Expensive Homes",
              subtitle: "Jaw-dropping prices. Stunning views.",
              image: "/expensive.jpg",
            },
            {
              title: "Upcoming Projects Worth Watching!",
              subtitle: "The future is already under construction.",
              image: "/upcoming.jpeg",
            },
            {
              title: "Paperwork During Buying Property",
              subtitle: "10 Documents You Need for Property Purchase",
              image: "/paperwork.jpeg",
            },
          ].map((card, index) => (
            <div
              key={index}
              className="group relative h-[240px] rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <img
                src={card.image}
                alt={card.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/0 to-black/70 group-hover:from-black/40 group-hover:to-black/80 transition-all duration-300" />
              <div className="absolute bottom-4 left-4 right-4 text-[#f3ecdc]">
                <h3 className="font-['Abril_Fatface'] text-base leading-snug">
                  {card.title}
                </h3>
                <p className="font-['Red_Hat_Display'] text-xs font-semibold opacity-80">
                  {card.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>



      {/* Main Content Container */}
      <div className="max-w-6xl mx-auto px-4">
        {/* Category Carousel */}
        <div className="py-6 flex items-center justify-center">
          <button
            className={`rounded-full p-2 mx-2 ${canScrollLeft ? 'bg-gray-200 hover:bg-gray-300' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}
            onClick={() => { if (canScrollLeft) { setCarouselIdx(idx => { const newIdx = idx - 1; console.log('carouselIdx:', newIdx); return newIdx; }); } }}
            disabled={!canScrollLeft}
          >
            <FaChevronLeft size={20} />
          </button>
          <div className="flex gap-8 overflow-x-auto scrollbar-hide">
            {visibleCategories.map((cat, idx) => (
              <div key={cat.title} className="flex flex-col items-center min-w-[140px]">
                <img src={cat.img} alt={cat.title} className="w-14 h-14 rounded-2xl shadow mb-2 object-cover" />
                <span className="font-semibold text-sm text-gray-900 text-center">{cat.title}</span>
                <span className="text-xs text-gray-500 text-center">{cat.subtitle}</span>
              </div>
            ))}
          </div>
          <button
            className={`rounded-full p-2 mx-2 ${canScrollRight ? 'bg-gray-200 hover:bg-gray-300' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}
            onClick={() => { if (canScrollRight) { setCarouselIdx(idx => { const newIdx = idx + 1; console.log('carouselIdx:', newIdx); return newIdx; }); } }}
            disabled={!canScrollRight}
          >
            <FaChevronRight size={20} />
          </button>
        </div>


        {/* News Section + Blogs from backend */}
        <div className="mb-10 bg-gradient-to-br from-gray-100 via-white to-gray-50 rounded-3xl py-6 md:py-10 px-2 md:px-4 border border-gray-200 shadow-xl">
          <div className="flex items-center justify-center mb-8 w-full text-center gap-3">
            <svg className="w-8 h-8 text-red-500 animate-bounce" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7v4H5V7a2 2 0 012-2h10a2 2 0 012 2z" /><path strokeLinecap="round" strokeLinejoin="round" d="M5 11v6a2 2 0 002 2h10a2 2 0 002-2v-6" /></svg>
            <span className="text-3xl font-extrabold bg-gradient-to-r from-red-600 via-orange-500 to-yellow-400 bg-clip-text text-transparent drop-shadow-md">Trending Now</span>
            <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow ml-2">Hot</span>
          </div>
          <div className="flex flex-row gap-6 overflow-x-auto scrollbar-hide">
            {filteredBlogs.slice(0, 6).map((blog) => (
              <Link key={blog.id} to={getBlogTargetFromSlug(blog.slug)} className="block group min-w-[320px] md:min-w-[350px]" tabIndex={0} style={{ textDecoration: 'none' }}>
                <div className="relative bg-white rounded-2xl border border-gray-200 shadow-xl flex flex-col w-[320px] md:w-[350px] min-w-[320px] md:min-w-[350px] h-[260px] md:h-[340px] transition-transform hover:-translate-y-1 hover:shadow-2xl duration-300 group overflow-hidden">
                  <div className="relative">
                    <div className="relative w-full h-52 overflow-hidden rounded-t-2xl">
                      <img
                        src={blog.featured_image ? `${API_BASE_URL}/uploads/${blog.featured_image}` : 'https://via.placeholder.com/600x400?text=No+Image'}
                        alt={blog.featured_image_alt || blog.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-125 shadow-lg"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent rounded-t-2xl pointer-events-none"></div>
                    </div>
                    {/* Only one badge per card, with meaningful color */}
                    <span className="absolute top-3 right-3 flex items-center gap-1 bg-gradient-to-r from-blue-600 to-blue-400 text-white text-sm font-extrabold px-4 py-1 rounded-full shadow-xl border-2 border-white tracking-widest uppercase z-30" style={{ letterSpacing: '0.08em' }}>
                      Trending
                    </span>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-bold text-lg mb-2 leading-tight truncate">{blog.title}</h3>
                    <div className="flex items-center text-xs text-gray-400 mb-2">
                      <span>By {blog.author || 'Unknown'}</span>
                      <span className="mx-1">•</span>
                      <span>{new Date(blog.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center mt-auto">
                      <span className="text-blue-600 font-semibold text-xs mr-2">Read More</span>
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>


        </div>

        {/* Famous Section (modern card style) */}
        <div className="mb-10">
          <h2 className="text-3xl font-extrabold mb-6 flex items-center gap-3 justify-center text-center w-full">
            View the
            <span className="bg-gradient-to-r from-blue-700 via-purple-600 to-pink-500 bg-clip-text text-transparent drop-shadow-md">Famous</span>
            <svg className="w-7 h-7 text-pink-500 animate-bounce" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01" /></svg>
          </h2>
          <div className="flex flex-row gap-6 overflow-x-auto scrollbar-hide">
            {famous.map((blog) => (
              <div key={blog.id} className="relative bg-white rounded-2xl border border-gray-200 shadow-xl flex flex-col w-[320px] md:w-[350px] min-w-[320px] md:min-w-[350px] h-[320px] md:h-[400px] transition-transform hover:-translate-y-1 hover:shadow-2xl duration-300 group overflow-hidden">
                <div className="relative">
                  <div className="relative w-full h-40 md:h-64 overflow-hidden rounded-t-2xl">
                    <img
                      src={blog.featured_image}
                      alt={blog.featured_image_alt || blog.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 shadow-lg"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent rounded-t-2xl pointer-events-none"></div>
                  </div>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-bold text-lg mb-2 leading-tight truncate">{blog.title}</h3>
                  <div className="flex items-center text-xs text-gray-400 mb-2">
                    <span>{new Date(blog.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-gray-700 text-xs mb-4">{blog.intro_paragraph?.slice(0, 80)}...</p>
                  <div className="flex items-center mt-auto">
                    <Link to={getBlogTargetFromSlug(blog.slug)} className="text-blue-600 font-semibold text-xs mr-2 hover:underline">View Post</Link>
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Browse by Category (restored) */}
        <div className="mb-16 w-full flex flex-col lg:flex-row gap-8">
          {/* Left Column: Category + Blog Cards */}
          <div className="flex-1">
            <div className="mb-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-3xl font-black mb-1">Browse by <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent">Category</span></h2>
                  <p className="text-gray-600 font-medium">Discover amazing properties by type</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <select className="appearance-none bg-white border-2 border-gray-200 rounded-xl px-6 py-3 pr-12 text-gray-700 font-semibold shadow-sm hover:border-purple-300 focus:border-purple-500 focus:outline-none transition-all duration-300 w-72">
                    <option>🏠 All Project Types</option>
                    <option>🏰 Luxury Homes</option>
                    <option>🏡 Villas</option>
                    <option>🏢 Apartments</option>
                    <option>🏪 Commercial</option>
                  </select>
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

              </div>
            </div>
            {/* Blog Cards */}
            <div className="flex flex-col gap-4 w-full">
              {[
                {
                  id: 1,
                  image: '/capsule.jpeg',
                  title: 'Luxury Living in Palm Avenue',
                  desc: 'Explore the best amenities, spacious rooms, and modern design in Palm Avenue Residences.',
                  author: 'By Jane Realtor',
                  date: 'Mar 25, 2024',
                },
                {
                  id: 2,
                  image: '/famous.jpg',
                  title: 'Green Valley Villas: Nature & Comfort',
                  desc: 'Discover serene surroundings and elegant villas for your family in Green Valley.',
                  author: 'By John Broker',
                  date: 'Mar 22, 2024',
                },
                {
                  id: 3,
                  image: '/hanging.webp',
                  title: 'Skyline Towers: Urban Excellence',
                  desc: 'Experience city life with state-of-the-art facilities and breathtaking views.',
                  author: 'By Mike Mark',
                  date: 'Mar 20, 2024',
                },
                {
                  id: 4,
                  image: '/palm.jpg',
                  title: 'Estate Heights: Premium Apartments',
                  desc: 'Premium apartments with top-notch security and community features.',
                  author: 'By Lisa Homes',
                  date: 'Mar 18, 2024',
                },
                {
                  id: 5,
                  image: '/garden.jpeg',
                  title: 'Hanging Gardens: Green Living',
                  desc: 'Live amidst lush gardens and modern architecture in the heart of the city.',
                  author: 'By Sarah Realty',
                  date: 'Mar 15, 2024',
                },
              ].map((blog) => (
                <div key={blog.id} className="flex flex-row gap-4 items-center bg-white rounded-xl shadow border border-gray-100 py-6 px-2 sm:py-8 sm:px-4 w-full md:w-96 h-28 md:h-36">
                  <img src={blog.image} alt={blog.title} className="w-32 sm:w-40 h-20 sm:h-28 object-cover rounded-lg" />
                  <div className="flex-1 w-full sm:w-auto">
                    <h3 className="font-bold text-base text-gray-900 mb-1 leading-tight">{blog.title}</h3>
                    <p className="text-xs text-gray-600 mb-1 line-clamp-2">{blog.desc}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>{blog.author}</span>
                      <span>•</span>
                      <span>{blog.date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button className="mt-6 px-6 py-2 border border-green-400 text-green-600 rounded-full font-semibold hover:bg-green-50 transition w-fit">VIEW MORE POSTS</button>
          </div>
          {/* Vertical Divider with Advertisement (only on large screens) */}
          <div className="hidden lg:flex flex-col items-center justify-center relative px-6">
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-300" style={{ transform: 'translateX(-50%)' }}></div>
            <div className="relative z-10 flex flex-col items-center mt-16">
              <svg width="60" height="60" fill="none" stroke="#222" strokeWidth="2" viewBox="0 0 48 48">
                <rect x="8" y="20" width="12" height="20" rx="2" />
                <rect x="24" y="12" width="16" height="28" rx="2" />
                <rect x="16" y="8" width="8" height="8" rx="2" />
                <rect x="12" y="28" width="4" height="4" rx="1" />
                <rect x="28" y="20" width="4" height="4" rx="1" />
                <rect x="36" y="20" width="4" height="4" rx="1" />
              </svg>
              <span className="mt-2 font-bold text-sm tracking-wider">ADVERTISEMENT</span>
            </div>
          </div>
          {/* Right Column: Social, Newsletter, Latest */}
          <div className="w-full md:w-96 flex flex-col gap-8">
            {/* Social Icons */}
            <div>
              <h4 className="font-semibold mb-2">Follow Us</h4>
              <div className="flex gap-6 text-gray-700 text-xl mb-2">
                <a href="#" aria-label="Facebook">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22 12c0-5.522-4.477-10-10-10S2 6.478 2 12c0 4.991 3.657 9.128 8.438 9.877v-6.987h-2.54v-2.89h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.242 0-1.632.771-1.632 1.562v1.875h2.773l-.443 2.89h-2.33v6.987C18.343 21.128 22 16.991 22 12z" />
                  </svg>
                </a>
                <a href="#" aria-label="Twitter">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.46 6c-.77.35-1.6.59-2.47.69a4.3 4.3 0 0 0 1.88-2.37 8.59 8.59 0 0 1-2.72 1.04A4.28 4.28 0 0 0 16.11 4c-2.37 0-4.29 1.92-4.29 4.29 0 .34.04.67.11.99C7.69 9.13 4.07 7.38 1.64 4.7c-.37.63-.58 1.36-.58 2.14 0 1.48.75 2.78 1.89 3.54-.7-.02-1.36-.21-1.94-.53v.05c0 2.07 1.47 3.8 3.42 4.19-.36.1-.74.16-1.13.16-.28 0-.54-.03-.8-.08.54 1.68 2.11 2.9 3.97 2.93A8.6 8.6 0 0 1 2 19.54c-.29 0-.57-.02-.85-.05A12.13 12.13 0 0 0 8.29 21.5c7.55 0 11.68-6.26 11.68-11.68 0-.18-.01-.36-.02-.54A8.18 8.18 0 0 0 22.46 6z" />
                  </svg>
                </a>
                <a href="#" aria-label="Instagram">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5A4.25 4.25 0 0 0 20.5 16.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5zm4.25 2.25a5.25 5.25 0 1 1 0 10.5 5.25 5.25 0 0 1 0-10.5zm0 1.5a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5zm6.25 1.25a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
                  </svg>
                </a>
                <a href="#" aria-label="Pinterest">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12c0 4.41 3.13 8.09 7.25 8.09 1.01 0 1.39-.43 1.39-.96v-2.13c-2.95.64-3.57-1.42-3.57-1.42-.92-2.33-2.25-2.95-2.25-2.95-1.84-1.26.14-1.24.14-1.24 2.03.14 3.1 2.09 3.1 2.09 1.81 3.1 4.75 2.2 5.91 1.68.18-1.31.71-2.2 1.29-2.7-2.36-.27-4.85-1.18-4.85-5.25 0-1.16.41-2.11 1.09-2.85-.11-.27-.47-1.36.1-2.84 0 0 .89-.29 2.89 1.09A10.1 10.1 0 0 1 12 6.8c.9.004 1.8.12 2.65.35 2-.98 2.89-1.09 2.89-1.09.57 1.48.21 2.57.1 2.84.68.74 1.09 1.69 1.09 2.85 0 4.08-2.5 4.98-4.87 5.25.73.63 1.38 1.87 1.38 3.77v2.8c0 .53.38.96 1.39.96C18.87 20.09 22 16.41 22 12c0-5.52-4.48-10-10-10z" />
                  </svg>
                </a>
                <a href="#" aria-label="YouTube">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21.8 8.001a2.75 2.75 0 0 0-1.94-1.94C18.2 6 12 6 12 6s-6.2 0-7.86.06a2.75 2.75 0 0 0-1.94 1.94C2 9.7 2 12 2 12s0 2.3.06 3.999a2.75 2.75 0 0 0 1.94 1.94C5.8 18 12 18 12 18s6.2 0 7.86-.06a2.75 2.75 0 0 0 1.94-1.94C22 14.3 22 12 22 12s0-2.3-.06-3.999zM10 15.5v-7l6 3.5-6 3.5z" />
                  </svg>
                </a>
              </div>
              <div className="flex gap-8 text-xs text-gray-500">
                <span>10K</span><span>69K</span><span>45K</span><span>69K</span><span>69K</span>
              </div>
            </div>
            {/* Newsletter */}
            <div>
              <h4 className="font-semibold mb-2">Subscription</h4>
              <p className="text-xs text-gray-500 mb-2">Subscribe to our newsletter and receive a selection of cool articles every week</p>
              <div className="flex gap-2 mb-2">
                <input type="email" placeholder="Enter your email" className="border rounded px-3 py-2 flex-1 text-sm" />
                <button className="bg-gray-900 text-white px-4 py-2 rounded font-semibold">SUBSCRIBE</button>
              </div>
              <div className="flex items-start gap-2 text-xs text-gray-400">
                <input type="checkbox" className="mt-1" />
                <span>By checking this box, you confirm that you read and agree to the terms of use regarding the storage of the data submitted through this form.</span>
              </div>
            </div>
            {/* The Latest (modern style) */}
            <div>
              <h4 className="font-semibold mb-2">The Latest</h4>
              <div className="flex flex-col gap-3">
                {[
                  {
                    id: 1,
                    title: "“Home Loan vs Personal Loan for House Purchase?”",
                    subtitle: "",
                    date: "June 21,2022",
                    read: "2 minute read",
                    image: '/home-loan.webp',
                  },
                  {
                    id: 2,
                    title: "5 Hidden Costs That Surprise Every Buyer.",
                    subtitle: "Stamp duty, GST, parking, registration — simplified.",
                    date: "June 21,2022",
                    read: "2 minute read",
                  },
                  {
                    id: 3,
                    title: "What is Carpet Area, Built Up, and Super Built Up?",
                    subtitle: "With visuals to explain what you actually get.",
                    date: "June 21,2022",
                    read: "2 minute read",
                  },
                  {
                    id: 4,
                    title: "10 Habits That Will Change Your Life for the Better",
                    subtitle: "If envy and jealousy are impacting your friendships",
                    date: "June 21,2022",
                    read: "2 minute read",
                  },
                ].map((item, idx) => (
                  idx === 0 ? (
                    <div key={item.id} className="rounded-lg overflow-hidden mb-1">
                      <div className="relative w-full h-40">
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 flex flex-col justify-end p-4">
                          <h5 className="font-semibold text-white text-base mb-2 leading-tight">{item.title}</h5>
                          <div className="flex items-center gap-3 text-sm text-white">
                            <span>{item.date}</span>
                            <span className="flex items-center gap-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" /></svg>{item.read}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div key={item.id} className="bg-white rounded-lg py-6 px-3 shadow border border-gray-100 w-80">
                      <h5 className="font-bold text-base text-gray-900 mb-1 leading-tight">{item.title}</h5>
                      {item.subtitle && <div className="text-sm text-gray-700 mb-2 font-medium">{item.subtitle}</div>}
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span>{item.date}</span>
                        <span className="flex items-center gap-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" /></svg>{item.read}</span>
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Know Before You Buy Section (classic/original style) */}
        <section className="w-full max-w-6xl mx-auto mb-16 px-2">
          <div className="flex flex-col items-center mb-8 mt-2">
            <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-400 via-pink-400 to-blue-600 rounded-2xl shadow-lg mb-2">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zm0 0V4m0 0C7.582 4 4 7.582 4 12s3.582 8 8 8 8-3.582 8-8-3.582-8-8-8z" />
              </svg>
            </div>
            <h2 className="section-heading">Know Before You Buy</h2>
            <span className="block w-20 h-1 bg-gradient-to-r from-yellow-400 via-pink-400 to-blue-600 rounded-full mt-2"></span>
          </div>
          {/* Featured Card (original style) */}
          <div className="rounded-3xl overflow-hidden mb-8 shadow-xl relative" style={{ backgroundImage: 'url(/estate_homepage.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', minHeight: 220 }}>
            <div className="absolute inset-0 bg-blue-900/70"></div>
            <div className="relative z-10 p-10 md:p-14 flex flex-col h-full min-h-[220px] justify-center">
              <span className="bg-yellow-400 text-blue-900 font-bold text-sm px-4 py-1 rounded-full mb-4 w-fit">Latest</span>
              <h3 className="text-white text-3xl md:text-4xl font-extrabold mb-3 leading-tight">Real Estate Market Update: Q2 Trends & Insights</h3>
              <p className="text-white/90 text-lg font-medium mb-6 max-w-2xl">A snapshot of current property prices, demand, and buyer behavior. <span className="font-bold">Stay ahead of the curve with every curve!</span></p>
              <button className="bg-yellow-400 text-blue-900 font-bold px-8 py-3 rounded-full text-lg shadow hover:bg-yellow-500 transition w-fit">VIEW ARTICLE</button>
            </div>
          </div>
          {/* Grid of Small Cards (original style) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="relative rounded-2xl shadow-md flex flex-col justify-end min-h-[140px] overflow-hidden" style={{ backgroundImage: 'url(/news.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
              <div className="absolute inset-0 bg-black/40 z-0"></div>
              <div className="relative z-10 p-6 flex flex-col justify-end flex-1">
                <h4 className="text-white text-2xl font-extrabold mb-1 leading-tight">Paperwork During Buying Property</h4>
                <p className="text-white/90 text-base mb-2">10 Documents You Need for Property Purchase</p>
              </div>
            </div>
            <div className="relative rounded-2xl shadow-md flex flex-col justify-end min-h-[140px] overflow-hidden" style={{ backgroundImage: 'url(/hanging.webp)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
              <div className="absolute inset-0 bg-black/40 z-0"></div>
              <div className="relative z-10 p-6 flex flex-col justify-end flex-1">
                <h4 className="text-white text-2xl font-extrabold mb-1 leading-tight">Home Buying 101: A Beginner's Guide</h4>
                <p className="text-white/90 text-base mb-2">Start smart, buy smarter</p>
              </div>
            </div>
            <div className="relative rounded-2xl shadow-md flex flex-col justify-end min-h-[140px] overflow-hidden" style={{ backgroundImage: 'url(/property.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
              <div className="absolute inset-0 bg-black/30 z-0"></div>
              <div className="relative z-10 p-6 flex flex-col justify-end flex-1">
                <h4 className="text-white text-2xl font-extrabold mb-1 leading-tight">Down Payment Demystified</h4>
                <p className="text-white/90 text-base mb-2">How much down payment is ideal, and how it impacts your loan burden.</p>
              </div>
            </div>
            <div className="relative rounded-2xl shadow-md flex flex-col justify-end min-h-[140px] overflow-hidden" style={{ backgroundImage: 'url(/palm.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
              <div className="absolute inset-0 bg-black/30 z-0"></div>
              <div className="relative z-10 p-6 flex flex-col justify-end flex-1">
                <h4 className="text-white text-2xl font-extrabold mb-1 leading-tight">What is CIBIL Score and Why It Matters?</h4>
                <p className="text-white/90 text-base mb-2">Learn how your credit score impacts your home loan approval and interest rate.</p>
              </div>
            </div>
            <div className="relative rounded-2xl shadow-md flex flex-col justify-end min-h-[140px] overflow-hidden" style={{ backgroundImage: 'url(/garden.jpeg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
              <div className="absolute inset-0 bg-black/30 z-0"></div>
              <div className="relative z-10 p-6 flex flex-col justify-end flex-1">
                <h4 className="text-white text-2xl font-extrabold mb-1 leading-tight">Why Green Homes Are the New Standard</h4>
                <p className="text-white/90 text-base mb-2">Explore how eco-friendly features are becoming non-negotiable for buyers.</p>
              </div>
            </div>
            <div className="relative rounded-2xl shadow-md flex flex-col justify-end min-h-[140px] overflow-hidden" style={{ backgroundImage: 'url(/presidental.jpeg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
              <div className="absolute inset-0 bg-black/40 z-0"></div>
              <div className="relative z-10 p-6 flex flex-col justify-end flex-1">
                <h4 className="text-white text-2xl font-extrabold mb-1 leading-tight">Top 7 Questions to ask a Builder before Booking</h4>
                <p className="text-white/90 text-base mb-2">Don't fall for the brochure—know what really matters.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default BlogLanding;
