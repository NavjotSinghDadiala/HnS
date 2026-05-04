import { useState, forwardRef, useImperativeHandle, useEffect } from "react";
import { X, Filter } from "lucide-react";
import "../../hns_propertylisting_css/PropertyFilterSidebar.css";
import React from "react";
import API_BASE_URL from "../../../config";

// -----------------------------
// Reusable Components
// -----------------------------
const Tag = ({ label, onRemove, className = "" }) => (
  <div className={`tag ${className}`}>
    {label}
    <X className="tag-remove" onClick={onRemove} />
  </div>
);

const FilterPill = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`filter-pill ${isActive ? "active" : "inactive"}`}
  >
    {label}
  </button>
);

const ToggleSwitch = ({ label, checked, onChange }) => (
  <div className="toggle-item">
    <span className="toggle-label">{label}</span>
    <div
      className={`toggle-switch ${checked ? "active" : "inactive"}`}
      onClick={() => onChange(!checked)}
    >
      <div
        className={`toggle-thumb ${checked ? "active" : "inactive"}`}
      />
    </div>
  </div>
);

const RangeSlider = ({ label, min, max, value, unit, onChange, formatValue }) => {
  const percentage = ((value - min) / (max - min)) * 100;
  const displayValue = formatValue ? formatValue(value) : `${value.toLocaleString()} ${unit}`;

  return (
    <div className="sidebar-slider-container">
      <div className="sidebar-slider-header">
        <span className="sidebar-slider-label">{label}</span>
        <span className="sidebar-slider-value">{displayValue}</span>
      </div>
      <div className="sidebar-slider-track-container">
        <div className="sidebar-slider-track">
          <div
            className="sidebar-slider-range"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={0.5}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="sidebar-slider-input"
        />
        <div
          className="sidebar-slider-thumb"
          style={{ left: `calc(${percentage}% - 8px)` }}
        />
      </div>
      <div className="sidebar-slider-labels">
        <span>₹{min} {unit}</span>
        <span>₹{max}+ {unit}</span>
      </div>
    </div>
  );
};

// Format price value in Cr for display
const formatPriceCr = (val) => {
  if (val === 0) return "Any";
  if (val < 1) return `₹${Math.round(val * 100)}L`;
  return `₹${val} Cr`;
};

// -----------------------------
// Main Sidebar Component
// -----------------------------
const PropertyFilterSidebar = forwardRef((props, ref) => {
  const {
    onTagsChange,
    onFiltersChange,
    city = "",
    onCityRemove,
    initialPriceCr = 0,
    onPriceChange,
  } = props;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    amenities: [],
    propertyStatus: [],
    societyTypes: [],
  });
  const [loadingFilters, setLoadingFilters] = useState(true);

  const [toggles, setToggles] = useState({
    reraVerified: true,
    withinArea: true,
    extraVariables: true,
  });
  const [carpetArea, setCarpetArea] = useState(2300);
  const [builtUpArea, setBuiltUpArea] = useState(2000);
  // Budget slider: in Crores, 0 = any, max 5 Cr
  const [budgetCr, setBudgetCr] = useState(initialPriceCr);

  const [propertyStatus, setPropertyStatus] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [societyType, setSocietyType] = useState([]);

  // Track expanded states for "More" buttons
  const [expandedAmenities, setExpandedAmenities] = useState(false);
  const [expandedPropertyStatus, setExpandedPropertyStatus] = useState(false);
  const [expandedSocietyTypes, setExpandedSocietyTypes] = useState(false);

  // Fetch filter options from backend
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/properties/filters`);
        if (response.ok) {
          const data = await response.json();
          setFilterOptions({
            amenities: data.amenities || [],
            propertyStatus: data.propertyStatus || [],
            societyTypes: data.societyTypes || [],
          });
        }
      } catch (error) {
        console.error('Failed to fetch filter options:', error);
        // Fallback to empty arrays if fetch fails
        setFilterOptions({
          amenities: [],
          propertyStatus: [],
          societyTypes: [],
        });
      } finally {
        setLoadingFilters(false);
      }
    };

    fetchFilters();
  }, []);

  // Sync budget slider with incoming prop changes
  useEffect(() => {
    if (initialPriceCr > 0) {
      setBudgetCr(initialPriceCr);
    }
  }, [initialPriceCr]);

  // Propagate budget changes up
  useEffect(() => {
    if (typeof onPriceChange === "function") {
      onPriceChange(budgetCr);
    }
  }, [budgetCr]);

  const allTags = [...propertyStatus, ...amenities, ...societyType];

  const removeTag = (tagToRemove) => {
    if (propertyStatus.includes(tagToRemove)) {
      setPropertyStatus(propertyStatus.filter((t) => t !== tagToRemove));
    } else if (amenities.includes(tagToRemove)) {
      setAmenities(amenities.filter((t) => t !== tagToRemove));
    } else if (societyType.includes(tagToRemove)) {
      setSocietyType(societyType.filter((t) => t !== tagToRemove));
    }
  };

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    getAllTags: () => allTags,
    removeTag: removeTag,
  }));

  // Notify parent whenever structured filters change
  React.useEffect(() => {
    if (typeof onFiltersChange === "function") {
      onFiltersChange({
        priceRange: budgetCr,
        propertyStatus,
        amenities,
        societyType,
      });
    }
  }, [budgetCr, propertyStatus, amenities, societyType, onFiltersChange]);

  // Notify parent when tag chips change
  React.useEffect(() => {
    if (typeof onTagsChange === "function") {
      onTagsChange(allTags);
    }
  }, [propertyStatus, amenities, societyType]);

  const clearAllTags = () => {
    setPropertyStatus([]);
    setAmenities([]);
    setSocietyType([]);
  };

  const toggleFilter = (category, value) => {
    const setters = {
      propertyStatus: setPropertyStatus,
      amenities: setAmenities,
      societyType: setSocietyType,
    };
    const current = { propertyStatus, amenities, societyType }[category];
    const setter = setters[category];
    if (current.includes(value)) {
      setter(current.filter((v) => v !== value));
    } else {
      setter([...current, value]);
    }
  };

  // -----------------------------
  // Reusable Filter Content
  // -----------------------------
  const renderFilterContent = () => (
    <>
      {/* Tags — City tag first, then filter tags */}
      <div className="tags-section">
        <div className="tags-header">
          <h3 className="tags-title">Tags Added</h3>
          {allTags.length > 0 && (
            <button onClick={clearAllTags} className="clear-tags-btn">
              Clear Tags &gt;
            </button>
          )}
        </div>
        <div className="tags-container">
          {/* City tag — always first, special styling */}
          {city && (
            <Tag
              label={`📍 ${city}`}
              onRemove={onCityRemove}
              className="city-tag"
            />
          )}
          {allTags.map((tag, i) => (
            <Tag key={i} label={tag} onRemove={() => removeTag(tag)} />
          ))}
        </div>
      </div>

      {/* Budget Slider */}
      <div className="sidebar-slider-section">
        <RangeSlider
          label="Budget"
          min={0}
          max={5}
          value={budgetCr}
          unit="Cr"
          onChange={setBudgetCr}
          formatValue={formatPriceCr}
        />
      </div>

      {/* Toggles */}
      <div className="toggles-section">
        <ToggleSwitch
          label="Verified RERA Certificate"
          checked={toggles.reraVerified}
          onChange={(c) => setToggles((p) => ({ ...p, reraVerified: c }))}
        />
        <ToggleSwitch
          label="Within My Area"
          checked={toggles.withinArea}
          onChange={(c) => setToggles((p) => ({ ...p, withinArea: c }))}
        />
        <ToggleSwitch
          label="Extra Other Variables"
          checked={toggles.extraVariables}
          onChange={(c) => setToggles((p) => ({ ...p, extraVariables: c }))}
        />
      </div>

      {/* Sliders */}
      <div className="sidebar-slider-section">
        <RangeSlider
          label="Carpet Area"
          min={0}
          max={4000}
          value={carpetArea}
          unit="Sq.Ft"
          onChange={setCarpetArea}
        />
        <RangeSlider
          label="Built-Up Area"
          min={0}
          max={4000}
          value={builtUpArea}
          unit="Sq.Ft"
          onChange={setBuiltUpArea}
        />
      </div>

      {/* Property Status */}
      <div className="filter-section">
        <h3 className="filter-title">Property Status</h3>
        <div className="filter-pills">
          {loadingFilters ? (
            <p style={{ fontSize: "12px", color: "#999" }}>Loading...</p>
          ) : filterOptions.propertyStatus.length > 0 ? (
            filterOptions.propertyStatus.map((s) => (
              <FilterPill
                key={s}
                label={s}
                isActive={propertyStatus.includes(s)}
                onClick={() => toggleFilter("propertyStatus", s)}
              />
            ))
          ) : (
            <p style={{ fontSize: "12px", color: "#999" }}>No options available</p>
          )}
        </div>
      </div>

      {/* Amenities */}
      <div className="filter-section">
        <h3 className="filter-title">Amenities</h3>
        <div className="filter-pills">
          {loadingFilters ? (
            <p style={{ fontSize: "12px", color: "#999" }}>Loading...</p>
          ) : filterOptions.amenities.length > 0 ? (
            <>
              {(expandedAmenities ? filterOptions.amenities : filterOptions.amenities.slice(0, 4)).map((a) => (
                <FilterPill
                  key={a}
                  label={a}
                  isActive={amenities.includes(a)}
                  onClick={() => toggleFilter("amenities", a)}
                />
              ))}
            </>
          ) : (
            <p style={{ fontSize: "12px", color: "#999" }}>No amenities available</p>
          )}
          {filterOptions.amenities.length > 4 && (
            <button
              className="more-options-btn"
              onClick={() => setExpandedAmenities(!expandedAmenities)}
              style={{ cursor: "pointer" }}
            >
              {expandedAmenities ? "- Show Less" : `+ ${filterOptions.amenities.length - 4} More >`}
            </button>
          )}
        </div>
      </div>

      {/* Society Type */}
      <div className="filter-section">
        <h3 className="filter-title">Society Type</h3>
        <div className="filter-pills">
          {loadingFilters ? (
            <p style={{ fontSize: "12px", color: "#999" }}>Loading...</p>
          ) : filterOptions.societyTypes.length > 0 ? (
            <>
              {(expandedSocietyTypes ? filterOptions.societyTypes : filterOptions.societyTypes.slice(0, 4)).map((t) => (
                <FilterPill
                  key={t}
                  label={t}
                  isActive={societyType.includes(t)}
                  onClick={() => toggleFilter("societyType", t)}
                />
              ))}
            </>
          ) : (
            <p style={{ fontSize: "12px", color: "#999" }}>No options available</p>
          )}
          {filterOptions.societyTypes.length > 4 && (
            <button
              className="more-options-btn"
              onClick={() => setExpandedSocietyTypes(!expandedSocietyTypes)}
              style={{ cursor: "pointer" }}
            >
              {expandedSocietyTypes ? "- Show Less" : `+ ${filterOptions.societyTypes.length - 4} More >`}
            </button>
          )}
        </div>
      </div>
    </>
  );

  // -----------------------------
  // JSX Return
  // -----------------------------
  return (
    <>
      {/* Desktop Sidebar */}
      <div className="sidebar-container">{renderFilterContent()}</div>

      {/* Mobile Filter Button */}
      {!drawerOpen && (
        <button
          className="filter-toggle-btn"
          onClick={() => setDrawerOpen(true)}
        >
          <Filter className="w-4 h-4 mr-2" /> Filters
        </button>
      )}

      {/* Mobile Drawer */}
      <div
        className={`sidebar-overlay ${drawerOpen ? "active" : ""}`}
        onClick={() => setDrawerOpen(false)}
      />
      <div className={`sidebar-drawer ${drawerOpen ? "active" : ""}`}>
        <div className="tags-header">
          <h3 className="tags-title">Filters</h3>
          <X className="tag-remove" onClick={() => setDrawerOpen(false)} />
        </div>
        {renderFilterContent()}
      </div>
    </>
  );
});

export default PropertyFilterSidebar;
