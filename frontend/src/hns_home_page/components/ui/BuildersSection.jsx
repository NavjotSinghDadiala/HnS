import API_BASE_URL from '../../../config';
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../home_page_css/BuildersSection.css";
import SectionHeading from './SectionHeading';
import { useGeolocation, reverseGeocodeToArea } from '../../../hooks/useGeolocation';

const DEFAULT_TABS = [
  { label: "Thane", key: "thane" },
  { label: "Airoli", key: "airoli" },
  { label: "Ghansoli", key: "ghansoli" },
  { label: "Koparkharaine", key: "koparkharaine" },
];

// Helper to robustly parse price in Cr from string
function parsePriceInCr(priceStr) {
  if (!priceStr) return 0;
  let val = priceStr.toString().replace(/₹|,|\+|\s/g, '').toLowerCase();
  try {
    if (val.includes('cr')) {
      return parseFloat(val.replace('cr', ''));
    } else if (val.includes('lakh')) {
      return parseFloat(val.replace('lakh', '')) / 100;
    } else {
      return parseFloat(val);
    }
  } catch {
    return 0;
  }
}

const BuildersSection = ({ searchFilters }) => {
  const [activeTab, setActiveTab] = useState("thane");
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tabs, setTabs] = useState(DEFAULT_TABS);
  const [userLocation, setUserLocation] = useState(null);

  const tabRowRef = useRef(null);
  const cardsRowRef = useRef(null);

  // Get user's geolocation
  const geo = useGeolocation();

  // On mount or when geolocation changes, detect user's area and fetch nearby areas
  useEffect(() => {
    const detectLocationAndFetchNearby = async () => {
      if (!geo.latitude || !geo.longitude) return;

      try {
        // Step 1: Determine the area from coordinates
        const detectedArea = await reverseGeocodeToArea(geo.latitude, geo.longitude);
        setUserLocation(detectedArea);

        // Step 2: Fetch nearby areas from backend
        const response = await fetch(
          `${API_BASE_URL}/api/nearest-nodes/${detectedArea}`
        );
        const nearbyData = await response.json();

        if (nearbyData.nearestNodes) {
          // Create tabs for user's location + nearby areas
          const nearbyLocations = [detectedArea, ...nearbyData.nearestNodes];
          const newTabs = nearbyLocations.map((loc) => ({
            label: loc.charAt(0).toUpperCase() + loc.slice(1),
            key: loc.toLowerCase().replace(/\s+/g, ''),
          }));

          setTabs(newTabs);
          setActiveTab(newTabs[0].key); // Set active to user's current location
        }
      } catch (err) {
        console.error('Error detecting location:', err);
        // Fallback to default tabs
        setTabs(DEFAULT_TABS);
      }
    };

    detectLocationAndFetchNearby();
  }, [geo.latitude, geo.longitude]);

  // Fetch properties whenever activeTab changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Find the full location name from tabs
        const tabData = tabs.find(t => t.key === activeTab);
        const locationQuery = tabData ? tabData.label.toLowerCase() : activeTab;

        const res = await fetch(
          `${API_BASE_URL}/api/properties/location/${locationQuery}`
        );
        const data = await res.json();
        // Add Existing_Configurations to mapped data
        const mapped = data.map((p) => ({
          id: p.id,
          name: p.Property_Name,
          img: p.image || "/fallback.png",
          projects: p.projects || "N/A Projects",
          price: p.Price_Starting_From || "N/A",
          Existing_Configurations: p.Existing_Configurations || [],
        }));
        setAreas(mapped);
        setError(null);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to fetch properties");
        setAreas([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeTab, tabs]);


  const navigate = useNavigate();

  const handleCardClick = (area) => {
    // Store property data in localStorage and update recently viewed
    const propertyData = {
      id: area.id,
      name: area.name,
      projects: area.projects,
      price: area.price,
      img: area.img,
      clickedAt: new Date().toISOString()
    };
    localStorage.setItem('lastClickedProperty', JSON.stringify(propertyData));
    let recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewedProperties') || '[]');
    const existingIndex = recentlyViewed.findIndex(p => p.id === area.id);
    if (existingIndex !== -1) {
      recentlyViewed.splice(existingIndex, 1);
    }
    recentlyViewed.unshift(propertyData);
    recentlyViewed = recentlyViewed.slice(0, 5);
    localStorage.setItem('recentlyViewedProperties', JSON.stringify(recentlyViewed));
    navigate('/properties');
  };

  return (
    <section className="landing-section bg-cream builders-section">
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h2 style={{
          fontSize: '2.5rem',
          fontWeight: 800,
          color: '#223A5F',
          margin: 0,
          letterSpacing: '-0.5px',
          fontFamily: "'Abril Fatface', serif"
        }}>
          Near You
        </h2>
        <span style={{
          display: 'block',
          width: '80px',
          height: '4px',
          background: 'linear-gradient(90deg, #F1D97A 0%, #e6c76a 100%)',
          margin: '12px auto 0',
          borderRadius: '2px',
          boxShadow: '0 2px 4px rgba(241, 217, 122, 0.3)'
        }} />
      </div>

      {/* Tabs */}
      <div className="builders-tab-row-container">
        <div className="builders-tab-row-scrollable" ref={tabRowRef}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`tab-button ${activeTab === tab.key ? "active" : ""}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      <div className="builders-cards-container">
        <div className="builders-cards-row" ref={cardsRowRef}>
          {loading ? (
            <div style={{ padding: "2rem" }}>Loading...</div>
          ) : error ? (
            <div style={{ padding: "2rem", color: "red" }}>{error}</div>
          ) : areas.length === 0 ? (
            <div style={{ padding: "2rem" }}>No properties found</div>
          ) : (
            areas
              .filter(area => {
                // Location filter (by tab)
                const locationMatch = area.projects && area.projects.toLowerCase().includes(activeTab.toLowerCase())
                  || area.name && area.name.toLowerCase().includes(activeTab.toLowerCase());
                if (!locationMatch) return false;
                // Price filter (frontend)
                const priceValue = parsePriceInCr(area.price);
                const priceMatch = !searchFilters.priceRange || (priceValue && priceValue <= searchFilters.priceRange);
                // Type filter (frontend)
                let bhkMatch = true;
                if (searchFilters.bhkTypes && searchFilters.bhkTypes.length > 0) {
                  if (area.Existing_Configurations && Array.isArray(area.Existing_Configurations)) {
                    bhkMatch = searchFilters.bhkTypes.some(type =>
                      area.Existing_Configurations.some(cfg => cfg.type && cfg.type.toLowerCase().includes(type.replace('bhk', ' bhk')))
                    );
                  } else {
                    bhkMatch = false;
                  }
                }
                return priceMatch && bhkMatch;
              })
              .map((area, idx) => (
                <div
                  key={idx}
                  className="builders-property-card group hoverable"
                  style={{ cursor: "pointer" }}
                  onClick={() => handleCardClick(area)}
                >
                  <div
                    className="builders-card-inner"
                    style={{
                      background: `url(${"/palm.jpg"}) center/cover no-repeat`,
                    }}
                  >
                    <div className="builders-card-overlay" />
                    <div className="builders-card-content">
                      <div className="builders-card-title">{area.name}</div>
                      <div className="builders-card-projects">
                        {area.propertyCount} properties under this builder
                      </div>
                      <div className="builders-card-price">{area.price}</div>
                      <div className="builders-card-buttons">
                        <button className="builders-card-btn">See builder</button>
                        <button className="builders-card-btn">See Reviews</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    </section>
  );
};

export default BuildersSection;
