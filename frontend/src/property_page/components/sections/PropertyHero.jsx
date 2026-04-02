import React, { useState, useEffect } from "react";
import { Heart, Star } from "lucide-react";
import { useParams } from "react-router-dom";
import { useCart } from "../../../hns_cart_page/js/CartContent.jsx";
import propertyHero from "../../../assets/property-hero.jpg";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import "../../../hns_home_page/home_page_css/PropertiesSection.css";

// Heart Icon Component (matching PropertiesSection style)
const HeartIcon = ({ filled }) => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const PropertyHero = ({ propertyData: propPropertyData }) => {
  const { id } = useParams();
  const { addToCart, removeFromCart, isInCart } = useCart();
  const [propertyData, setPropertyData] = useState(null);

  // Use prop data if available, otherwise fallback to localStorage or default
  useEffect(() => {
    if (propPropertyData) {
      // Map API data to component expected format
      setPropertyData({
        id: propPropertyData.id,
        Property_Name: propPropertyData.Property_Name,
        Location: propPropertyData.Location,
        Existing_Configurations: propPropertyData.Existing_Configurations,
        Price_Starting_From: propPropertyData.Price_Starting_From,
        img: propertyHero // Use default image for now
      });
    } else {
      try {
        const lastClicked = localStorage.getItem('lastClickedProperty');
        if (lastClicked) {
          const parsed = JSON.parse(lastClicked);
          setPropertyData(parsed);
        } else {
          // Fallback to default property data
          setPropertyData({
            id: id || 'default-property',
            Property_Name: 'Neelkanth Palm Avenue',
            Location: 'Neelkanth Palm Avenue, Ghansoli, Navi Mumbai',
            Existing_Configurations: '2-4 BHK',
            Price_Starting_From: '₹45 Lakh - ₹1.2 Cr',
            img: propertyHero
          });
        }
      } catch (error) {
        console.error('Error loading property data:', error);
        // Fallback to default
        setPropertyData({
          id: id || 'default-property',
          Property_Name: 'Neelkanth Palm Avenue',
          Location: 'Neelkanth Palm Avenue, Ghansoli, Navi Mumbai',
          Existing_Configurations: '2-4 BHK',
          Price_Starting_From: '₹45 Lakh - ₹1.2 Cr',
          img: propertyHero
        });
      }
    }
  }, [propPropertyData, id]);

  const scrollToMap = () => {
    const mapElement = document.getElementById('map-location');
    if (mapElement) {
      mapElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleHeartClick = (e) => {
    e.stopPropagation();
    if (!propertyData) return;
    
    if (isInCart(propertyData.id)) {
      removeFromCart(propertyData.id);
    } else {
      // Convert to property format for cart
      const propertyForCart = {
        id: propertyData.id,
        name: propertyData.Property_Name,
        address: propertyData.Location,
        location: propertyData.Location,
        price: propertyData.Price_Starting_From,
        img: propertyData.img || propertyHero,
        image: propertyData.img || propertyHero,
        features: propertyData.Existing_Configurations || '2-4 BHK',
        bhk: propertyData.Existing_Configurations || '2-4 BHK',
        area: propertyData.Carpet_Area || '685.3 sq.ft. to 715.5 sq.ft.',
        amenities: propertyData.Key_Highlights || [],
        status: 'Available'
      };
      addToCart(propertyForCart, 'featured');
    }
  };

  const isPropertyInCart = propertyData ? isInCart(propertyData.id) : false;

  return (
    <section className="px-4 sm:px-6 md:px-8 lg:px-16 py-6 sm:py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-start">
        {/* Property Image */}
        <div className="relative">
          <img 
            src={propertyData?.img || propertyHero} 
            alt={propertyData?.Property_Name || "Neelkanth Palm Avenue"} 
            className="w-full h-[300px] md:h-[400px] lg:h-[500px] object-cover rounded-lg" 
          />
          <button
            onClick={handleHeartClick}
            className={`property-heart-button ${isPropertyInCart ? 'in-cart' : ''}`}
            style={{
              position: 'absolute',
              top: '14px',
              left: '14px',
              zIndex: 10
            }}
            aria-label={isPropertyInCart ? 'Remove from cart' : 'Add to cart'}
          >
            <HeartIcon filled={isPropertyInCart} />
          </button>
          <div className="absolute top-4 right-4 bg-yellow-400 px-3 py-1 rounded-lg flex items-center gap-1">
            <Star className="w-4 h-4 text-gray-900 fill-current" />
            <span className="font-bold text-gray-900">95%</span>
          </div>
        </div>
        
        {/* Property Details */}
        <div className="space-y-4 sm:space-y-6">
          {/* Badges */}
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Badge variant="outline" className="bg-yellow-100 border-yellow-300 text-gray-900 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">Home</Badge>
            <Badge variant="outline" className="bg-yellow-100 border-yellow-300 text-gray-900 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">OC Verified</Badge>
            <Badge variant="outline" className="bg-yellow-100 border-yellow-300 text-gray-900 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">CC Verified</Badge>
            <Badge variant="outline" className="bg-yellow-100 border-yellow-300 text-gray-900 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">RERA Verified</Badge>
            <Badge variant="outline" className="bg-yellow-100 border-yellow-300 text-gray-900 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">2-4 BHK</Badge>
          </div>
          
          {/* Title and Address */}
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 leading-tight">
              {propertyData?.Property_Name || 'Neelkanth Palm Avenue'}
            </h1>
            <div className="space-y-2">
              <p 
                className="text-sm sm:text-base md:text-lg text-gray-600 cursor-pointer hover:text-blue-600 transition-colors" 
                onClick={scrollToMap}
              >
                📍 {propertyData?.Location || 'Neelkanth Palm Avenue, Ghansoli, Navi Mumbai'}
              </p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">
                {propertyData?.Price_Starting_From || '₹45 Lakh - ₹1.2 Cr'}
              </p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Button variant="outline" className="border-blue-500 text-blue-600 hover:bg-blue-50 rounded-full px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base">
              Add to My List
            </Button>
            <Button className="bg-yellow-400 text-gray-900 hover:bg-yellow-500 rounded-full px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base">
              Request Visit
            </Button>
          </div>
        
          {/* Property Detail Boxes */}
          <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-2 sm:gap-4 mt-4 sm:mt-6 md:mt-8">
            {/* Carpet Area Box */}
            <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 md:p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2M16 4h2a2 2 0 012 2v2M16 20h2a2 2 0 002-2v-2" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">Carpet Area</h3>
                  <p className="text-xs text-gray-500 mb-2">Upto 2 L</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-lg font-bold text-gray-900">685.3 sq.ft. to</p>
                <p className="text-lg font-bold text-gray-900">715.5 sq.ft.</p>
              </div>
              <button className="text-blue-600 text-xs font-medium mt-2 hover:underline">
                View more rates →
              </button>
            </div>

            {/* Pricing Box */}
            <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 md:p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">Pricing</h3>
                  <p className="text-xs text-gray-500 mb-2">Upto 2 L</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-lg font-bold text-gray-900">1.56 Cr +</p>
                <p className="text-sm text-gray-600">[Negotiable]</p>
              </div>
              <button className="text-blue-600 text-xs font-medium mt-2 hover:underline">
                View detailed pricing →
              </button>
            </div>

            {/* Highlights Box */}
            <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 md:p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">Highlights</h3>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div><span className="text-sm text-gray-700">Railway station</span></div>
                <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div><span className="text-sm text-gray-700">Hospital</span></div>
                <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div><span className="text-sm text-gray-700">Schools</span></div>
              </div>
              <button className="text-blue-600 text-xs font-medium mt-2 hover:underline">
                View more nearby details →
              </button>
            </div>

            {/* Extra Charges Box */}
            <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 md:p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">Extra Charges</h3>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div><span className="text-sm text-gray-700">Application Fee</span></div>
                <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div><span className="text-sm text-gray-700">Parking Fee</span></div>
              </div>
              <button className="text-blue-600 text-xs font-medium mt-2 hover:underline">
                View detailed breakdown →
              </button>
            </div>
          
          </div>
        </div>
      </div>
    </section>
  );
};

export default PropertyHero;