'use client';

import { Mail, Instagram, Youtube } from 'lucide-react';

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    height="1em" 
    width="1em" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

const linkButtons = [
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/lifeofjmar_',
    icon: <Instagram size={28} className="text-gray-700" />,
    username: '@lifeofjmar_'
  },
  {
    label: 'TikTok',
    href: 'https://www.tiktok.com/@lifeofjmar',
    icon: <TikTokIcon className="w-7 h-7 text-gray-700" />,
    username: '@lifeofjmar'
  },
  {
    label: 'YouTube',
    href: 'https://www.youtube.com/@lifeofjmar',
    icon: <Youtube size={28} className="text-gray-700" />,
    username: '@lifeofjmar'
  },
  {
    label: 'Business Email',
    href: 'mailto:jackmarich1@gmail.com',
    icon: <Mail size={28} className="text-gray-700" />,
    username: 'jackmarich1@gmail.com'
  }
];

const socialIcons = [
  {
    href: 'https://www.instagram.com/lifeofjmar_',
    icon: <Instagram size={28} />,
    label: 'Instagram'
  },
  {
    href: 'https://www.tiktok.com/@lifeofjmar',
    icon: <TikTokIcon className="w-7 h-7" />,
    label: 'TikTok'
  },
  {
    href: 'https://www.youtube.com/@lifeofjmar',
    icon: <Youtube size={28} />,
    label: 'YouTube'
  },
  {
    href: 'mailto:jackmarich1@gmail.com',
    icon: <Mail size={28} />,
    label: 'Email'
  }
];

export default function BioPage() {
  return (
    <main className="min-h-screen w-full relative font-sans text-white overflow-x-hidden">
      {/* Background Image with Gradient Overlay */}
      <div className="fixed inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/background.png)'
          }}
        />
        {/* Dark gradient overlay - starts near buttons, lighter at top */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent via-black/20 to-black/90 pointer-events-none" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 flex flex-col items-center min-h-screen w-full max-w-md mx-auto py-16 px-5">
        
        {/* Profile Section */}
        <div className="flex flex-col items-center mb-16 w-full">
          {/* Name */}
          <h1 className="text-4xl font-extrabold tracking-tight mb-3 text-white drop-shadow-lg">
            Jmar
          </h1>
          
          {/* PO Box Coming Soon */}
          <p className="text-white text-sm font-medium opacity-90 drop-shadow-md mb-2">
            PO Box coming soon
          </p>
          
          {/* Email with Icon */}
          <div className="flex items-center gap-2 mb-6">
            <Mail size={16} className="text-white opacity-90" />
            <p className="text-white text-sm font-medium opacity-90 drop-shadow-md">
              jackmarich1@gmail.com
            </p>
          </div>
        </div>

        {/* Social Icons Row */}
        <div className="flex gap-6 mb-20">
          {socialIcons.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-gray-200 hover:scale-110 transition-all duration-200 drop-shadow-lg"
              aria-label={link.label}
            >
              {link.icon}
            </a>
          ))}
        </div>

        {/* Link Buttons - Matching screenshot style */}
        <div className="w-full flex flex-col gap-3">
          {linkButtons.map((button, i) => (
            <a
              key={button.label}
              href={button.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-[#d4c5b9] hover:bg-[#c9b8aa] rounded-lg p-0 overflow-hidden flex items-center h-20 transition-all duration-200 active:scale-[0.98] shadow-md"
            >
              {/* Icon/Thumbnail Area - Left Side */}
              <div className="w-20 h-full bg-gray-800 flex items-center justify-center flex-shrink-0">
                <div className="text-white">
                  {button.icon}
                </div>
              </div>
              
              {/* Text Content - Right Side */}
              <div className="flex flex-col flex-grow px-4 justify-center h-full">
                <span className="text-gray-900 font-bold text-base leading-tight">
                  {button.label}
                </span>
                <span className="text-gray-600 text-xs mt-0.5 font-medium">
                  {button.username}
                </span>
              </div>
            </a>
          ))}
        </div>

      </div>
    </main>
  );
}
