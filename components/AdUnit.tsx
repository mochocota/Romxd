import React, { useEffect, useRef } from 'react';

interface AdUnitProps {
  adCode: string;
  className?: string;
  label?: string;
}

// Safe Ad Renderer Helper
// This ensures that <script> tags inside the HTML string actually execute.
// React's dangerouslySetInnerHTML doesn't execute scripts for security reasons.
export const AdUnit: React.FC<AdUnitProps> = ({ adCode, className, label }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current || !adCode) return;

        // Clear previous content
        containerRef.current.innerHTML = '';
        
        // --- SAFETY FILTER ---
        // Block Giscus if it was accidentally pasted into an ad block
        if (adCode.toLowerCase().includes('giscus')) {
            console.warn('Blocked Giscus script in AdUnit.');
            return;
        }

        // Create a range to execute fragments
        try {
            const range = document.createRange();
            range.selectNode(containerRef.current);
            const documentFragment = range.createContextualFragment(adCode);
            containerRef.current.appendChild(documentFragment);
        } catch (e) {
            console.error("Failed to render ad unit:", e);
            // Fallback for simple HTML without scripts
            containerRef.current.innerHTML = adCode;
        }
    }, [adCode]);

    if (!adCode) {
        if (label) {
            return (
                <div className={`flex flex-col items-center justify-center bg-gray-100 dark:bg-[#222] border-2 border-dashed border-gray-300 dark:border-[#333] ${className}`}>
                     <span className="text-xs text-zinc-400 font-mono text-center px-4">ESPACIO PUBLICITARIO ({label}) <br/> (Configurar en Admin)</span>
                </div>
            );
        }
        return null; // Render nothing if no code and no label (for production look)
    }

    return <div ref={containerRef} className={className} />;
};