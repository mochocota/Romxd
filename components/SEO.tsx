import React, { useEffect } from 'react';

interface SEOProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  noIndex?: boolean;
  structuredData?: object; // For JSON-LD Schema
}

export const SEO: React.FC<SEOProps> = ({ 
  title, 
  description, 
  image, 
  url, 
  type = 'website',
  noIndex = false,
  structuredData 
}) => {
  
  const siteTitle = "RomXD";
  const fullTitle = title === siteTitle ? title : `${title} | ${siteTitle}`;
  const currentUrl = url || window.location.href;
  const defaultImage = "https://picsum.photos/id/177/1200/600"; // Replace with your actual logo/banner URL
  const metaImage = image || defaultImage;

  useEffect(() => {
    // 1. Update Title
    document.title = fullTitle;

    // 2. Helper to update meta tags
    const updateMeta = (name: string, content: string, attribute = 'name') => {
      let element = document.querySelector(`meta[${attribute}="${name}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // 3. Update Standard Meta
    updateMeta('description', description);
    
    // Robots
    if (noIndex) {
        updateMeta('robots', 'noindex, nofollow');
    } else {
        updateMeta('robots', 'index, follow');
    }

    // 4. Update Open Graph (Facebook/Discord)
    updateMeta('og:title', fullTitle, 'property');
    updateMeta('og:description', description, 'property');
    updateMeta('og:image', metaImage, 'property');
    updateMeta('og:url', currentUrl, 'property');
    updateMeta('og:type', type, 'property');
    updateMeta('og:site_name', siteTitle, 'property');

    // 5. Update Twitter
    updateMeta('twitter:title', fullTitle, 'property');
    updateMeta('twitter:description', description, 'property');
    updateMeta('twitter:image', metaImage, 'property');
    updateMeta('twitter:card', 'summary_large_image', 'property');

    // 6. Update Canonical Link
    let linkCanonical = document.querySelector('link[rel="canonical"]');
    if (!linkCanonical) {
        linkCanonical = document.createElement('link');
        linkCanonical.setAttribute('rel', 'canonical');
        document.head.appendChild(linkCanonical);
    }
    linkCanonical.setAttribute('href', currentUrl);

    // 7. Inject Structured Data (JSON-LD)
    if (structuredData) {
        const scriptId = 'seo-structured-data';
        let script = document.getElementById(scriptId);
        
        if (!script) {
            script = document.createElement('script');
            script.id = scriptId;
            script.setAttribute('type', 'application/ld+json');
            document.head.appendChild(script);
        }
        
        script.textContent = JSON.stringify(structuredData);
    }

  }, [title, description, image, url, type, noIndex, structuredData, fullTitle, metaImage, currentUrl]);

  return null;
};