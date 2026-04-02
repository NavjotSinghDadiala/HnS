import API_BASE_URL from '../config';

const API_URL = `${API_BASE_URL}/api`;

export const fetchPropertyById = async (id) => {
    try {
        const response = await fetch(`${API_URL}/properties/${id}`);
        if (!response.ok) throw new Error('Failed to fetch property');
        return await response.json();
    } catch (error) {
        console.error('Error fetching property:', error);
        throw error;
    }
};

export const fetchBuilderProjectById = async (id) => {
    try {
        const response = await fetch(`${API_URL}/projects/${id}`);
        if (!response.ok) throw new Error('Failed to fetch builder project');
        return await response.json();
    } catch (error) {
        console.error('Error fetching builder project:', error);
        throw error;
    }
};
export const fetchBuilderByName = async (name) => {
    try {
        const response = await fetch(`${API_URL}/builders/name/${encodeURIComponent(name)}`);
        if (!response.ok) throw new Error('Failed to fetch builder');
        return await response.json();
    } catch (error) {
        console.error('Error fetching builder:', error);
        throw error;
    }
};

export const fetchBuilderByReraId = async (reraId) => {
    try {
        const response = await fetch(`${API_URL}/builders/${encodeURIComponent(reraId)}`);
        if (!response.ok) throw new Error('Failed to fetch builder by RERA ID');
        return await response.json();
    } catch (error) {
        console.error('Error fetching builder by RERA ID:', error);
        throw error;
    }
};

export const fetchBuilderProjects = async (reraId, status = '') => {
    try {
        let url = `${API_URL}/builders/${encodeURIComponent(reraId)}/projects`;
        if (status) {
            url += `?status=${encodeURIComponent(status)}`;
        }
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch builder projects');
        return await response.json();
    } catch (error) {
        console.error('Error fetching builder projects:', error);
        throw error;
    }
};

export const fetchBuilders = async (location = '') => {
    try {
        const params = new URLSearchParams();
        if (location) params.append('location', location);

        const response = await fetch(`${API_URL}/builders${location ? `?${params.toString()}` : ''}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            }
        });

        if (!response.ok) throw new Error('Failed to fetch builders');
        return await response.json();
    } catch (error) {
        console.error('Error fetching builders:', error);
        throw error;
    }
};

export const fetchProperties = async (filters = {}) => {
    try {
        // Build query string from filters
        const params = new URLSearchParams();
        if (filters.location) params.append('location', filters.location);
        if (filters.priceRange) params.append('price', filters.priceRange);
        if (filters.bhkTypes && Array.isArray(filters.bhkTypes)) {
            filters.bhkTypes.forEach(type => params.append('type', type));
        }
        const response = await fetch(`${API_URL}/properties/search?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch properties');
        return await response.json();
    } catch (error) {
        console.error('Error fetching properties:', error);
        throw error;
    }
};

export const createProperty = async (propertyData) => {
    try {
        const response = await fetch(`${API_URL}/properties`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(propertyData),
        });
        if (!response.ok) throw new Error('Failed to create property');
        return await response.json();
    } catch (error) {
        console.error('Error creating property:', error);
        throw error;
    }
};

export const fetchBlogs = async () => {
    try {
        const response = await fetch(`${API_URL}/blogs`);
        if (!response.ok) throw new Error('Failed to fetch blogs');
        return await response.json();
    } catch (error) {
        console.error('Error fetching blogs:', error);
        throw error;
    }
};