import React from "react";
import { Shield, Check, MapPin, Building2, Calendar } from "lucide-react";
import ResultsNavBar from "../layouts/ResultsNavBar";
import { Card, CardContent } from "../ui/Card";
import Button from "../ui/Button";

import propertyHero from "../../../assets/property-hero.jpg"; // Using as placeholder
import locationMap from "../../../assets/location-map.jpg";

const MainContentSection = ({ propertyData }) => {
  const overviewRef = React.useRef(null);
  const floorPlansRef = React.useRef(null);
  const amenitiesRef = React.useRef(null);
  const mapRef = React.useRef(null);

  const imageSources = React.useMemo(() => [propertyHero], []);
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);

  const [showAllLeftOverview, setShowAllLeftOverview] = React.useState(false);
  const [showAllRightOverview, setShowAllRightOverview] = React.useState(false);

  const overviewData = React.useMemo(() => {
    if (!propertyData) {
      return {
        left: [
          { label: "Possession", value: "Dec 2025" },
          { label: "RERA ID", value: "P51800012345" },
          { label: "Location", value: "Ghansoli" },
          { label: "Config", value: "3 BHK Flat" },
          { label: "Price", value: "₹45L - ₹1.2Cr" }
        ],
        right: [
          { label: "Carpet Area", value: "1250 sq.ft." },
          { label: "Built-up", value: "1260 sq. ft." },
          { label: "Parking", value: "Available" },
          { label: "Approved by", value: "PMC | BBMP" },
          { label: "Loans", value: "SBI | HDFC" }
        ]
      };
    }

    return {
      left: [
        { label: "Possession", value: propertyData.Possession_Date || "TBD" },
        { label: "RERA ID", value: propertyData.RERA_ID || "N/A" },
        { label: "Location", value: propertyData.Location || "Unknown" },
        { label: "Config", value: propertyData.Existing_Configurations || "N/A" },
        { label: "Price", value: propertyData.Price_Starting_From || "Ask for Price" }
      ],
      right: [
        { label: "Carpet Area", value: propertyData.Carpet_Area || "N/A" },
        { label: "Built-up", value: propertyData.Built_up_Area || "N/A" },
        { label: "Parking", value: propertyData.Parking || "N/A" },
        { label: "Approved by", value: propertyData.Approved_by_Authorities || "N/A" },
        { label: "Loans", value: propertyData.Loan_Availability || "N/A" }
      ]
    };
  }, [propertyData]);

  const highlights = React.useMemo(() => {
    if (propertyData?.Key_Highlights) {
      try {
        const parsed = JSON.parse(propertyData.Key_Highlights);
        return Array.isArray(parsed) ? parsed : [propertyData.Key_Highlights];
      } catch {
        return [propertyData.Key_Highlights];
      }
    }
    return [
      "Recently Renovated", "Gated Society", "Visitor Parking", 
      "Corner Property", "Park View", "Maintenance Staff"
    ];
  }, [propertyData]);

  return (
    <section className="py-4 sm:py-8 lg:py-16 bg-gray-50/30">
      <ResultsNavBar 
        amenitiesRef={amenitiesRef}
        overviewRef={overviewRef}
        floorPlansRef={floorPlansRef}
        mapRef={mapRef}
      />
      
      {/* Changed px-2 to px-4 for better mobile gutters */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-4 sm:py-6 lg:py-12">
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          
          {/* === Main Content Column === */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-10">

            {/* Highlights / Amenities Section */}
            <div ref={amenitiesRef} id="amenities" className="bg-white p-5 sm:p-8 rounded-2xl shadow-sm border border-blue-100/50">
              <div className="flex items-center gap-3 mb-5 sm:mb-6">
                <div className="bg-blue-900 rounded-xl w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center shadow-md shadow-blue-900/10">
                  <Shield className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                </div>
                <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Key Highlights</h2>
              </div>
              
              {/* Changed mobile grid to 2 columns for compactness */}
              <div className="grid grid-cols-2 md:grid-cols-2 gap-3 sm:gap-4">
                {highlights.map((highlight, index) => (
                  <div key={index} className="flex items-start sm:items-center gap-2 sm:gap-3 bg-gray-50/80 p-3 sm:p-4 rounded-xl border border-gray-100">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 flex-shrink-0 mt-0.5 sm:mt-0" />
                    <span className="text-xs sm:text-base text-gray-800 font-medium leading-tight">{highlight}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Overview Section */}
            <div ref={overviewRef} id="overview" className="bg-white p-5 sm:p-8 rounded-2xl shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-5 sm:mb-6">
                <div className="inline-flex items-center bg-blue-900 text-white px-4 py-1.5 sm:px-5 sm:py-2.5 rounded-full shadow-md shadow-blue-900/20">
                  <span className="text-sm sm:text-base font-semibold">Overview</span>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                {/* Left Column */}
                <div className="space-y-3">
                  {overviewData.left.map((item, index) => (
                    <div 
                      key={index} 
                      className={`flex justify-between items-center p-3 sm:p-4 rounded-xl bg-gray-50 border border-gray-100 ${!showAllLeftOverview && index >= 3 ? 'hidden md:flex' : 'flex'}`}
                    >
                      <span className="text-xs sm:text-sm text-gray-500 font-medium">{item.label}</span>
                      <span className="text-sm sm:text-base font-bold text-gray-900 text-right">{item.value}</span>
                    </div>
                  ))}
                </div>

                {/* Right Column */}
                <div className="space-y-3">
                  {overviewData.right.map((item, index) => (
                    <div 
                      key={index} 
                      className={`flex justify-between items-center p-3 sm:p-4 rounded-xl bg-gray-50 border border-gray-100 ${!showAllRightOverview && index >= 3 ? 'hidden md:flex' : 'flex'}`}
                    >
                      <span className="text-xs sm:text-sm text-gray-500 font-medium">{item.label}</span>
                      <span className="text-sm sm:text-base font-bold text-gray-900 text-right">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile View Toggle Button */}
              {(overviewData.left.length > 3 || overviewData.right.length > 3) && (
                <div className="md:hidden mt-5">
                  <button
                    onClick={() => {
                      setShowAllLeftOverview(!showAllLeftOverview);
                      setShowAllRightOverview(!showAllRightOverview);
                    }}
                    className="w-full flex items-center justify-center text-blue-600 font-semibold text-sm py-2.5 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-50 transition-all"
                  >
                    {(showAllLeftOverview || showAllRightOverview) ? "Show Less" : "View All Details"}
                  </button>
                </div>
              )}
            </div>

            {/* Description Section */}
            <div className="bg-gradient-to-br from-yellow-50/50 to-white p-5 sm:p-8 rounded-2xl shadow-sm border border-yellow-100">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                Address Details
              </h3>
              <div className="bg-white/80 p-4 rounded-xl border border-yellow-100/50 backdrop-blur-sm">
                <p className="text-sm sm:text-base text-gray-800 font-medium mb-2">001, Ghansoli, Navi Mumbai</p>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-3">
                  This lovely 2BHK apartment in Ghansoli is available for sale in Neelkanth Palm Avenue. East-facing property constructed on 44 sq.m carpet area.
                </p>
                <button className="text-xs sm:text-sm text-blue-600 font-bold hover:text-blue-800 flex items-center gap-1">
                  Read Full Description <span className="text-lg">›</span>
                </button>
              </div>
            </div>

            {/* Map Section */}
            <div ref={mapRef} id="map-location" className="overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-200">
              <div className="p-5 sm:p-6 border-b border-gray-100">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Location & Neighborhood</h2>
              </div>
              <div className="relative">
                <img 
                  src={locationMap} 
                  alt="Location Map" 
                  className="w-full h-[220px] sm:h-[350px] object-cover" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
              </div>
              <div className="p-4 bg-gray-50">
                <p className="text-xs sm:text-sm text-gray-600 text-center">
                  Explore nearby schools, hospitals, and transit points on our interactive map.
                </p>
              </div>
            </div>
          </div>


          {/* === Sidebar / Right Column === */}
          <div className="space-y-5 sm:space-y-6">
            
            {/* Main Property Card */}
            <Card className="bg-blue-900 text-white overflow-hidden rounded-2xl sm:rounded-3xl shadow-lg border-0">
              <CardContent className="p-0">
                <div className="relative group">
                  <img 
                    src={imageSources[currentImageIndex]} 
                    alt="Neelkanth Palm Avenue" 
                    className="w-full h-48 sm:h-64 object-cover" 
                  />
                  <div className="absolute top-3 sm:top-4 left-3 sm:left-4">
                    <span className="bg-black/50 text-white text-xs px-2 py-1 rounded">Add to MyList</span>
                  </div>
                </div>
                <div className="p-3 sm:p-4 md:p-5 lg:p-6 space-y-2 sm:space-y-3 md:space-y-4">
                  <div>
                    <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-white leading-tight mb-2">Neelkanth Palm Avenue</h3>
                    <p className="text-xs sm:text-sm text-white/90 mb-2 sm:mb-3 md:mb-4">One line motto | Extra detail.</p>
                  </div>
                  <p className="text-xs sm:text-sm text-white leading-relaxed break-words">
                    An elegant blend of modern architecture and nature-inspired living. This premium residential project offers spacious 2, 3 & 4 BHK apartments ranging from 950 to 1800 sq. ft., designed to maximize light, ventilation, and comfort.
                  </p>
                  <div className="space-y-2 sm:space-y-3 pt-2">
                    <Button className="w-full bg-yellow-400 text-blue-900 hover:bg-yellow-500 text-xs sm:text-sm px-3 sm:px-4 md:px-6 py-2 sm:py-3 rounded-full font-semibold shadow-lg">Add to My List</Button>
                    <Button className="w-full bg-yellow-400 text-blue-900 hover:bg-yellow-500 text-xs sm:text-sm px-3 sm:px-4 md:px-6 py-2 sm:py-3 rounded-full font-semibold shadow-lg">Browse Nearby Listings</Button>
                  </div>
                </div>
              </CardContent>
            </Card>            
         
            {/* Action Card: Schedule Tour */}
            <Card className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <CardContent className="p-4 sm:p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-gray-900">Interested?</h3>
                    <p className="text-xs text-gray-500">Book a visit or view plans</p>
                  </div>
                </div>
                <div className="space-y-2.5">
                    <button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-black hover:from-blue-700 hover:to-blue-800 rounded-xl font-semibold py-3 text-sm shadow-md">
                      Request Site Visit
                    </button>
                  <button className="w-full bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 rounded-xl font-semibold py-3 text-sm">
                    View 3D Plan <span className="text-[10px] ml-1 text-gray-400 font-normal">(Coming Soon)</span>
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Related Properties List */}
            <div className="space-y-3">
              <h4 className="px-1 text-sm font-semibold text-gray-500 uppercase tracking-wider">Nearby Properties</h4>
              
              {["The Oberoma", "Oberoma TWO", "Oberoma THREE"].map((name, i) => (
                <Card key={i} className="bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer group">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200 relative">
                         {/* Placeholder image logic */}
                        <div className="absolute inset-0 bg-gray-300 animate-pulse group-hover:hidden" />
                        <img src="/Pimg9.jpg" alt="Prop" className="w-full h-full object-cover relative z-10" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h2 className="text-sm font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">{name}</h2>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                          <Building2 className="w-3 h-3" />
                          <span>23 Projects Done</span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1 truncate">123 Cities | 14 New Projects</p>
                      </div>
                      
                      <div className="flex-shrink-0 self-center">
                        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                           <span className="text-gray-400 group-hover:text-blue-600">›</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default MainContentSection;





