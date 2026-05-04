const EXTERNAL_URL_REGEX = /^https?:\/\//i;

export const isExternalBlogSlug = (slug) => {
    return EXTERNAL_URL_REGEX.test(String(slug || '').trim());
};

export const normalizeBlogSlug = (slug) => {
    const value = String(slug || '').trim();
    if (!value) return '';

    if (isExternalBlogSlug(value)) {
        return value;
    }

    return value.replace(/^\/+|\/+$/g, '');
};

export const getBlogTargetFromSlug = (slug) => {
    const normalized = normalizeBlogSlug(slug);

    if (!normalized) {
        return '/blogs';
    }

    if (isExternalBlogSlug(normalized)) {
        return normalized;
    }

    return `/blog/${encodeURIComponent(normalized)}`;
};
