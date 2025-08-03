import React, { useEffect, useRef, useCallback } from 'react';

interface SafeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
  maxHeight?: string;
  className?: string;
}

/**
 * SafeModal - A React Portal-Free Modal Solution
 * 
 * This component completely eliminates React Portal usage and the associated
 * removeChild DOM manipulation errors. It renders directly in the component tree
 * without using createPortal, preventing all Portal-related crashes.
 * 
 * Key Features:
 * - No React Portal usage whatsoever
 * - Direct DOM rendering in component tree
 * - Safe state management with proper cleanup
 * - ESC key and click-outside support
 * - Prevents all removeChild errors
 * 
 * Critical: This component NEVER uses createPortal() or any Portal APIs
 */
const SafeModal: React.FC<SafeModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  maxWidth = 'max-w-4xl',
  maxHeight = 'max-h-[80vh]',
  className = ''
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const isCleaningUpRef = useRef(false);

  // Memoized close handler to prevent excessive re-renders
  const handleClose = useCallback(() => {
    if (isCleaningUpRef.current) return;
    isCleaningUpRef.current = true;
    onClose();
    // Reset cleanup flag after animation
    setTimeout(() => {
      isCleaningUpRef.current = false;
    }, 300);
  }, [onClose]);

  // Enhanced escape and body scroll management
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isCleaningUpRef.current) {
        e.preventDefault();
        e.stopPropagation();
        handleClose();
      }
    };

    if (isOpen) {
      // Prevent body scroll
      const originalStyle = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      
      // Add escape listener
      document.addEventListener('keydown', handleEscape, true);
      
      return () => {
        // Restore body scroll
        document.body.style.overflow = originalStyle;
        // Remove escape listener
        document.removeEventListener('keydown', handleEscape, true);
      };
    }
  }, [isOpen, handleClose]);

  // Render nothing when closed - complete cleanup
  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={(e) => {
        // Only close if clicking the overlay itself
        if (e.target === overlayRef.current && !isCleaningUpRef.current) {
          e.preventDefault();
          e.stopPropagation();
          handleClose();
        }
      }}
    >
      <div 
        ref={modalRef}
        className={`bg-white rounded-lg ${maxWidth} w-full ${maxHeight} overflow-hidden flex flex-col shadow-xl transform transition-all duration-200 ${className}`}
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          maxWidth: maxWidth === 'max-w-4xl' ? '56rem' : '32rem',
          width: '100%',
          maxHeight: maxHeight === 'max-h-[80vh]' ? '80vh' : '60vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}
        onClick={(e) => {
          // Prevent click propagation to overlay
          e.stopPropagation();
        }}
      >
        {/* Header - Fixed */}
        <div 
          className="border-b p-6 flex-shrink-0"
          style={{
            borderBottom: '1px solid #e5e7eb',
            padding: '24px',
            flexShrink: 0
          }}
        >
          <div className="flex items-center justify-between">
            <h2 
              className="text-lg font-semibold text-gray-900"
              style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#111827'
              }}
            >
              {title}
            </h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                padding: '8px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <svg 
                className="w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                style={{ width: '20px', height: '20px' }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div 
          className="p-6 overflow-y-auto flex-1"
          style={{
            padding: '24px',
            overflowY: 'auto',
            flex: 1
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default SafeModal;