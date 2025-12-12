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
        // If the user still has Giscus configured in their Admin > Scripts settings (LocalStorage/Firestore),
        // we strip it out here to ensure it doesn't render over our new Firebase system.
        if (htmlCode.includes('giscus.app')) {
            // Regex to match <script> tags containing giscus.app (simple robust match)
            const giscusRegex = /<script[^>]*src=["'].*?giscus\.app.*?["'][^>]*>.*?<\/script>/gis;
            const cleanHtml = htmlCode.replace(giscusRegex, '');
            
            // If strictly just the script tag, we might have specific <script>...class="giscus"...</script> block 
            // depending on how they pasted it. We'll also just block if it contains the giscus class div.
            if (htmlCode.includes('class="giscus"')) {
                 htmlCode = htmlCode.replace(/<div class="giscus"><\/div>/g, '');
            }

            // Apply regex replacement
            htmlCode = cleanHtml;
            
            // If nothing left, return
            if (!htmlCode.trim()) return;
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

  }, [adsConfig.globalHeadScript, adsConfig.globalBodyScript]);

  return null; // This component renders nothing visually
};