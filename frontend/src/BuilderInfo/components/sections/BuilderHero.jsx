import React from 'react';

const BuilderHero = ({ builder }) => {
    const builderTitle = builder?.company_name || 'Your Builder';
    const builderLocation = [builder?.city, builder?.state].filter(Boolean).join(', ');
    const subtitle = builder?.short_description || 'Verified credentials and detailed portfolio analysis for a smarter home-buying journey.';

    return (
        <div style={{
            width: '100%',
            background: 'linear-gradient(135deg, #0f2847 0%, #1e3a5f 50%, #2d5a9f 100%)',
            padding: '20px 10px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 8px 20px rgba(0, 0, 0, 0.2)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
            {/* Animated gradient overlay */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(45deg, transparent 0%, rgba(241, 217, 122, 0.03) 50%, transparent 100%)',
                animation: 'shimmer 3s ease-in-out infinite',
            }}></div>

            {/* Floating orbs for depth */}
            <div style={{
                position: 'absolute',
                top: '10%',
                right: '5%',
                width: '400px',
                height: '400px',
                background: 'radial-gradient(circle, rgba(45, 90, 159, 0.4) 0%, transparent 70%)',
                borderRadius: '50%',
                filter: 'blur(60px)',
                opacity: 0.6,
            }}></div>
            <div style={{
                position: 'absolute',
                bottom: '5%',
                left: '10%',
                width: '350px',
                height: '350px',
                background: 'radial-gradient(circle, rgba(241, 217, 122, 0.15) 0%, transparent 70%)',
                borderRadius: '50%',
                filter: 'blur(50px)',
                opacity: 0.5,
            }}></div>

            <div style={{
                maxWidth: '1200px',
                margin: '0 auto',
                position: 'relative',
                zIndex: 1,
            }}>
                <div style={{
                    textAlign: 'center',
                    color: '#fff',
                }}>
                    {/* Main Heading */}
                    <h1 style={{
                        fontSize: 'clamp(2rem, 3vw, 3.5rem)',
                        fontWeight: '800',
                        marginBottom: '10px',
                        lineHeight: '1.15',
                        letterSpacing: '0.03em',
                        color: '#ffffff',
                        textShadow: '0 2px 20px rgba(255, 255, 255, 0.2)',
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                    }}>
                        {builderTitle} <span style={{
                            background: 'linear-gradient(135deg, #F1D97A 0%, #f5e6a8 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            filter: 'drop-shadow(0 0 20px rgba(241, 217, 122, 0.4))',
                        }}>{builderLocation ? `in ${builderLocation}` : 'Builder Profile'}</span>
                    </h1>

                    {/* Subheading */}
                    <p style={{
                        fontSize: 'clamp(1.05rem, 2.2vw, 1.35rem)',
                        fontWeight: '400',
                        color: 'rgba(255, 255, 255, 0.85)',
                        maxWidth: '750px',
                        margin: '0 auto',
                        lineHeight: '1.7',
                        letterSpacing: '0.02em',
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                    }}>
                        {subtitle}
                    </p>
                </div>
            </div>

            <style>{`
                @keyframes shimmer {
                    0%, 100% {
                        opacity: 0.3;
                        transform: translateX(-100%);
                    }
                    50% {
                        opacity: 0.6;
                        transform: translateX(100%);
                    }
                }
            `}</style>
        </div>
    );
};

export default BuilderHero;