import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";

// Layout Components
import FooterNavBar from '../../hns_home_page/components/layout/FooterNavBar';
import PropertyHeader from '../components/layouts/PropertyHeader';
import PropertyFooter from '../components/layouts/PropertyFooter';
import DynamicBreadcrumb from '../../components/ui/DynamicBreadcrumb.jsx';
import MobileFooter from '../../components/ui/MobileFooter.jsx'; // Added from second version

// Section Components
import BuilderProfile from '../components/sections/BuilderProfile';
import PropertyHero from '../components/sections/PropertyHero';
import MainContentSection from '../components/sections/MainContentSection';
import ExistingFloorPlansSection from '../components/sections/ExistingFloorPlansSection';
import ReadMoreAboutProperty from '../components/sections/ReadMoreAboutProperty';

// Import API services
import { fetchBuilderByName, fetchPropertyById } from '../../services/api';

// Import styles
import '../property_page_css/styles.css';

const PropertyListingPage = () => {
  const [builderData, setBuilderData] = useState(null);
  const [propertyData, setPropertyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const { id } = useParams(); // Get property ID from URL

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // First, fetch the property data
        const property = await fetchPropertyById(id);
        setPropertyData(property);

        // Then, fetch builder data based on the property's builder name
        const builderName = property.Builder_Name;
        if (builderName) {
          try {
            const builder = await fetchBuilderByName(builderName);
            setBuilderData(builder);
          } catch (err) {
            console.log(`Builder "${builderName}" not found, using fallback data`);
            // Use fallback builder data
            setBuilderData({
              company_name: builderName,
              motto: "Building Dreams | Creating Realities",
              ranking: 7,
              total_cities: 123,
              completed_projects: 23,
              new_projects: 14,
              established_year: 1995
            });
          }
        } else {
          // Fallback if no builder name
          setBuilderData({
            company_name: "Unknown Builder",
            motto: "Building Dreams | Creating Realities",
            ranking: 7,
            total_cities: 123,
            completed_projects: 23,
            new_projects: 14,
            established_year: 1995
          });
        }
      } catch (error) {
        console.log('Error fetching data, using fallback');
        setPropertyData(null);
        setBuilderData({
          company_name: "Hiranandani Group",
          motto: "Building Dreams | Creating Realities",
          ranking: 7,
          total_cities: 123,
          completed_projects: 23,
          new_projects: 14,
          established_year: 1995
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      {/* Fixed Header with backdrop blur */}
      <div className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/90 border-b border-gray-200/50 shadow-sm">
        <FooterNavBar />
      </div>

      {/* Main Content */}
      <main className="pt-16 sm:pt-20 lg:pt-24 pb-16 lg:pb-0">
        <DynamicBreadcrumb />
        <PropertyHeader />
        {!loading && <BuilderProfile builderData={builderData} />}
        <PropertyHero propertyData={propertyData} />
        <MainContentSection propertyData={propertyData} />
        <ExistingFloorPlansSection />
        <ReadMoreAboutProperty />
        <PropertyFooter />
      </main>

      {/* Floating Call Button (Mobile Only) */}


      {/* Mobile Footer */}
      <MobileFooter />
    </div>
  );
};

export default PropertyListingPage;