// Complete AI Service for Code Generation
// File: src/utils/groq-service.js
// Secure implementation with Chrome storage for API key

const API_BASE_URL = 'https://api.groq.com/openai/v1';
const MODEL = 'llama-3.3-70b-versatile';

/**
 * Get API key from Chrome storage
 * @returns {Promise<string>} The API key
 * @throws {Error} If API key is not configured
 */
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

/**
 * Make API request to Groq
 * @param {string} systemPrompt - System instructions for AI
 * @param {string} userPrompt - User query/request
 * @returns {Promise<string>} Generated code
 */
async function makeGroqRequest(systemPrompt, userPrompt) {
    console.log('🤖 Making Groq API request...');
    console.log('📝 Prompt length:', userPrompt.length, 'characters');
    
    // Get API key from storage
    const apiKey = await getApiKey();
    
    try {
        const response = await fetch(`${API_BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: MODEL,
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
        
        // Handle HTTP errors
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API Error:', response.status, errorText);
            
            let errorMessage = `API Error ${response.status}`;
            
            try {
                const errorJson = JSON.parse(errorText);
                if (errorJson.error && errorJson.error.message) {
                    errorMessage = errorJson.error.message;
                }
            } catch (e) {
                // JSON parsing failed, use default error
            }
            
            // User-friendly error messages
            if (response.status === 401) {
                errorMessage = 'Invalid API key. Please check your settings.';
            } else if (response.status === 429) {
                errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
            } else if (response.status === 500) {
                errorMessage = 'Groq API server error. Please try again later.';
            }
            
            throw new Error(errorMessage);
        }
        
        const data = await response.json();
        console.log('✅ API Response received');
        
        // Validate response structure
        if (!data.choices || data.choices.length === 0) {
            throw new Error('No response from API');
        }
        
        const content = data.choices[0]?.message?.content;
        
        if (!content || content.trim() === '') {
            throw new Error('Empty response from API');
        }
        
        console.log('📄 Generated code length:', content.length, 'characters');
        
        // Clean and return code
        return cleanCode(content);
        
    } catch (error) {
        console.error('❌ Groq API Error:', error);
        
        // Log to background script for persistence
        if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
            chrome.runtime.sendMessage({
                type: 'LOG_ERROR',
                error: `Groq API: ${error.message}`
            }).catch(() => {
                // Ignore if background script isn't available
            });
        }
        
        throw error;
    }
}

/**
 * Clean generated code by removing markdown blocks
 * @param {string} text - Raw response text
 * @returns {string} Cleaned code
 */
function cleanCode(text) {
    if (!text) return '';
    
    // Remove markdown code blocks
    let cleaned = text.replace(/```[\w]*\n?/g, '');
    cleaned = cleaned.replace(/```\s*$/g, '');
    
    // Remove extra whitespace
    cleaned = cleaned.trim();
    
    return cleaned;
}

/**
 * Convert styles object to CSS string
 * @param {Object} styles - Styles object
 * @returns {string} CSS string
 */
function stylesToCSS(styles) {
    if (!styles || typeof styles !== 'object') return '';
    
    return Object.entries(styles)
        .filter(([key, value]) => value !== undefined && value !== null && value !== '')
        .map(([key, value]) => {
            // Convert camelCase to kebab-case
            const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
            return `  ${cssKey}: ${value};`;
        })
        .join('\n');
}

/**
 * Extract text content safely
 * @param {string} html - HTML string
 * @returns {string} Text content
 */
function extractTextContent(html) {
    if (!html) return '';
    
    try {
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    } catch (e) {
        return html.replace(/<[^>]*>/g, '').substring(0, 200);
    }
}

// ========================================
// System Prompts
// ========================================

const REACT_SYSTEM_PROMPT = `You are an expert React developer specializing in modern, production-ready components.

CRITICAL RULES:
1. Generate ONLY React code - no explanations, no markdown
2. Use React functional components with hooks
3. Use Tailwind CSS utility classes exclusively
4. NO inline styles, NO CSS-in-JS, NO styled-components
5. Make components fully responsive (mobile-first)
6. Include proper prop types and default values
7. Use semantic HTML elements
8. Ensure accessibility (ARIA labels, keyboard navigation)
9. Export as default at the end
10. Output must be immediately usable

CODE QUALITY:
- Clean, readable, well-structured
- Proper indentation and formatting
- Meaningful variable and function names
- Comments only for complex logic
- Follow React best practices

OUTPUT FORMAT:
Return ONLY the component code. No explanations before or after.`;

const HTML_SYSTEM_PROMPT = `You are an expert frontend developer specializing in vanilla HTML, CSS, and JavaScript.

CRITICAL RULES:
1. Generate ONLY HTML code - no explanations, no markdown
2. Use semantic HTML5 elements
3. CSS must be in <style> tag in <head>
4. JavaScript must be in <script> tag before </body>
5. NO frameworks, NO libraries, NO React
6. Fully responsive design (use media queries)
7. Modern CSS (flexbox, grid, custom properties)
8. Cross-browser compatible
9. Clean, well-structured code
10. Output must be immediately usable in browser

CODE QUALITY:
- Proper HTML5 structure
- CSS organized by sections
- JavaScript is vanilla ES6+
- Meaningful class names
- Comments for major sections

OUTPUT FORMAT:
Return ONLY the complete HTML document. No explanations before or after.`;

// ========================================
// Export Functions
// ========================================

/**
 * Generate React component with Tailwind CSS
 * @param {string} selector - CSS selector
 * @param {Object} styles - Computed styles object
 * @param {Object} elementInfo - Element metadata
 * @param {string} htmlContext - Element HTML content
 * @returns {Promise<string>} Generated React code
 */
export async function generateReactTailwind(selector, styles, elementInfo = {}, htmlContext = '') {
    console.log('🎨 Generating React component...');
    
    // Extract relevant info
    const tagName = elementInfo.tagName || 'div';
    const textContent = extractTextContent(htmlContext).substring(0, 100);
    
    // Build detailed prompt
    const userPrompt = `Generate a React component based on this element:

ELEMENT DETAILS:
- Selector: ${selector}
- Tag: ${tagName}
- Text Preview: ${textContent || 'No text content'}

STYLES (apply with Tailwind classes):
${JSON.stringify(styles, null, 2)}

HTML STRUCTURE:
${htmlContext.substring(0, 3000)}

REQUIREMENTS:
1. Create a functional React component
2. Use Tailwind CSS classes to match the styles above
3. Make it responsive (mobile, tablet, desktop)
4. Include any necessary state management
5. Add realistic placeholder content if needed
6. Ensure proper accessibility
7. Export as default

IMPORTANT:
- Output ONLY the React component code
- No explanations, no markdown blocks
- Code should be copy-paste ready`;

    return await makeGroqRequest(REACT_SYSTEM_PROMPT, userPrompt);
}

/**
 * Generate HTML + CSS + JavaScript
 * @param {string} selector - CSS selector
 * @param {Object} styles - Computed styles object
 * @param {Object} elementInfo - Element metadata
 * @param {string} htmlContext - Element HTML content
 * @returns {Promise<string>} Generated HTML code
 */
export async function generateHtmlCssJs(selector, styles, elementInfo = {}, htmlContext = '') {
    console.log('🎨 Generating HTML code...');
    
    // Extract relevant info
    const tagName = elementInfo.tagName || 'div';
    const textContent = extractTextContent(htmlContext).substring(0, 100);
    
    // Build CSS string
    const cssString = stylesToCSS(styles);
    
    // Build detailed prompt
    const userPrompt = `Generate HTML code based on this element:

ELEMENT DETAILS:
- Selector: ${selector}
- Tag: ${tagName}
- Text Preview: ${textContent || 'No text content'}

STYLES (apply in CSS):
${cssString}

HTML STRUCTURE:
${htmlContext.substring(0, 3000)}

REQUIREMENTS:
1. Create a complete HTML snippet/section
2. Include CSS in <style> tag
3. Add JavaScript in <script> tag if interactivity needed
4. Make it responsive (use media queries)
5. Use semantic HTML5 elements
6. Include realistic content
7. Ensure cross-browser compatibility

IMPORTANT:
- Output ONLY the HTML code
- No explanations, no markdown blocks
- Code should be copy-paste ready`;

    return await makeGroqRequest(HTML_SYSTEM_PROMPT, userPrompt);
}

/**
 * Generate full React application page
 * @param {Array} editedElements - Array of edited elements
 * @returns {Promise<string>} Generated React app code
 */
export async function generateFullPageReact(editedElements) {
    console.log('🎨 Generating full React page...');
    
    if (!editedElements || editedElements.length === 0) {
        throw new Error('No edited elements provided. Please modify some styles first.');
    }
    
    // Build elements description
    const elementsDescription = editedElements.map((el, idx) => {
        const stylesCount = Object.keys(el.styles || {}).length;
        const htmlPreview = (el.html || '').substring(0, 300);
        
        return `=== Element ${idx + 1} ===
Selector: ${el.selector}
Tag: ${el.tagName || 'unknown'}
Styles Applied: ${stylesCount} properties
${JSON.stringify(el.styles || {}, null, 2)}
HTML Preview:
${htmlPreview}
`;
    }).join('\n\n');
    
    const userPrompt = `Generate a complete, production-ready React application page combining these elements:

${elementsDescription}

REQUIREMENTS:
1. Create a full App.jsx component
2. Combine all elements into a cohesive page layout
3. Use Tailwind CSS exclusively
4. Fully responsive (mobile, tablet, desktop)
5. Include proper component structure
6. Add realistic mock data/content
7. Ensure accessibility
8. Professional, modern design
9. No placeholders - build actual UI

LAYOUT SUGGESTIONS:
- Use proper header, main, footer structure
- Organize elements logically
- Add appropriate spacing and hierarchy
- Make it visually appealing

IMPORTANT:
- Output ONLY the React component code
- No explanations, no markdown blocks
- Code should be copy-paste ready
- Must be a complete, working component`;

    return await makeGroqRequest(REACT_SYSTEM_PROMPT, userPrompt);
}

/**
 * Generate full HTML page
 * @param {Array} editedElements - Array of edited elements
 * @returns {Promise<string>} Generated HTML page
 */
export async function generateFullPageHtml(editedElements) {
    console.log('🎨 Generating full HTML page...');
    
    if (!editedElements || editedElements.length === 0) {
        throw new Error('No edited elements provided. Please modify some styles first.');
    }
    
    // Build CSS rules
    const cssRules = editedElements.map((el, idx) => {
        const css = stylesToCSS(el.styles || {});
        return `/* Element ${idx + 1}: ${el.selector} */
${el.selector} {
${css}
}`;
    }).join('\n\n');
    
    const userPrompt = `Generate a complete, production-ready HTML webpage incorporating these styles:

=== CSS STYLES ===
${cssRules}

REQUIREMENTS:
1. Create a full HTML5 document with <!DOCTYPE html>
2. Include all CSS in <style> tag in <head>
3. Add JavaScript in <script> tag if needed
4. Fully responsive with media queries
5. Use semantic HTML5 elements
6. Include realistic content
7. Professional, modern design
8. No placeholders - build actual UI

STRUCTURE REQUIREMENTS:
- Proper <head> with meta tags
- Organized <body> with header, main, footer
- Mobile-first responsive design
- Cross-browser compatible CSS

IMPORTANT:
- Output ONLY the HTML code
- No explanations, no markdown blocks
- Code should be copy-paste ready
- Must be a complete, working webpage`;

    return await makeGroqRequest(HTML_SYSTEM_PROMPT, userPrompt);
}

/**
 * Get AI-powered style suggestions
 * @param {Object} styles - Current styles object
 * @returns {Promise<Array<string>>} Array of suggestions
 */
export async function getStyleSuggestions(styles) {
    console.log('💡 Getting style suggestions...');
    
    const systemPrompt = `You are a CSS expert and design consultant. Analyze CSS styles and provide actionable improvement suggestions.

Return ONLY a JSON array of 3-5 suggestion strings. No explanations outside the array.

Example output format:
["suggestion 1", "suggestion 2", "suggestion 3"]`;
    
    const userPrompt = `Analyze these CSS styles and provide 3-5 specific improvement suggestions:

${JSON.stringify(styles, null, 2)}

Focus on:
1. Accessibility (contrast, focus states, screen readers)
2. Responsiveness (fluid sizing, breakpoints)
3. Modern CSS practices (variables, logical properties)
4. Performance (will-change, containment)
5. User experience (transitions, hover states)

Return ONLY a JSON array of suggestion strings.`;
    
    try {
        const result = await makeGroqRequest(systemPrompt, userPrompt);
        
        // Clean and parse JSON
        const cleaned = result
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim();
        
        const suggestions = JSON.parse(cleaned);
        
        if (Array.isArray(suggestions) && suggestions.length > 0) {
            return suggestions;
        }
        
        throw new Error('Invalid suggestions format');
        
    } catch (error) {
        console.error('Failed to get suggestions:', error);
        
        // Return fallback suggestions
        return [
            'Use relative units (rem/em) instead of px for better scalability and accessibility',
            'Ensure color contrast meets WCAG AA standards (4.5:1 for normal text, 3:1 for large text)',
            'Add smooth transitions (transition: all 0.3s ease) for interactive elements',
            'Consider adding focus-visible styles for better keyboard navigation',
            'Use CSS custom properties (--color-primary) for consistent theming across components'
        ];
    }
}

// ========================================
// Utility Functions
// ========================================

/**
 * Test API connection and key validity
 * @returns {Promise<boolean>} True if API is accessible
 */
export async function testApiConnection() {
    try {
        const apiKey = await getApiKey();
        
        const response = await fetch(`${API_BASE_URL}/models`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
            }
        });
        
        return response.ok;
    } catch (error) {
        console.error('API connection test failed:', error);
        return false;
    }
}

/**
 * Get current API usage stats (if available)
 * @returns {Promise<Object>} Usage statistics
 */
export async function getApiUsage() {
    try {
        const apiKey = await getApiKey();
        
        // Note: Groq doesn't provide usage endpoint in free tier
        // This is a placeholder for future implementation
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

// ========================================
// Default Export
// ========================================

export default {
    generateReactTailwind,
    generateHtmlCssJs,
    generateFullPageReact,
    generateFullPageHtml,
    getStyleSuggestions,
    testApiConnection,
    getApiUsage
};