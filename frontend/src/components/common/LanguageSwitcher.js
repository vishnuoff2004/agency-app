import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';

function LanguageSwitcher() {
  const { t } = useTranslation();
  const { language, changeLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredCode, setHoveredCode] = useState(null);
  const containerRef = useRef(null);

  const languages = [
    { code: 'en', label: t('language.switcher.english', 'English'), flag: '🇬🇧' },
    { code: 'ta', label: t('language.switcher.tamil', 'Tamil'), flag: '🇮🇳' },
  ];

  const currentLanguage = languages.find(lang => lang.code === language) || languages[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  const handleSelect = (code) => {
    changeLanguage(code);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Dropdown Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '8px 10px',
          borderRadius: '8px',
          border: '1px solid var(--color-border, #e5e7eb)',
          background: 'var(--color-bg, #ffffff)',
          color: 'var(--color-text, #1f2937)',
          cursor: 'pointer',
          fontSize: '0.875rem',
          fontWeight: '500',
          transition: 'all 0.2s ease',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-accent, #7c3aed)';
          e.currentTarget.style.background = 'var(--color-bg-hover, #f9fafb)';
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.borderColor = 'var(--color-border, #e5e7eb)';
            e.currentTarget.style.background = 'var(--color-bg, #ffffff)';
          }
        }}
      >
        <span style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center' }}>🌐</span>
        <span style={{
          fontSize: '0.65rem',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease',
          display: 'inline-block'
        }}>
          ▼
        </span>
      </button>

      {/* Dropdown Menu Overlay */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          right: 0,
          background: 'var(--color-card, #ffffff)',
          border: '1px solid var(--color-border, #e5e7eb)',
          borderRadius: '8px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          padding: '6px 0',
          width: '180px',
          zIndex: 1000,
          animation: 'fadeIn 0.15s ease-out',
        }}>
          {languages.map(lang => {
            const isSelected = lang.code === language;
            const isHovered = hoveredCode === lang.code;
            return (
              <div
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                onMouseEnter={() => setHoveredCode(lang.code)}
                onMouseLeave={() => setHoveredCode(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 16px',
                  cursor: 'pointer',
                  background: isHovered ? 'var(--color-bg-hover, #f3f4f6)' : 'transparent',
                  transition: 'background 0.15s ease',
                }}
              >
                {/* Custom Radio Button Indicator */}
                <div style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  border: isSelected
                    ? '2px solid var(--color-accent, #7c3aed)'
                    : '2px solid var(--color-border, #ccc)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'transparent',
                  transition: 'all 0.15s ease',
                }}>
                  {isSelected && (
                    <div style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: 'var(--color-accent, #7c3aed)',
                    }} />
                  )}
                </div>

                {/* Language Label */}
                <span style={{
                  fontSize: '0.875rem',
                  fontWeight: isSelected ? '600' : '400',
                  color: 'var(--color-text, #1f2937)',
                }}>
                  {lang.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default LanguageSwitcher;
