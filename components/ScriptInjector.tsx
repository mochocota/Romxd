import React, { useEffect } from 'react';
import { useGames } from '../context/GameContext';

/**
 * This component listens to the global ads/script configuration and injects
 * the HTML/JS into the document Head or Body.
 * Useful for AdSense Verification, Google Analytics, etc.
 */
export const ScriptInjector: React.FC = () => {
  const { adsConfig } = useGames();

  useEffect(() => {
    // Function to inject scripts and keep track of them to avoid duplicates or leaks
    const injectScripts = (htmlCode: string, target: HTMLElement, id: string) => {
        // 1. Cleanup previous injections with this ID
        const existingElements = document.querySelectorAll(`[data-injector-id="${id}"]`);
        existingElements.forEach(el => el.remove());

        if (!htmlCode) return;

        // --- SAFETY FILTER: BLOCK LEGACY GISCUS SCRIPTS ---
        // Completely strip out any script or HTML block related to Giscus
        // This is a nuclear option to ensure it doesn't render even if configured.
        if (htmlCode.toLowerCase().includes('giscus')) {
            console.warn('Blocked Giscus script injection attempt.');
            return;
        }
        // --------------------------------------------------

        // 2. Create a range to parse the HTML string into actual DOM nodes
        // ContextualFragment is required to make <script> tags executable
        try {
            const range = document.createRange();
            range.selectNode(target); // Set context to head or body
            const fragment = range.createContextualFragment(htmlCode);

            // 3. Mark elements so we can remove them later if config changes
            Array.from(fragment.children).forEach(child => {
                child.setAttribute('data-injector-id', id);
            });

            // 4. Append to target
            target.appendChild(fragment);
        } catch (e) {
            console.error(`Failed to inject scripts for ${id}:`, e);
        }
    };

    // Inject Head Scripts
    injectScripts(adsConfig.globalHeadScript, document.head, 'global-head-scripts');

    // Inject Body Scripts (Usually appended to the end of body)
    injectScripts(adsConfig.globalBodyScript, document.body, 'global-body-scripts');

    // --- AGGRESSIVE CLEANUP ---
    // In case Giscus was injected previously or via other means, assume any .giscus class element is unwanted
    // and remove it from the DOM.
    const cleanupGiscus = () => {
        const giscusElements = document.querySelectorAll('.giscus, iframe[src*="giscus"]');
        giscusElements.forEach(el => el.remove());
    };
    
    // Run cleanup immediately and on a small interval to catch delayed injections
    cleanupGiscus();
    const interval = setInterval(cleanupGiscus, 1000);
    return () => clearInterval(interval);

  }, [adsConfig.globalHeadScript, adsConfig.globalBodyScript]);

  return null; // This component renders nothing visually
};