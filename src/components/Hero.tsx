import React from 'react';

const HERO_ARTWORK_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCYG4G9YSO8Asfyfqdu5O-ludD0oFoqnTNM1461_cd-OYNBOQ0ZzAy5UybHPwkSMPwecOYM6ArFBHMP5uIYzoCPhDs-oBaArYCT7VxZPl4yBrp-c_Wr3bqGn0B7RXjDzZdT8RBuayikJie1Nt_80UfSeZW62MsCNqZaTMjFZTbTPWh82V5Bjp7spRIsUTdkwW2_fclLdIKXuLpiZajnd57V-a7aMF7Wy_n4CZQ0FjeU0BhPqzJooy_RJE7D9cC0SMkraZG1FVcnHSFu2A';

export const Hero: React.FC = () => {
  return (
    <section className="w-full flex flex-col items-center text-center pt-8 pb-2">
      {/* Status Pill Tag */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#141414] border border-[#303030] mb-5">
        <span className="w-1.5 h-1.5 rounded-full bg-[#E5484D]"></span>
        <span className="font-display uppercase tracking-wider text-[11px] font-semibold text-[#B0B0B0]">
          Studio Cloud Core
        </span>
        <span className="text-[#303030]">|</span>
        <span className="font-mono text-white text-[11px]">Instant Deploy</span>
      </div>

      {/* Hero Headline & Copy */}
      <div className="max-w-3xl space-y-4 mb-6">
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold font-display tracking-tight text-white uppercase leading-[1.12]">
          BUILD WEBSITES. BUILD APPS. BUILD WITH <span className="text-[#E5484D]">AI</span>.
        </h1>
        <p className="text-sm sm:text-base md:text-lg text-[#B0B0B0] font-normal leading-relaxed max-w-2xl mx-auto">
          Turn your ideas into real websites and web apps. Generate code, edit your project,
          preview it live, and push your work to GitHub — all in one workspace.
        </p>
      </div>

      {/* Hero Artwork - Displayed directly within the hero layout without framing card, thick borders, or unnecessary container padding */}
      <div className="w-full flex items-center justify-center my-2 sm:my-3">
        <img
          src={HERO_ARTWORK_URL}
          alt="AI Developer in red hoodie generating software workspace"
          className="w-full max-w-[320px] xs:max-w-[360px] sm:max-w-[440px] md:max-w-[500px] lg:max-w-[512px] h-auto object-contain rounded-md select-none"
          loading="eager"
        />
      </div>
    </section>
  );
};
