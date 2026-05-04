import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FaArrowLeft, FaArrowRight, FaCheck, FaUpload, FaMapMarkerAlt, FaHome, FaTools, FaStar, FaImages, FaFileAlt } from 'react-icons/fa';
import api from '../services/apiInstance';

const ProjectAdd = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState({
    // Basic Details
    projectName: '',
    builder: '',
    reraRegistered: false,
    reraId: '',
    propertyType: '',
    subType: '',
    propertyStatus: '',
    possessionDate: '',
    configuration: [],
    availability_date: '',
    // Inventory & Pricing
    totalUnits: '',
    carpetAreaMin: '',
    carpetAreaMax: '',
    priceMin: '',
    priceMax: '',
    pricePerSqft: '',
    bookingAmount: '',
    maintenanceCharges: '',
    flat_number: '',
    furnishing: '',
    // Location Details
    full_address: '',
    landmark: '',
    locality: '',
    city: '',
    state: '',
    // latitude: '',
    // longitude: '',
    // Construction Details
    towers: '',
    floorsPerTower: '',
    constructionStatus: '',
    floorPlans: [],
    // Amenities
    amenities: [],
    // Media
    projectImages: [],
    projectImage: null, // <-- single project image
    walkthroughVideo: '',
    virtualTour: '',
    constructionStatusImages: [],
    // Additional Highlights
    usps: [],
    brochure: null,
    // Project Selection (for steps 4 and 5)
    selectedProjectId: null,
  });

  const [customAmenity, setCustomAmenity] = useState('');
  const [uspsInput, setUspsInput] = useState('');
  const [createdProject, setCreatedProject] = useState(null);
  const [projectId, setProjectId] = useState(null);
  const [stepError, setStepError] = useState(null);
  const [missingFields, setMissingFields] = useState([]);
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState(null);
  const [builderName, setBuilderName] = useState('');

  // Fetch builder name when RERA ID changes (step 1)
  useEffect(() => {
    if (form.reraId) {
      api.get(`/builders/${form.reraId}`)
        .then(({ data }) => {
          setBuilderName(data.company_name || '');
        })
        .catch(() => setBuilderName(''));
    } else {
      setBuilderName('');
    }
  }, [form.reraId]);

  // Fetch all projects when on step 2, 3, 4, 5, or 6
  useEffect(() => {
    if (currentStep === 2 || currentStep === 3 || currentStep === 4 || currentStep === 5 || currentStep === 6) {
      setProjectsLoading(true);
      setProjectsError(null);
      api.get('/projects')
        .then(({ data }) => {
          setProjects(Array.isArray(data) ? data : []);
          setProjectsLoading(false);
        })
        .catch(err => {
          setProjectsError('Failed to fetch projects');
          setProjectsLoading(false);
        });
    }
  }, [currentStep]);

  const API_URL = import.meta.env.VITE_API_URL || 'https://your-production-domain.com/api';

  // Step configuration
  const steps = [
    { id: 1, title: 'Basic Details', icon: FaHome, description: 'Project information and type' },
    { id: 2, title: 'Inventory & Pricing', icon: FaCheck, description: 'Units, pricing, and charges' },
    { id: 3, title: 'Location Details', icon: FaMapMarkerAlt, description: 'Address and coordinates' },
    { id: 4, title: 'Construction Details', icon: FaTools, description: 'Towers, floors, and status' },
    { id: 5, title: 'Amenities', icon: FaStar, description: 'Facilities and features' },
    { id: 6, title: 'Media', icon: FaImages, description: 'Images, videos, and tours' },
    { id: 7, title: 'Additional Highlights', icon: FaFileAlt, description: 'USPs and documents' },
  ];

  // Options for dropdowns
  const propertyTypeOptions = [
    { value: 'Residential', label: 'Residential' },
    { value: 'Commercial', label: 'Commercial' },
    { value: 'Mixed', label: 'Mixed' },
  ];
  const subTypeOptions = [
    { value: 'Apartment', label: 'Apartment' },
    { value: 'Plot', label: 'Plot' },
    { value: 'Villa', label: 'Villa' },
    { value: 'Office', label: 'Office' },
    { value: 'Shop', label: 'Shop' },
  ];
  const propertyStatusOptions = [
    { value: 'Buy', label: 'Buy' },
    { value: 'Rent', label: 'Rent' },
    { value: 'Lease', label: 'Lease' },
    { value: 'For Sale', label: 'For Sale' },
    { value: 'For Rent', label: 'For Rent' },
    { value: 'Ready-to-move', label: 'Ready-to-move' },
    { value: 'Under Construction', label: 'Under Construction' },
    { value: 'Upcoming', label: 'Upcoming' },
  ];
  const furnishingOptions = [
    { value: 'Furnished', label: 'Furnished' },
    { value: 'Semi-Furnished', label: 'Semi-Furnished' },
    { value: 'Unfurnished', label: 'Unfurnished' },
  ];
  const configurationOptions = [
    { value: '1BHK', label: '1BHK' },
    { value: '2BHK', label: '2BHK' },
    { value: '3BHK', label: '3BHK' },
    { value: '4BHK', label: '4BHK' },
    { value: '5BHK+', label: '5BHK+' },
  ];
  const cityOptions = [
    { value: 'Mumbai', label: 'Mumbai' },
    { value: 'Delhi', label: 'Delhi' },
    { value: 'Bangalore', label: 'Bangalore' },
    { value: 'Pune', label: 'Pune' },
    { value: 'Chennai', label: 'Chennai' },
    { value: 'Hyderabad', label: 'Hyderabad' },
    { value: 'Kolkata', label: 'Kolkata' },
    { value: 'Ahmedabad', label: 'Ahmedabad' },
  ];
  const stateOptions = [
    { value: 'Maharashtra', label: 'Maharashtra' },
    { value: 'Delhi', label: 'Delhi' },
    { value: 'Karnataka', label: 'Karnataka' },
    { value: 'Tamil Nadu', label: 'Tamil Nadu' },
    { value: 'Telangana', label: 'Telangana' },
    { value: 'West Bengal', label: 'West Bengal' },
    { value: 'Gujarat', label: 'Gujarat' },
  ];
  const amenitiesOptions = [
    { value: 'Power Backup', label: 'Power Backup' },
    { value: 'Lift', label: 'Lift' },
    { value: 'Club House', label: 'Club House' },
    { value: 'Swimming Pool', label: 'Swimming Pool' },
    { value: 'Security', label: 'Security' },
    { value: 'Gymnasium', label: 'Gymnasium' },
    { value: 'Garden', label: 'Garden' },
    { value: 'Parking', label: 'Parking' },
    { value: 'Play Area', label: 'Play Area' },
    { value: 'Rainwater Harvesting', label: 'Rainwater Harvesting' },
    { value: 'Intercom', label: 'Intercom' },
    { value: 'Visitor Parking', label: 'Visitor Parking' },
    { value: 'CCTV', label: 'CCTV' },
    { value: 'Solar Panels', label: 'Solar Panels' },
  ];

  // Handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleCustomAmenity = (e) => setCustomAmenity(e.target.value);
  const addCustomAmenity = () => {
    if (customAmenity.trim() && !form.amenities.includes(customAmenity.trim())) {
      setForm({ ...form, amenities: [...form.amenities, customAmenity.trim()] });
      setCustomAmenity('');
    }
  };

  const handleUspsInput = (e) => setUspsInput(e.target.value);
  const addUsps = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && uspsInput.trim()) {
      e.preventDefault();
      if (!form.usps.includes(uspsInput.trim())) {
        setForm({ ...form, usps: [...form.usps, uspsInput.trim()] });
        setUspsInput('');
      }
    } else if (e.key === 'Backspace' && !uspsInput && form.usps.length > 0) {
      setForm({ ...form, usps: form.usps.slice(0, -1) });
    }
  };
  const removeUsps = (idx) => {
    setForm({ ...form, usps: form.usps.filter((_, i) => i !== idx) });
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (name === 'projectImage') {
      setForm({ ...form, projectImage: files[0] });
    } else {
      setForm({ ...form, [name]: Array.from(files) });
    }
  };

  const handleBrochureChange = (e) => {
    setForm({ ...form, brochure: e.target.files[0] });
  };

  const handleStepSave = async () => {
    setStepError(null);
    try {
      if (currentStep === 1) {
        const missing = getMissingFields();
        if (missing.length > 0) {
          setStepError('Please fill all required fields in Step 1.');
          setMissingFields(missing);
          return false;
        }
        //---------------------------- This code sends step 1 data to backend ----------------------------------------
        const res = await api.post(`/builders/${form.reraId}/projects/step1`, {
          title: form.projectName,
          builder_name: form.builder, // <-- Use the value from the form input
          description: form.description,
          location: form.projectAddress,
          property_type: form.propertyType,
          sub_type: form.subType,
          property_status: form.propertyStatus,
          possession_date: form.possessionDate,
          configuration: form.configuration
        });
        const data = res.data;
        setProjectId(data.id);
        setCreatedProject(data); // For showing slugs after step 1
        return true;
      } else if (currentStep === 2 && projectId) {
        const missing = getMissingFields();
        if (missing.length > 0) {
          setStepError('Please fill all required fields in Step 2.');
          setMissingFields(missing);
          return false;
        }
        // ---------------------------Send step 2 data to backend---------------------------------------------
        const res = await api.post(`/builders/${form.reraId}/projects/step2`, {
          project_id: projectId,
          totalUnits: form.totalUnits,
          pricePerSqft: form.pricePerSqft,
          carpetAreaMin: form.carpetAreaMin,
          carpetAreaMax: form.carpetAreaMax,
          priceMin: form.priceMin,
          priceMax: form.priceMax,
          bookingAmount: form.bookingAmount,
          flat_number: form.flat_number // <-- send flat_number
        });
        const data = res.data;
        setCreatedProject(data); // Update with latest data
        return true;
      } else if (projectId) {
        // Prepare data for this step
        let patchData = {};
        if (currentStep === 3) {
          const missing = getMissingFields();
          if (missing.length > 0) {
            setStepError('Please fill all required fields in Step 3.');
            setMissingFields(missing);
            return false;
          }
          patchData = {
            full_address: form.full_address,
            state: form.state,
            city: form.city,
            locality: form.locality,
            landmark: form.landmark,
            form_status: 'in_progress'
          };
        } else if (currentStep === 4) {
          const missing = getMissingFields();
          if (missing.length > 0) {
            setStepError('Please fill all required fields in Step 4.');
            setMissingFields(missing);
            return false;
          }

          // Use selected project ID or fall back to current project ID
          const targetProjectId = form.selectedProjectId || projectId;
          if (!targetProjectId) {
            setStepError('Please select a project to update.');
            return false;
          }

          // Get the builder_id from the selected project
          const selectedProject = projects.find(p => p.id === targetProjectId);
          const targetBuilderId = selectedProject ? selectedProject.builder_id : form.reraId;

          // Create FormData for file uploads
          const formData = new FormData();
          formData.append('project_id', targetProjectId);
          formData.append('towers', form.towers);
          formData.append('floors_per_tower', form.floorsPerTower);
          formData.append('construction_status', form.constructionStatus);

          // Add floor plan files
          if (form.floorPlans && form.floorPlans.length > 0) {
            form.floorPlans.forEach(file => {
              formData.append('floor_plans', file);
            });
          }

          console.log('Sending step 4 data:', {
            project_id: targetProjectId,
            builder_id: targetBuilderId,
            towers: form.towers,
            floors_per_tower: form.floorsPerTower,
            construction_status: form.constructionStatus,
            floor_plans_count: form.floorPlans.length
          });

          const res = await api.post(`/builders/${targetBuilderId}/projects/step4`, formData);
          const data = res.data;
          setCreatedProject(data);
          return true;
        } else if (currentStep === 5) {
          // Use only selectedProjectId for step 5
          if (!form.selectedProjectId) {
            setStepError('Please select a project to update.');
            return false;
          }
          const targetProjectId = form.selectedProjectId;
          const selectedProject = projects.find(p => p.id === targetProjectId);
          const targetBuilderId = selectedProject ? selectedProject.builder_id : form.reraId;
          console.log('Sending step 5 data:', {
            project_id: targetProjectId,
            builder_id: targetBuilderId,
            amenities: form.amenities
          });
          const res = await api.post(`/builders/${targetBuilderId}/projects/step5`, {
            project_id: targetProjectId,
            amenities: form.amenities
          });
          const data = res.data;
          setCreatedProject(data);
          return true;
        } else if (currentStep === 6) {
          patchData = {
            // Media fields (handle uploads separately if needed)
            form_status: 'in_progress'
          };
        } else if (currentStep === 7) {
          patchData = {
            usps: JSON.stringify(form.usps),
            form_status: 'complete'
          };
        }
        const res = await api.patch(`/builders/${form.reraId}/projects/${projectId}`, patchData);
        const data = res.data;
        setCreatedProject(data); // Update with latest data
        return true;
      } else {
        setStepError('Project ID missing. Please start from Step 1.');
        return false;
      }
    } catch (err) {
      setStepError(err.message);
      return false;
    }
  };

  const nextStep = async () => {
    const ok = await handleStepSave();
    if (ok && currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    console.log('Form submitted:', form);
    nextStep();
  };

  // Styles
  const containerStyle = {
    display: 'flex',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    fontFamily: 'Segoe UI, Arial, sans-serif',
  };

  const sidebarStyle = {
    width: '300px',
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    padding: '40px 20px',
    boxShadow: '2px 0 20px rgba(0,0,0,0.1)',
    overflowY: 'auto',
  };

  const mainContentStyle = {
    flex: 1,
    padding: '40px',
    overflowY: 'auto',
  };

  const stepStyle = {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderRadius: '20px',
    padding: '40px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
    maxWidth: '800px',
    margin: '0 auto',
  };

  const stepItemStyle = (isActive, isCompleted) => ({
    display: 'flex',
    alignItems: 'center',
    padding: '15px',
    marginBottom: '10px',
    borderRadius: '12px',
    background: isActive ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' :
      isCompleted ? 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)' : 'transparent',
    color: isActive || isCompleted ? 'white' : '#666',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    border: isActive ? 'none' : '1px solid #e0e0e0',
  });

  const stepIconStyle = {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '15px',
    background: 'rgba(255,255,255,0.2)',
    fontSize: '18px',
  };

  const stepInfoStyle = {
    flex: 1,
  };

  const stepTitleStyle = {
    fontWeight: '600',
    fontSize: '16px',
    marginBottom: '4px',
  };

  const stepDescriptionStyle = {
    fontSize: '12px',
    opacity: '0.8',
  };

  const progressBarStyle = {
    width: '100%',
    height: '6px',
    background: '#e0e0e0',
    borderRadius: '3px',
    marginBottom: '30px',
    overflow: 'hidden',
  };

  const progressFillStyle = {
    height: '100%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '3px',
    transition: 'width 0.3s ease',
    width: `${(currentStep / steps.length) * 100}%`,
  };

  const formGroupStyle = {
    marginBottom: '25px',
  };

  const labelStyle = {
    display: 'block',
    fontWeight: '600',
    marginBottom: '8px',
    color: '#333',
    fontSize: '14px',
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.3s ease',
    boxSizing: 'border-box',
  };

  const buttonStyle = {
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'transform 0.2s ease',
  };

  const buttonDisabledStyle = {
    ...buttonStyle,
    background: '#ccc',
    cursor: 'not-allowed',
  };

  const navigationStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '40px',
    paddingTop: '20px',
    borderTop: '1px solid #eee',
  };

  const chipStyle = {
    background: '#e3f2fd',
    color: '#1976d2',
    borderRadius: '16px',
    padding: '4px 12px',
    fontSize: '12px',
    display: 'inline-flex',
    alignItems: 'center',
    margin: '2px',
  };

  const filePreviewStyle = {
    display: 'inline-block',
    margin: '4px',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
    padding: '4px',
    maxWidth: '60px',
    maxHeight: '60px',
  };

  // Add a function to get missing required fields for the current step
  const getMissingFields = () => {
    const missing = [];
    if (currentStep === 1) {
      if (!form.projectName) missing.push('Project Name');
      if (!form.builder) missing.push('Builder');
      if (!form.projectAddress) missing.push('Project Address');
      if (!form.propertyType) missing.push('Property Type');
      if (!form.subType) missing.push('Sub-type');
      if (!form.propertyStatus) missing.push('Property Status');
      if (!form.possessionDate) missing.push('Possession Date');
      if (form.configuration.length === 0) missing.push('Configuration');
      if (!form.reraId) missing.push('RERA ID');
    } else if (currentStep === 2) {
      if (!form.totalUnits) missing.push('Total Units');
      if (!form.pricePerSqft) missing.push('Price per Sq. Ft');
      if (!form.carpetAreaMin) missing.push('Carpet Area Min');
      if (!form.carpetAreaMax) missing.push('Carpet Area Max');
      if (!form.priceMin) missing.push('Price Min');
      if (!form.priceMax) missing.push('Price Max');
      if (!form.bookingAmount) missing.push('Booking Amount');
      if (!form.flat_number) missing.push('Flat Number');
    } else if (currentStep === 3) {
      if (!form.full_address) missing.push('Full Address');
      if (!form.locality) missing.push('Locality');
      if (!form.city) missing.push('City');
      if (!form.state) missing.push('State');
    } else if (currentStep === 4) {
      if (!form.selectedProjectId && !projectId) missing.push('Select Project');
      if (!form.towers) missing.push('Number of Towers');
      if (!form.floorsPerTower) missing.push('Floors per Tower');
      if (!form.constructionStatus) missing.push('Construction Details');
    } else if (currentStep === 5) {
      if (!form.selectedProjectId) missing.push('Select Project'); // Only require selectedProjectId
      // Amenities are optional, so no validation needed
    }
    // Add more for steps 4-7 if needed
    return missing;
  };


  //--------------------------------------ALL FORMS FRONTEND HERE ------------------------------------------


  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div>
            <h2 style={{ marginBottom: '30px', color: '#333', fontSize: '24px', fontWeight: '700' }}>
              Basic Details
            </h2>

            <div style={formGroupStyle}>
              <label style={labelStyle}>Property/Project Name *</label>
              <input
                type="text"
                name="projectName"
                value={form.projectName}
                onChange={handleChange}
                style={inputStyle}
                placeholder="Enter project name"
                required
              />
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>Builder *</label>
              <input
                type="text"
                name="builder"
                value={form.builder}
                onChange={handleChange}
                style={inputStyle}
                placeholder="Enter builder name"
                required
              />
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>RERA Registered? *</label>
              <div style={{ display: 'flex', gap: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="reraRegistered"
                    checked={form.reraRegistered === true}
                    onChange={() => setForm({ ...form, reraRegistered: true })}
                    style={{ marginRight: '8px' }}
                  />
                  Yes
                </label>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="reraRegistered"
                    checked={form.reraRegistered === false}
                    onChange={() => setForm({ ...form, reraRegistered: false })}
                    style={{ marginRight: '8px' }}
                  />
                  No
                </label>
              </div>
            </div>

            {form.reraRegistered && (
              <div style={formGroupStyle}>
                <label style={labelStyle}>RERA ID *</label>
                <input
                  type="text"
                  name="reraId"
                  value={form.reraId}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="Enter RERA ID"
                  required
                />
              </div>
            )}

            <div style={formGroupStyle}>
              <label style={labelStyle}>Property Type *</label>
              <Select
                options={propertyTypeOptions}
                value={propertyTypeOptions.find(opt => opt.value === form.propertyType) || null}
                onChange={opt => setForm({ ...form, propertyType: opt ? opt.value : '' })}
                placeholder="Select Property Type"
                styles={{
                  control: (base) => ({
                    ...base,
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    minHeight: '44px',
                  }),
                }}
              />
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>Sub-type *</label>
              <Select
                options={subTypeOptions}
                value={subTypeOptions.find(opt => opt.value === form.subType) || null}
                onChange={opt => setForm({ ...form, subType: opt ? opt.value : '' })}
                placeholder="Select Sub-type"
                styles={{
                  control: (base) => ({
                    ...base,
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    minHeight: '44px',
                  }),
                }}
              />
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>Property Status *</label>
              <Select
                options={propertyStatusOptions}
                value={propertyStatusOptions.find(opt => opt.value === form.propertyStatus) || null}
                onChange={opt => setForm({ ...form, propertyStatus: opt ? opt.value : '' })}
                placeholder="Select Status"
                styles={{
                  control: (base) => ({
                    ...base,
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    minHeight: '44px',
                  }),
                }}
              />
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>Possession Date *</label>
              <DatePicker
                selected={form.possessionDate ? new Date(form.possessionDate) : null}
                onChange={date => setForm({ ...form, possessionDate: date ? date.toISOString() : '' })}
                dateFormat="yyyy-MM-dd"
                placeholderText="Select Possession Date"
                style={inputStyle}
                className="custom-datepicker"
              />
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>Configuration *</label>
              <Select
                options={configurationOptions}
                value={configurationOptions.filter(opt => form.configuration.includes(opt.value))}
                onChange={opts => setForm({ ...form, configuration: opts ? opts.map(o => o.value) : [] })}
                isMulti
                placeholder="Select Configuration (e.g. 1BHK, 2BHK)"
                styles={{
                  control: (base) => ({
                    ...base,
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    minHeight: '44px',
                  }),
                }}
              />
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>Availability Date (Optional)</label>
              <DatePicker
                selected={form.availability_date ? new Date(form.availability_date) : null}
                onChange={date => setForm({ ...form, availability_date: date ? date.toISOString() : '' })}
                dateFormat="yyyy-MM-dd"
                placeholderText="Select Availability Date"
                style={inputStyle}
                className="custom-datepicker"
                isClearable
              />
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>Project Address *</label>
              <textarea
                name="projectAddress"
                value={form.projectAddress}
                onChange={handleChange}
                style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                placeholder="Full project address"
                required
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div>
            <h2 style={{ marginBottom: '30px', color: '#333', fontSize: '24px', fontWeight: '700' }}>
              Inventory & Pricing
            </h2>
            {/* Project selection UI */}
            <div style={{ marginBottom: '25px' }}>
              <label style={{ ...labelStyle, marginBottom: '12px' }}>Select Project *</label>
              {projectsLoading ? (
                <div>Loading projects...</div>
              ) : projectsError ? (
                <div style={{ color: 'red' }}>{projectsError}</div>
              ) : projects.length === 0 ? (
                <div style={{ color: '#888' }}>No projects found for this builder. Please complete Step 1 first.</div>
              ) : (
                <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid #eee', borderRadius: 8, padding: 8 }}>
                  {projects.map(project => (
                    <label key={project.id} style={{ display: 'block', marginBottom: 6, cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="projectId"
                        value={project.id}
                        checked={projectId === project.id}
                        onChange={() => {
                          setProjectId(project.id);
                          setForm(prev => ({ ...prev, reraId: project.builder_id })); // Set reraId from selected project
                        }}
                        style={{ marginRight: 8 }}
                      />
                      {project.title} ----— {project.builder_name || ''} , {project.location || ''}
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '20px', marginBottom: '25px' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Total Units *</label>
                <input
                  type="number"
                  name="totalUnits"
                  value={form.totalUnits}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="Total Units"
                  min={0}
                  required
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Price per Sq. Ft (₹) *</label>
                <input
                  type="number"
                  name="pricePerSqft"
                  value={form.pricePerSqft}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="e.g. 12000"
                  min={0}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '20px', marginBottom: '25px' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Carpet Area Range (sq. ft) *</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="number"
                    name="carpetAreaMin"
                    value={form.carpetAreaMin}
                    onChange={handleChange}
                    style={{ ...inputStyle, flex: 1 }}
                    placeholder="Min"
                    min={0}
                    required
                  />
                  <span style={{ alignSelf: 'center', color: '#888' }}>-</span>
                  <input
                    type="number"
                    name="carpetAreaMax"
                    value={form.carpetAreaMax}
                    onChange={handleChange}
                    style={{ ...inputStyle, flex: 1 }}
                    placeholder="Max"
                    min={0}
                    required
                  />
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Price Range (₹) *</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="number"
                    name="priceMin"
                    value={form.priceMin}
                    onChange={handleChange}
                    style={{ ...inputStyle, flex: 1 }}
                    placeholder="Min"
                    min={0}
                    required
                  />
                  <span style={{ alignSelf: 'center', color: '#888' }}>-</span>
                  <input
                    type="number"
                    name="priceMax"
                    value={form.priceMax}
                    onChange={handleChange}
                    style={{ ...inputStyle, flex: 1 }}
                    placeholder="Max"
                    min={0}
                    required
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '20px' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Booking Amount (₹) *</label>
                <input
                  type="number"
                  name="bookingAmount"
                  value={form.bookingAmount}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="e.g. 50000"
                  min={0}
                  required
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Maintenance Charges (₹, optional)</label>
                <input
                  type="number"
                  name="maintenanceCharges"
                  value={form.maintenanceCharges}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="e.g. 2000"
                  min={0}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '20px', marginBottom: '25px' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Flat Number *</label>
                <input
                  type="text"
                  name="flat_number"
                  value={form.flat_number}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="e.g. A101"
                  required
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Furnishing (Optional)</label>
                <Select
                  options={furnishingOptions}
                  value={furnishingOptions.find(opt => opt.value === form.furnishing) || null}
                  onChange={opt => setForm({ ...form, furnishing: opt ? opt.value : '' })}
                  placeholder="Select Furnishing"
                  styles={{
                    control: (base) => ({
                      ...base,
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      minHeight: '44px',
                    }),
                  }}
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div>
            <h2 style={{ marginBottom: '30px', color: '#333', fontSize: '24px', fontWeight: '700' }}>
              Location Details
            </h2>
            {/* Project selection UI for step 3 */}
            <div style={{ marginBottom: '25px' }}>
              <label style={{ ...labelStyle, marginBottom: '12px' }}>Select Project *</label>
              {projectsLoading ? (
                <div>Loading projects...</div>
              ) : projectsError ? (
                <div style={{ color: 'red' }}>{projectsError}</div>
              ) : projects.length === 0 ? (
                <div style={{ color: '#888' }}>No projects found. Please complete Step 1 first.</div>
              ) : (
                <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid #eee', borderRadius: 8, padding: 8 }}>
                  {projects.map(project => (
                    <label key={project.id} style={{ display: 'block', marginBottom: 6, cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="projectId"
                        value={project.id}
                        checked={projectId === project.id}
                        onChange={() => {
                          setProjectId(project.id);
                          setForm(prev => ({ ...prev, reraId: project.builder_id }));
                        }}
                        style={{ marginRight: 8 }}
                      />
                      {project.title} ----— {project.builder_name || ''} , {project.location || ''}
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Full Address *</label>
              <textarea
                name="full_address"
                value={form.full_address}
                onChange={handleChange}
                style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                placeholder="Full project address"
                required
              />
            </div>
            <div style={{ display: 'flex', gap: '20px', marginBottom: '25px' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Landmark (optional)</label>
                <input
                  type="text"
                  name="landmark"
                  value={form.landmark}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="Nearby landmark"
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Locality *</label>
                <input
                  type="text"
                  name="locality"
                  value={form.locality}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="Locality"
                  required
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '20px', marginBottom: '25px' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>City *</label>
                <Select
                  options={cityOptions}
                  value={cityOptions.find(opt => opt.value === form.city) || null}
                  onChange={opt => setForm({ ...form, city: opt ? opt.value : '' })}
                  placeholder="Select City"
                  styles={{
                    control: (base) => ({
                      ...base,
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      minHeight: '44px',
                    }),
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>State *</label>
                <Select
                  options={stateOptions}
                  value={stateOptions.find(opt => opt.value === form.state) || null}
                  onChange={opt => setForm({ ...form, state: opt ? opt.value : '' })}
                  placeholder="Select State"
                  styles={{
                    control: (base) => ({
                      ...base,
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      minHeight: '44px',
                    }),
                  }}
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div>
            <h2 style={{ marginBottom: '30px', color: '#333', fontSize: '24px', fontWeight: '700' }}>
              Construction Details
            </h2>

            <div style={formGroupStyle}>
              <label style={labelStyle}>Select Project to Update *</label>
              {projectsLoading ? (
                <div style={{ color: '#666', fontSize: '14px' }}>Loading projects...</div>
              ) : projectsError ? (
                <div style={{ color: '#d32f2f', fontSize: '14px' }}>{projectsError}</div>
              ) : (
                <Select
                  options={projects.map(p => ({ value: p.id, label: `${p.title} - ${p.location || 'N/A'}` }))}
                  value={projects.find(p => p.id === (form.selectedProjectId || projectId)) ?
                    {
                      value: form.selectedProjectId || projectId,
                      label: `${projects.find(p => p.id === (form.selectedProjectId || projectId))?.title} - ${projects.find(p => p.id === (form.selectedProjectId || projectId))?.location || 'N/A'}`
                    } : null}
                  onChange={opt => setForm({ ...form, selectedProjectId: opt ? opt.value : null })}
                  placeholder="Select a project to update"
                  styles={{
                    control: (base) => ({
                      ...base,
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      minHeight: '44px',
                    }),
                  }}
                />
              )}
            </div>

            <div style={{ display: 'flex', gap: '20px', marginBottom: '25px' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Number of Towers *</label>
                <input
                  type="number"
                  name="towers"
                  value={form.towers}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="e.g. 5"
                  min={0}
                  required
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Floors per Tower *</label>
                <input
                  type="number"
                  name="floorsPerTower"
                  value={form.floorsPerTower}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="e.g. 20"
                  min={0}
                  required
                />
              </div>
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>Construction Details *</label>
              <input
                type="text"
                name="constructionStatus"
                value={form.constructionStatus}
                onChange={handleChange}
                style={inputStyle}
                placeholder="e.g. Phase 1 Complete, Phase 2 Ongoing"
                required
              />
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>Builder Floor Plans (Images)</label>
              <input
                type="file"
                name="floorPlans"
                onChange={handleFileChange}
                style={inputStyle}
                multiple
                accept=".jpg,.jpeg,.png"
              />
              {form.floorPlans.length > 0 && (
                <div style={{ color: '#888', fontSize: '13px', marginTop: '8px' }}>
                  Selected: {form.floorPlans.map(f => f.name).join(', ')}
                </div>
              )}
            </div>
          </div>
        );

      case 5:
        // Debug: log selectedProjectId and projectId
        console.log('Amenities step: selectedProjectId', form.selectedProjectId, 'projectId', projectId);
        return (
          <div>
            <h2 style={{ marginBottom: '30px', color: '#333', fontSize: '24px', fontWeight: '700' }}>
              Amenities
            </h2>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Select Project to Update * {(!form.selectedProjectId ? <span style={{ color: 'red' }}>Required</span> : null)}</label>
              {projectsLoading ? (
                <div style={{ color: '#666', fontSize: '14px' }}>Loading projects...</div>
              ) : projectsError ? (
                <div style={{ color: '#d32f2f', fontSize: '14px' }}>{projectsError}</div>
              ) : (
                <Select
                  options={projects.map(p => ({ value: p.id, label: `${p.title} - ${p.location || 'N/A'}` }))}
                  value={projects.find(p => p.id === form.selectedProjectId) ?
                    {
                      value: form.selectedProjectId,
                      label: `${projects.find(p => p.id === form.selectedProjectId)?.title} - ${projects.find(p => p.id === form.selectedProjectId)?.location || 'N/A'}`
                    } : null}
                  onChange={opt => setForm({ ...form, selectedProjectId: opt ? opt.value : null })}
                  placeholder="Select a project to update"
                  styles={{
                    control: (base, state) => ({
                      ...base,
                      border: !form.selectedProjectId ? '2px solid #d32f2f' : '1px solid #ddd',
                      borderRadius: '8px',
                      minHeight: '44px',
                    }),
                  }}
                  isRequired
                />
              )}
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>Select Amenities</label>
              <Select
                options={amenitiesOptions}
                value={amenitiesOptions.filter(opt => form.amenities.includes(opt.value))}
                onChange={opts => setForm({ ...form, amenities: opts ? opts.map(o => o.value) : [] })}
                isMulti
                placeholder="Select amenities"
                styles={{
                  control: (base) => ({
                    ...base,
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    minHeight: '44px',
                  }),
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px' }}>
              <input
                type="text"
                value={customAmenity}
                onChange={handleCustomAmenity}
                style={{ ...inputStyle, flex: 1, marginBottom: 0 }}
                placeholder="Add custom amenity"
              />
              <button type="button" onClick={addCustomAmenity} style={buttonStyle}>
                Add
              </button>
            </div>

            {form.amenities.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {form.amenities.map((a, i) => (
                  <span key={i} style={chipStyle}>
                    {a}
                  </span>
                ))}
              </div>
            )}
          </div>
        );

      case 6:
        return (
          <div>
            <h2 style={{ marginBottom: '30px', color: '#333', fontSize: '24px', fontWeight: '700' }}>
              Media
            </h2>

            {/* Project Selection for Media */}
            <div style={formGroupStyle}>
              <label style={labelStyle}>Select Project to Update * {(!form.selectedProjectId ? <span style={{ color: 'red' }}>Required</span> : null)}</label>
              {projectsLoading ? (
                <div style={{ color: '#666', fontSize: '14px' }}>Loading projects...</div>
              ) : projectsError ? (
                <div style={{ color: '#d32f2f', fontSize: '14px' }}>{projectsError}</div>
              ) : (
                <Select
                  options={projects.map(p => ({ value: p.id, label: `${p.title} - ${p.location || 'N/A'}` }))}
                  value={projects.find(p => p.id === form.selectedProjectId) ?
                    {
                      value: form.selectedProjectId,
                      label: `${projects.find(p => p.id === form.selectedProjectId)?.title} - ${projects.find(p => p.id === form.selectedProjectId)?.location || 'N/A'}`
                    } : null}
                  onChange={opt => setForm({ ...form, selectedProjectId: opt ? opt.value : null })}
                  placeholder="Select a project to update"
                  styles={{
                    control: (base, state) => ({
                      ...base,
                      border: !form.selectedProjectId ? '2px solid #d32f2f' : '1px solid #ddd',
                      borderRadius: '8px',
                      minHeight: '44px',
                    }),
                  }}
                  isRequired
                />
              )}
            </div>

            {/* Project Image upload */}
            <div style={formGroupStyle}>
              <label style={labelStyle}>Project Image (Main)</label>
              <input
                type="file"
                name="projectImage"
                onChange={handleFileChange}
                style={inputStyle}
                accept=".jpg,.jpeg,.png"
              />
              {form.projectImage && (
                <div style={{ marginTop: '10px' }}>
                  <img src={URL.createObjectURL(form.projectImage)} alt={form.projectImage.name} style={filePreviewStyle} />
                </div>
              )}
              {/* Upload button */}
              <button
                type="button"
                style={{ ...buttonStyle, marginTop: 10 }}
                onClick={async () => {
                  if (!form.projectImage) {
                    setStepError('Please select a project image to upload.');
                    return;
                  }
                  // Get selected project
                  const targetProjectId = form.selectedProjectId || projectId;
                  if (!targetProjectId) {
                    setStepError('Please select a project to update.');
                    return;
                  }
                  const selectedProject = projects.find(p => p.id === targetProjectId);
                  const targetBuilderId = selectedProject ? selectedProject.builder_id : form.reraId;

                  console.log('Uploading project image:', {
                    projectImage: form.projectImage,
                    targetProjectId,
                    targetBuilderId,
                    selectedProject
                  });

                  // Prepare FormData
                  const formData = new FormData();
                  formData.append('project_id', targetProjectId);
                  formData.append('project_image', form.projectImage);

                  console.log('FormData contents:');
                  for (let [key, value] of formData.entries()) {
                    console.log(key, value);
                  }

                  // Send to backend
                  const res = await api.post(`/builders/${targetBuilderId}/projects/upload-image`, formData);
                  const data = res.data;
                  console.log('Response data:', data);

                  setStepError(null);
                  setCreatedProject(data);
                  alert('Project image uploaded successfully!');
                }}
              >
                Upload Project Image
              </button>
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>Walkthrough Video Link (YouTube/Vimeo)</label>
              <input
                type="url"
                name="walkthroughVideo"
                value={form.walkthroughVideo}
                onChange={handleChange}
                style={inputStyle}
                placeholder="Paste video link"
              />
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>360° Virtual Tour (URL)</label>
              <input
                type="url"
                name="virtualTour"
                value={form.virtualTour}
                onChange={handleChange}
                style={inputStyle}
                placeholder="Paste virtual tour link"
              />
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>Construction Status Images</label>
              <input
                type="file"
                name="constructionStatusImages"
                onChange={handleFileChange}
                style={inputStyle}
                multiple
                accept=".jpg,.jpeg,.png"
              />
              {form.constructionStatusImages.length > 0 && (
                <div style={{ marginTop: '10px' }}>
                  {form.constructionStatusImages.map(f => (
                    <img key={f.name} src={URL.createObjectURL(f)} alt={f.name} style={filePreviewStyle} />
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 7:
        return (
          <div>
            <h2 style={{ marginBottom: '30px', color: '#333', fontSize: '24px', fontWeight: '700' }}>
              Additional Highlights
            </h2>

            <div style={formGroupStyle}>
              <label style={labelStyle}>USPs (Multi-entry tags)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px', marginBottom: '12px' }}>
                {form.usps.map((usp, idx) => (
                  <span key={idx} style={chipStyle}>
                    {usp}
                    <button
                      type="button"
                      onClick={() => removeUsps(idx)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#1976d2',
                        fontWeight: '700',
                        fontSize: '15px',
                        marginLeft: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      &times;
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={uspsInput}
                  onChange={handleUspsInput}
                  onKeyDown={addUsps}
                  style={inputStyle}
                  placeholder={form.usps.length >= 10 ? '' : 'Add USP'}
                  disabled={form.usps.length >= 10}
                />
              </div>
              <div style={{ color: '#888', fontSize: '12px' }}>
                Press Enter or comma to add. Max 10 USPs.
              </div>
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>Brochure Upload (PDF)</label>
              <input
                type="file"
                name="brochure"
                onChange={handleBrochureChange}
                style={inputStyle}
                accept=".pdf"
              />
              {form.brochure && (
                <div style={{ marginTop: '10px' }}>
                  <span style={chipStyle}>
                    <FaFileAlt style={{ marginRight: '4px' }} />
                    {form.brochure.name}
                  </span>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Remove the success page and project list from ProjectAdd.jsx
  // Move this logic to a new ProjectList.jsx page/component
  // Prepare for navigation from the admin navbar

  const incompleteSteps = getMissingFields();

  return (
    <div style={containerStyle}>
      {/* Incomplete steps summary */}
      {incompleteSteps.length > 0 && (
        <div style={{ maxWidth: 900, margin: '24px auto 0 auto', padding: '12px 24px', background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 10, color: '#ad6800', fontWeight: 500, fontSize: 16 }}>
          <div>Incomplete Steps:</div>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {incompleteSteps.map((step, i) => <li key={i}>{step}</li>)}
          </ul>
        </div>
      )}
      {/* Sidebar with progress */}
      <div style={sidebarStyle}>
        <h3 style={{ marginBottom: '30px', color: '#333', fontSize: '20px', fontWeight: '700', textAlign: 'center' }}>
          Add New Project
        </h3>

        <div style={progressBarStyle}>
          <div style={progressFillStyle}></div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
            Step {currentStep} of {steps.length}
          </div>
          <div style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>
            {steps[currentStep - 1].title}
          </div>
        </div>

        {steps.map((step, index) => (
          <div
            key={step.id}
            style={stepItemStyle(
              currentStep === step.id,
              currentStep > step.id
            )}
            onClick={() => setCurrentStep(step.id)}
          >
            <div style={stepIconStyle}>
              {currentStep > step.id ? (
                <FaCheck />
              ) : (
                <step.icon />
              )}
            </div>
            <div style={stepInfoStyle}>
              <div style={stepTitleStyle}>{step.title}</div>
              <div style={stepDescriptionStyle}>{step.description}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main content */}
      <div style={mainContentStyle}>
        <div style={stepStyle}>
          {renderStepContent()}

          {/* Navigation */}
          <div style={navigationStyle}>
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              style={currentStep === 1 ? buttonDisabledStyle : buttonStyle}
            >
              <FaArrowLeft style={{ marginRight: '8px' }} />
              Previous
            </button>

            {currentStep < steps.length ? (
              <button onClick={nextStep} style={buttonStyle}>
                Next
                <FaArrowRight style={{ marginLeft: '8px' }} />
              </button>
            ) : (
              <button onClick={handleSubmit} style={buttonStyle}>
                <FaCheck style={{ marginRight: '8px' }} />
                Submit Project
              </button>
            )}
          </div>

          {stepError && <div style={{ color: 'red', marginBottom: 16 }}>{stepError}</div>}
          {missingFields.length > 0 && (
            <div style={{ color: 'red', marginBottom: 16 }}>
              <div>Missing fields:</div>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {missingFields.map((field, i) => <li key={i}>{field}</li>)}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectAdd; 