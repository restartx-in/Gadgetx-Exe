import { useEffect } from "react";

/**
 * Lightweight SEO head manager for React SPA.
 * Dynamically updates <title>, <meta>, <link>, and injects JSON-LD structured data.
 *
 * @param {Object}   props
 * @param {string}   props.title        – Page title (appended with " | AccountX")
 * @param {string}   [props.description] – Meta description
 * @param {string}   [props.canonical]   – Canonical URL
 * @param {string}   [props.ogImage]     – Open Graph image URL
 * @param {string}   [props.ogType]      – Open Graph type (default "website")
 * @param {boolean}  [props.noIndex]     – Set true to add noindex
 * @param {string}   [props.keywords]    – Comma-separated keywords
 * @param {Object}   [props.jsonLd]      – JSON-LD structured data object
 */
const SEO = ({
  title,
  description,
  canonical,
  ogImage,
  ogType = "website",
  noIndex = false,
  keywords,
  jsonLd,
}) => {
  useEffect(() => {
    // ── Title ──
    const fullTitle = title
      ? `${title} | AccountX`
      : "AccountX – Unified Business Software for Modern Enterprises";
    document.title = fullTitle;

    // ── Helper: set or create a <meta> tag ──
    const setMeta = (attr, key, content) => {
      if (!content) return;
      let el = document.querySelector(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    // ── Description ──
    if (description) {
      setMeta("name", "description", description);
      setMeta("property", "og:description", description);
      setMeta("name", "twitter:description", description);
    }

    // ── Keywords ──
    if (keywords) {
      setMeta("name", "keywords", keywords);
    }

    // ── Open Graph ──
    setMeta("property", "og:title", fullTitle);
    setMeta("property", "og:type", ogType);
    if (canonical) setMeta("property", "og:url", canonical);
    if (ogImage) setMeta("property", "og:image", ogImage);
    setMeta("property", "og:site_name", "AccountX");
    setMeta("property", "og:locale", "en_US");

    // ── Twitter ──
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", fullTitle);
    if (ogImage) setMeta("name", "twitter:image", ogImage);

    // ── Canonical ──
    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", "canonical");
        document.head.appendChild(link);
      }
      link.setAttribute("href", canonical);
    }

    // ── Robots ──
    setMeta("name", "robots", noIndex ? "noindex, nofollow" : "index, follow");

    // ── JSON-LD Structured Data ──
    let scriptEl = null;
    if (jsonLd) {
      scriptEl = document.createElement("script");
      scriptEl.setAttribute("type", "application/ld+json");
      scriptEl.setAttribute("data-seo", "dynamic");
      scriptEl.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(scriptEl);
    }

    // Cleanup dynamic JSON-LD on unmount
    return () => {
      if (scriptEl && scriptEl.parentNode) {
        scriptEl.parentNode.removeChild(scriptEl);
      }
    };
  }, [title, description, canonical, ogImage, ogType, noIndex, keywords, jsonLd]);

  return null;
};

export default SEO;
