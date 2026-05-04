import React from 'react';

const toArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const WhoWeAreSection = ({ builder }) => {
  const companyName = builder?.company_name || 'Our team';
  const shortDesc = builder?.short_description || 'Trusted real-estate delivery with transparent processes and quality construction.';
  const awards = toArray(builder?.awards);
  const completed = builder?.completed_projects ?? 0;
  const ongoing = builder?.ongoing_projects ?? 0;

  return (
    <div className="bg-gray-50 rounded-none p-4 pb-6 md:rounded-2xl md:p-6 md:pb-8">
      <div className="mb-4 flex items-center md:mb-5">
        <div className="mr-3 h-1 w-8 bg-blue-700 md:w-10"></div>
        <div className="text-sm font-serif text-blue-800 md:text-base">Who We Are.</div>
      </div>

      <div className="flex flex-col gap-6 md:flex-row md:gap-8">
        <div className="order-2 w-full md:order-1 md:w-3/5 md:pr-8">
          <h2 className="builder-section-heading mb-3 md:mb-4">{companyName}: Crafting Landmarks, Building Trust.</h2>

          <p className="mb-6 text-sm text-gray-600 md:mb-8 md:text-base">
            {shortDesc}
          </p>

          <div className="space-y-4 md:space-y-6">
            <div className="flex items-start gap-3 rounded-lg bg-white p-4 shadow-sm md:gap-4 md:rounded-xl md:p-5">
              <div className="text-blue-700">
                <svg className="h-5 w-5 md:h-6 md:w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <h3 className="text-m font-serif text-gray-800 md:text-base">Project Portfolio</h3>
                <p className="text-xs text-gray-500 md:text-sm">Completed: {completed} projects | Ongoing: {ongoing} projects.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg bg-white p-4 shadow-sm md:gap-4 md:rounded-xl md:p-5">
              <div className="text-blue-700">
                <svg className="h-5 w-5 md:h-6 md:w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <h3 className="text-m font-serif text-gray-800 md:text-base">Certified & Approved</h3>
                <p className="text-xs text-gray-500 md:text-sm">
                  {builder?.rera_registered ? `RERA registered (${builder?.rera_id || 'ID available'})` : 'Registration details available on request'}
                  {awards.length > 0 ? ` | Awards: ${awards.slice(0, 2).join(', ')}` : ''}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="order-1 w-full md:order-2 md:w-2/5">
          <div className="grid grid-cols-2 gap-2 md:hidden">
            <img src="/building.webp" alt="Building Exterior" className="h-32 w-full rounded-lg object-cover" loading="lazy" />
            <img src="/presidental.jpeg" alt="Interior Design" className="h-32 w-full rounded-lg object-cover" loading="lazy" />
            <img src="/kalpa.jpg" alt="Aerial View" className="col-span-2 h-24 w-full rounded-lg object-cover" loading="lazy" />
          </div>
          <div className="relative hidden md:block" style={{ height: "280px", maxHeight: "65vw" }}>
            <div className="absolute left-0 top-0 z-10 rounded-2xl shadow-lg" style={{ width: '50%', height: '110%' }}>
              <img src="/building.webp" alt="Building Exterior" className="h-full w-full rounded-2xl object-cover" loading="lazy" />
            </div>
            <div className="absolute right-0 top-0 z-20 rounded-2xl shadow-lg" style={{ width: '47%', height: '70%', top: '-40px' }}>
              <img src="/presidental.jpeg" alt="Interior Design" className="h-full w-full rounded-2xl object-cover" loading="lazy" />
            </div>
            <div className="absolute right-0 bottom-0 z-20 rounded-2xl shadow-lg" style={{ width: '47%', height: '40%' }}>
              <img src="/kalpa.jpg" alt="Aerial View" className="h-full w-full rounded-2xl object-cover" loading="lazy" />
            </div>
            <div className="absolute right-2 top-4 rounded-2xl bg-blue-100 opacity-30 -z-10" style={{ width: '45%', height: '88%' }}></div>
            <div className="absolute bottom-0 left-0 z-30 h-4 w-4 rounded-full bg-blue-400 sm:h-5 sm:w-5" style={{ transform: 'translate(-30%, 30%)' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default WhoWeAreSection;