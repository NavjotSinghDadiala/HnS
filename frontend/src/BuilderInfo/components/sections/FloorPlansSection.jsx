import API_BASE_URL from '../../../config';
import React, { useEffect, useMemo, useState } from 'react';
import { fetchBuilderProjects } from '../../../services/api';

const normalizeUrl = (url) => {
    if (!url) return '';
    const value = String(url).trim();
    if (!value) return '';
    if (value.startsWith('http')) return value;
    if (value.startsWith('/uploads/')) return `${API_BASE_URL}${value}`;
    return `${API_BASE_URL}${value.startsWith('/') ? value : `/uploads/${value}`}`;
};

const parseImageUrls = (raw) => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.map((v) => String(v));

    const str = String(raw).trim();
    if (!str) return [];

    if (str.startsWith('[')) {
        try {
            const parsed = JSON.parse(str);
            return Array.isArray(parsed) ? parsed.map((v) => String(v)) : [];
        } catch {
            return [];
        }
    }

    if (str.includes(',') || str.includes('\n')) {
        return str.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
    }

    return [str];
};

const pickProjectImage = (project) => {
    if (project?.project_image) {
        const normalized = normalizeUrl(project.project_image);
        if (normalized) return normalized;
    }

    const imageUrls = parseImageUrls(project?.image_urls);
    if (imageUrls.length > 0) {
        const normalized = normalizeUrl(imageUrls[0]);
        if (normalized) return normalized;
    }

    const floorPlans = parseImageUrls(project?.floor_plans);
    if (floorPlans.length > 0) {
        const normalized = normalizeUrl(floorPlans[0]);
        if (normalized) return normalized;
    }

    return '/palm.jpg';
};

const FloorPlansSection = ({ builderId, builder }) => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadProjects = async () => {
            if (!builderId) return;
            try {
                setLoading(true);
                const data = await fetchBuilderProjects(builderId);
                setProjects(Array.isArray(data) ? data : []);
            } catch {
                setProjects([]);
            } finally {
                setLoading(false);
            }
        };

        loadProjects();
    }, [builderId]);

    const floorPlanItems = useMemo(() => {
        return projects
            .filter((project) => {
                const hasPlans = parseImageUrls(project?.floor_plans).length > 0;
                const hasImage = parseImageUrls(project?.image_urls).length > 0 || !!project?.project_image;
                return hasPlans || hasImage;
            })
            .slice(0, 8);
    }, [projects]);

    return (
        <div className="my-6 xs:my-7 sm:my-8">
            <div className="flex items-center mb-4 xs:mb-5 sm:mb-6 px-2 xs:px-3 sm:px-0">
                <h2 className="ml-2 xs:ml-3 builder-section-heading">
                    Existing in demand floor plans{builder?.company_name ? ` by ${builder.company_name}` : ''}
                </h2>
            </div>

            {loading && <div className="text-sm text-gray-500 px-4">Loading floor plans...</div>}

            {!loading && floorPlanItems.length === 0 && (
                <div className="text-sm text-gray-500 px-4">No floor plans available for this builder yet.</div>
            )}

            {!loading && floorPlanItems.length > 0 && (
                <div className="overflow-x-auto hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    <div className="flex gap-4 px-4 pb-2" style={{ width: 'max-content' }}>
                        {floorPlanItems.map((project) => {
                            const image = pickProjectImage(project);
                            const config = project.configuration || 'Configuration details available';
                            return (
                                <div
                                    key={project.id}
                                    className="w-[280px] rounded-xl overflow-hidden shadow-lg border-2 border-[#1e3a8a] bg-white"
                                >
                                    <div className="h-44">
                                        <img
                                            src={image}
                                            alt={project.title || 'Project floor plan'}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.currentTarget.src = '/palm.jpg';
                                            }}
                                        />
                                    </div>
                                    <div className="p-3">
                                        <h3 className="font-serif text-base text-gray-900">{project.title || 'Project'}</h3>
                                        <p className="text-xs text-gray-600 mt-1">{project.location || 'Location unavailable'}</p>
                                        <p className="text-xs text-gray-700 mt-1">{config}</p>
                                        <p className="text-sm text-blue-700 mt-2">{project.price_range || 'Price on request'}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FloorPlansSection;
