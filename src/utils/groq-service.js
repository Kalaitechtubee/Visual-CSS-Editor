// groq-service.js
// Enhanced AI Service for Pixel-Perfect Code Generation
// Utilizes complete DOM structure, exact styles, and all assets
const API_BASE_URL = 'https://api.groq.com/openai/v1';
const MODEL = 'llama-3.3-70b-versatile';
const FALLBACK_MODEL = 'llama-3.1-8b-instant';
const MAX_RETRIES = 3;

/**
 * Wait for a specified duration
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>}
 */
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function getApiKey() {
    try {
        const result = await chrome.storage.sync.get(['groqApiKey']);
        if (!result.groqApiKey || result.groqApiKey.trim() === '') {
            throw new Error('API key not configured. Please add your Groq API key in Settings tab.');
        }
        return result.groqApiKey.trim();
    } catch (error) {
        console.error('Failed to get API key:', error);
        throw new Error('API key not found. Please configure in Settings tab.');
    }
}

async function makeGroqRequest(systemPrompt, userPrompt) {
    console.log('🤖 Making Groq API request...');
    console.log('📝 Prompt length:', userPrompt.length, 'characters');
    const apiKey = await getApiKey();
    let currentModel = MODEL;
    let attempt = 0;
    while (attempt <= MAX_RETRIES) {
        try {
            console.log(`🔄 Attempt ${attempt + 1}/${MAX_RETRIES + 1} using ${currentModel}...`);
            const response = await fetch(`${API_BASE_URL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: currentModel,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    temperature: 0.2,
                    max_tokens: 8000,
                    top_p: 1,
                    stream: false
                })
            });
            if (!response.ok) {
                // Handle Rate Limiting (429) specially
                if (response.status === 429) {
                    console.warn(`⚠️ Rate limit exceeded for ${currentModel}`);
                    if (attempt < MAX_RETRIES) {
                        // Exponential backoff + jitter
                        const delay = Math.pow(2, attempt) * 1000 + (Math.random() * 500);
                        console.log(`⏳ Waiting ${Math.round(delay)}ms before retry...`);
                        await wait(delay);
                        attempt++;
                        continue;
                    } else if (currentModel === MODEL) {
                        // Switch to fallback model if main model fails after retries
                        console.warn(`⚠️ Switching to fallback model: ${FALLBACK_MODEL}`);
                        currentModel = FALLBACK_MODEL;
                        attempt = 0; // Reset retries for fallback model
                        continue;
                    }
                }
                const errorText = await response.text();
                console.error('❌ API Error:', response.status, errorText);
                let errorMessage = `API Error ${response.status}`;
                try {
                    const errorJson = JSON.parse(errorText);
                    if (errorJson.error && errorJson.error.message) {
                        errorMessage = errorJson.error.message;
                    }
                } catch (e) { }
                if (response.status === 401) {
                    errorMessage = 'Invalid API key. Please check your settings.';
                } else if (response.status === 500) {
                    errorMessage = 'Groq API server error. Please try again later.';
                }
                throw new Error(errorMessage);
            }
            const data = await response.json();
            console.log('✅ API Response received');
            if (!data.choices || data.choices.length === 0) {
                throw new Error('No response from API');
            }
            const content = data.choices[0]?.message?.content;
            if (!content || content.trim() === '') {
                throw new Error('Empty response from API');
            }
            console.log('📄 Generated code length:', content.length, 'characters');
            return cleanCode(content);
        } catch (error) {
            // If it's the last attempt and fallback model also failed, fail
            if (attempt === MAX_RETRIES && currentModel === FALLBACK_MODEL) {
                console.error('❌ Groq API Error (Final):', error);
                if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
                    chrome.runtime.sendMessage({
                        type: 'LOG_ERROR',
                        error: `Groq API: ${error.message}`
                    }).catch(() => { });
                }
                throw error;
            }
            // For network errors etc that aren't 429s caught above, we might just throw or retry
            // For safety, let's treat unknown errors as retryable if we have retries left
            if (attempt < MAX_RETRIES) {
                const delay = Math.pow(2, attempt) * 1000;
                await wait(delay);
                attempt++;
                continue;
            }
            throw error;
        }
    }
}

function cleanCode(text) {
    if (!text) return '';
    let cleaned = text.replace(/```[\w]*\n?/g, '');
    cleaned = cleaned.replace(/```\s*$/g, '');
    cleaned = cleaned.trim();
    return cleaned;
}

function stylesToCSS(styles) {
    if (!styles || typeof styles !== 'object') return '';
    return Object.entries(styles)
        .filter(([key, value]) => value !== undefined && value !== null && value !== '')
        .map(([key, value]) => {
            const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
            return ` ${cssKey}: ${value};`;
        })
        .join('\n');
}

// Format DOM structure for AI prompt
function formatDOMStructure(domStructure, indent = 0) {
    if (!domStructure) return '';
    const indentStr = ' '.repeat(indent);
    let result = `${indentStr}<${domStructure.tagName}`;
    // Add key attributes
    if (domStructure.attributes) {
        for (const [key, value] of Object.entries(domStructure.attributes)) {
            if (['class', 'id', 'src', 'href', 'alt', 'type'].includes(key)) {
                result += ` ${key}="${value}"`;
            }
        }
    }
    result += '>\n';
    // Add text content
    if (domStructure.textContent) {
        result += `${indentStr} ${domStructure.textContent}\n`;
    }
    // Add children
    if (domStructure.children && domStructure.children.length > 0) {
        domStructure.children.forEach(child => {
            result += formatDOMStructure(child, indent + 1);
        });
    }
    result += `${indentStr}</${domStructure.tagName}>\n`;
    return result;
}

// Format assets for AI prompt
function formatAssets(assets) {
    if (!assets || assets.length === 0) return 'No assets found.';
    const grouped = {
        images: [],
        backgrounds: [],
        icons: [],
        svgs: [],
        videos: [],
        other: []
    };
    assets.forEach(asset => {
        if (asset.type.includes('img')) {
            grouped.images.push(asset);
        } else if (asset.type.includes('background')) {
            grouped.backgrounds.push(asset);
        } else if (asset.type.includes('icon') || asset.type.includes('svg')) {
            grouped.icons.push(asset);
        } else if (asset.type.includes('video')) {
            grouped.videos.push(asset);
        } else {
            grouped.other.push(asset);
        }
    });
    let result = '';
    if (grouped.images.length > 0) {
        result += '\n=== IMAGES ===\n';
        grouped.images.forEach((asset, i) => {
            result += `${i + 1}. [${asset.selector}] ${asset.url}${asset.alt ? ` (alt: "${asset.alt}")` : ''}\n`;
            if (asset.width && asset.height) {
                result += ` Dimensions: ${asset.width}×${asset.height}\n`;
            }
        });
    }
    if (grouped.backgrounds.length > 0) {
        result += '\n=== BACKGROUND IMAGES ===\n';
        grouped.backgrounds.forEach((asset, i) => {
            result += `${i + 1}. [${asset.selector}] ${asset.url}\n`;
            if (asset.backgroundSize) result += ` Size: ${asset.backgroundSize}\n`;
            if (asset.backgroundPosition) result += ` Position: ${asset.backgroundPosition}\n`;
        });
    }
    if (grouped.icons.length > 0) {
        result += '\n=== ICONS & SVGs ===\n';
        grouped.icons.forEach((asset, i) => {
            if (asset.type === 'svg-inline') {
                result += `${i + 1}. [${asset.selector}] Inline SVG (${asset.width}×${asset.height})\n`;
                result += ` Code: ${asset.code.substring(0, 200)}...\n`;
            } else if (asset.type === 'icon-font') {
                result += `${i + 1}. [${asset.selector}] Icon Font: ${asset.classes}\n`;
                result += ` Font Family: ${asset.fontFamily}\n`;
            } else {
                result += `${i + 1}. [${asset.selector}] ${asset.url}\n`;
            }
        });
    }
    if (grouped.videos.length > 0) {
        result += '\n=== VIDEOS ===\n';
        grouped.videos.forEach((asset, i) => {
            result += `${i + 1}. [${asset.selector}] ${asset.url}\n`;
        });
    }
    return result || 'No assets detected.';
}

// System Prompts
const REACT_SYSTEM_PROMPT = `You are an EXPERT React developer specializing in PIXEL-PERFECT UI replication.
YOUR MISSION: Generate React components that are IDENTICAL to the provided design - down to the exact pixel, color, spacing, and asset.
CRITICAL RULES:
1. **EXACT FIDELITY**: Use precise hex colors, exact pixel dimensions, and specific font values from the provided styles.
2. **COMPLETE STRUCTURE**: Replicate the ENTIRE DOM hierarchy. Every child element, every text node, every icon.
3. **ASSET ACCURACY**: Use the EXACT URLs provided for images, icons, and media. Do not use placeholders.
4. **TAILWIND PRECISION**: Use arbitrary values (e.g., \`bg-[#1a1d23]\`, \`w-[342px]\`) when standard utilities don't match exactly.
5. **NO APPROXIMATIONS**: Do not round dimensions, approximate colors, or simplify structure.
6. **NO HALLUCINATIONS**: Only add properties explicitly in the styles. No shadows, borders, or effects unless specified.

BACKGROUND CONTEXT RULE (CRITICAL):
- If \`_context.visuallyTransparent\` is true, you MUST use \`_context.effectiveBackgroundColor\` as the visual background.
- Do NOT invent colors.
- If contrastWarning is present, preserve colors but ensure visibility using the effective background.
- DO NOT attempt to improve contrast by changing colors.
- Only resolve visual transparency using provided context.

CONTRAST RULE:
- If \`_context.contrastRatio\` < 4.5, do NOT change colors. Only apply the resolved background context from \`_context\`.

TECHNICAL REQUIREMENTS:
- React 18+ functional components
- Tailwind CSS for ALL styling (no inline styles except for dynamic values)
- Proper semantic HTML
- Accessibility attributes (ARIA labels, alt text)
- Responsive design (mobile-first, but preserve exact desktop dimensions)
- Export as default
OUTPUT FORMAT:
Return ONLY the complete React component code. No explanations, no markdown, no comments outside the code.`;

const HTML_SYSTEM_PROMPT = `You are an EXPERT frontend developer specializing in PIXEL-PERFECT UI replication.
YOUR MISSION: Generate HTML/CSS that is IDENTICAL to the provided design - down to the exact pixel, color, spacing, and asset.
CRITICAL RULES:
1. **EXACT FIDELITY**: Use precise hex colors, exact pixel dimensions, and specific font values.
2. **COMPLETE STRUCTURE**: Replicate the ENTIRE DOM hierarchy with all children and text nodes.
3. **ASSET ACCURACY**: Use the EXACT URLs provided. No placeholders or generic images.
4. **CSS PRECISION**: Match all computed styles exactly, including margins, paddings, and borders.
5. **NO APPROXIMATIONS**: Do not round, simplify, or approximate any values.

BACKGROUND CONTEXT RULE (CRITICAL):
- If \`_context.visuallyTransparent\` is true, you MUST use \`_context.effectiveBackgroundColor\` as the visual background.
- Do NOT invent colors.
- If contrastWarning is present, preserve colors but ensure visibility using the effective background.
- DO NOT attempt to improve contrast by changing colors.
- Only resolve visual transparency using provided context.

CONTRAST RULE:
- If \`_context.contrastRatio\` < 4.5, do NOT change colors. Only apply the resolved background context from \`_context\`.

TECHNICAL REQUIREMENTS:
- Valid HTML5 with semantic elements
- All CSS in <style> tag (scoped to element)
- No frameworks or libraries
- Fully responsive (mobile-first)
- Cross-browser compatible
OUTPUT FORMAT:
Return ONLY the complete HTML document. No explanations, no markdown blocks.`;

// Generate React Component
export async function generateReactTailwind(selector, styles, elementInfo = {}, htmlContext = '', assets = [], domStructure = null) {
    console.log('🎨 Generating pixel-perfect React component...');
    const tagName = elementInfo.tagName || 'div';
    const textPreview = elementInfo.textContent?.substring(0, 100) || 'No text content';
    // Format assets
    const assetsFormatted = formatAssets(assets);
    // Format DOM structure
    const domFormatted = domStructure ? formatDOMStructure(domStructure) : htmlContext.substring(0, 5000);
    // Format styles with only defined values
    const definedStyles = Object.entries(styles)
        .filter(([_, v]) => v !== undefined && v !== null)
        .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});
    const userPrompt = `Generate a PIXEL-PERFECT React component replicating this UI element EXACTLY.
═══════════════════════════════════════════════════════════════
ELEMENT IDENTIFICATION
═══════════════════════════════════════════════════════════════
Selector: ${selector}
Tag: ${tagName}
Text Preview: ${textPreview}
═══════════════════════════════════════════════════════════════
EXACT STYLES (USE THESE PRECISELY)
═══════════════════════════════════════════════════════════════
${JSON.stringify(definedStyles, null, 2)}
KEY STYLE NOTES:
- Colors: Use EXACT hex values (e.g., bg-[${definedStyles.backgroundColor || '#ffffff'}])
- Dimensions: Use EXACT pixel values (e.g., w-[${definedStyles.width || 'auto'}])
- Spacing: Margins and paddings must match EXACTLY
- Typography: Font size, weight, and line-height must be precise
═══════════════════════════════════════════════════════════════
COMPLETE DOM STRUCTURE (REPLICATE FULLY)
═══════════════════════════════════════════════════════════════
${domFormatted}
STRUCTURE NOTES:
- Include ALL child elements shown above
- Maintain the exact nesting hierarchy
- Preserve all text content
- Replicate all HTML attributes
═══════════════════════════════════════════════════════════════
ASSETS (USE EXACT URLs - NO PLACEHOLDERS)
═══════════════════════════════════════════════════════════════
${assetsFormatted}
ASSET REQUIREMENTS:
- Use the EXACT URLs provided above
- Match image dimensions if specified
- Include alt text for accessibility
- For inline SVGs, replicate the code exactly
- For icon fonts, use the specified classes
═══════════════════════════════════════════════════════════════
IMPLEMENTATION CHECKLIST
═══════════════════════════════════════════════════════════════
✓ All colors match exactly (use arbitrary values)
✓ All dimensions match exactly (use arbitrary values)
✓ Complete DOM structure replicated
✓ All assets use provided URLs
✓ Proper accessibility attributes
✓ Responsive but desktop-first matching exact dimensions
✓ Export as default
REMEMBER: This is about REPLICATION, not interpretation. Copy the design EXACTLY as provided.
Generate the complete React component now:`;
    return await makeGroqRequest(REACT_SYSTEM_PROMPT, userPrompt);
}

// Generate HTML/CSS
export async function generateHtmlCssJs(selector, styles, elementInfo = {}, htmlContext = '', assets = [], domStructure = null) {
    console.log('🎨 Generating pixel-perfect HTML...');
    const tagName = elementInfo.tagName || 'div';
    const textPreview = elementInfo.textContent?.substring(0, 100) || 'No text content';
    const assetsFormatted = formatAssets(assets);
    const domFormatted = domStructure ? formatDOMStructure(domStructure) : htmlContext.substring(0, 5000);
    const cssString = stylesToCSS(styles);
    const userPrompt = `Generate PIXEL-PERFECT HTML/CSS replicating this UI element EXACTLY.
═══════════════════════════════════════════════════════════════
ELEMENT IDENTIFICATION
═══════════════════════════════════════════════════════════════
Selector: ${selector}
Tag: ${tagName}
Text Preview: ${textPreview}
═══════════════════════════════════════════════════════════════
EXACT CSS STYLES (MATCH PRECISELY)
═══════════════════════════════════════════════════════════════
${selector} {
${cssString}
}
═══════════════════════════════════════════════════════════════
COMPLETE HTML STRUCTURE
═══════════════════════════════════════════════════════════════
${domFormatted}
═══════════════════════════════════════════════════════════════
ASSETS (USE EXACT URLs)
═══════════════════════════════════════════════════════════════
${assetsFormatted}
═══════════════════════════════════════════════════════════════
REQUIREMENTS
═══════════════════════════════════════════════════════════════
✓ Replicate complete HTML structure
✓ Match all CSS properties exactly
✓ Use provided asset URLs
✓ Include all text content
✓ Add proper semantic HTML5
✓ Include accessibility attributes
✓ Make responsive (mobile-first)
Generate the complete HTML now:`;
    return await makeGroqRequest(HTML_SYSTEM_PROMPT, userPrompt);
}

// Generate Full Page
export async function generateFullPageReact(editedElements) {
    console.log('🎨 Generating full React application page...');
    if (!editedElements || editedElements.length === 0) {
        throw new Error('No edited elements provided. Please modify some styles first.');
    }
    const elementsDescription = editedElements.map((el, idx) => {
        const stylesCount = Object.keys(el.styles || {}).length;
        const assetsCount = (el.assets || []).length;
        const domPreview = el.domStructure ? formatDOMStructure(el.domStructure).substring(0, 500) : '';
        return `
═══════════════════════════════════════════════════════════════
ELEMENT ${idx + 1}: ${el.selector}
═══════════════════════════════════════════════════════════════
Tag: ${el.tagName || 'unknown'}
Styles: ${stylesCount} properties
Assets: ${assetsCount} items
EXACT STYLES:
${JSON.stringify(el.styles || {}, null, 2)}
DOM STRUCTURE:
${domPreview}
ASSETS:
${formatAssets(el.assets || [])}
`;
    }).join('\n');
    const userPrompt = `Generate a COMPLETE, production-ready React application page combining these elements with PIXEL-PERFECT accuracy.
${elementsDescription}
═══════════════════════════════════════════════════════════════
PAGE REQUIREMENTS
═══════════════════════════════════════════════════════════════
1. **Component Structure**: Create a main App component combining all elements
2. **Layout**: Organize elements logically (header, main, footer, sections)
3. **Exact Replication**: Match ALL styles, dimensions, and assets precisely
4. **Tailwind CSS**: Use arbitrary values for exact matches
5. **Responsive**: Mobile-first but preserve exact desktop dimensions
6. **Assets**: Use all provided URLs exactly as given
7. **Interactivity**: Add appropriate state and event handlers where logical
8. **Accessibility**: ARIA labels, semantic HTML, keyboard navigation
9. **Professional Design**: Cohesive, modern, production-quality UI
═══════════════════════════════════════════════════════════════
CRITICAL REMINDERS
═══════════════════════════════════════════════════════════════
- NO placeholders - use actual assets from the provided URLs
- NO approximations - match dimensions and colors exactly
- NO simplifications - include complete DOM structures
- Export as default component
Generate the complete React application now:`;
    return await makeGroqRequest(REACT_SYSTEM_PROMPT, userPrompt);
}

export async function generateFullPageHtml(editedElements) {
    console.log('🎨 Generating full HTML page...');
    if (!editedElements || editedElements.length === 0) {
        throw new Error('No edited elements provided. Please modify some styles first.');
    }
    const cssRules = editedElements.map((el, idx) => {
        const css = stylesToCSS(el.styles || {});
        return `/* Element ${idx + 1}: ${el.selector} */
${el.selector} {
${css}
}`;
    }).join('\n\n');
    const elementsHTML = editedElements.map((el, idx) => {
        const dom = el.domStructure ? formatDOMStructure(el.domStructure) : '';
        return `<!-- Element ${idx + 1}: ${el.selector} -->
${dom}`;
    }).join('\n\n');
    const userPrompt = `Generate a COMPLETE, production-ready HTML webpage with PIXEL-PERFECT accuracy.
═══════════════════════════════════════════════════════════════
CSS STYLES (APPLY EXACTLY)
═══════════════════════════════════════════════════════════════
${cssRules}
═══════════════════════════════════════════════════════════════
HTML STRUCTURE REFERENCE
═══════════════════════════════════════════════════════════════
${elementsHTML.substring(0, 5000)}
═══════════════════════════════════════════════════════════════
PAGE REQUIREMENTS
═══════════════════════════════════════════════════════════════
1. Complete HTML5 document with <!DOCTYPE html>
2. All CSS in <style> tag in <head>
3. JavaScript in <script> tag if needed for interactivity
4. Fully responsive with media queries
5. Semantic HTML5 elements
6. Professional, modern design
7. Cross-browser compatible
Generate the complete HTML page now:`;
    return await makeGroqRequest(HTML_SYSTEM_PROMPT, userPrompt);
}

export async function getStyleSuggestions(styles) {
    console.log('💡 Getting style suggestions...');
    const systemPrompt = `You are a CSS expert. Analyze styles and provide actionable improvement suggestions.
Return ONLY a JSON array of 3-5 suggestion strings.`;
    const userPrompt = `Analyze these CSS styles and provide 3-5 specific improvement suggestions:
${JSON.stringify(styles, null, 2)}
Focus on: accessibility, responsiveness, modern CSS practices, performance, and UX.
Return ONLY a JSON array of suggestion strings.`;
    try {
        const result = await makeGroqRequest(systemPrompt, userPrompt);
        const cleaned = result.replace(/```json/g, '').replace(/```/g, '').trim();
        const suggestions = JSON.parse(cleaned);
        if (Array.isArray(suggestions) && suggestions.length > 0) {
            return suggestions;
        }
        throw new Error('Invalid suggestions format');
    } catch (error) {
        console.error('Failed to get suggestions:', error);
        return [
            'Use relative units (rem/em) instead of px for better scalability',
            'Ensure color contrast meets WCAG AA standards (4.5:1 for text)',
            'Add smooth transitions for interactive elements',
            'Include focus-visible styles for keyboard navigation',
            'Use CSS custom properties for consistent theming'
        ];
    }
}

export async function testApiConnection() {
    try {
        const apiKey = await getApiKey();
        const response = await fetch(`${API_BASE_URL}/models`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        return response.ok;
    } catch (error) {
        console.error('API connection test failed:', error);
        return false;
    }
}

export async function getApiUsage() {
    try {
        await getApiKey();
        return {
            available: true,
            message: 'API key is configured and ready'
        };
    } catch (error) {
        return {
            available: false,
            message: error.message
        };
    }
}

export default {
    generateReactTailwind,
    generateHtmlCssJs,
    generateFullPageReact,
    generateFullPageHtml,
    getStyleSuggestions,
    testApiConnection,
    getApiUsage
};