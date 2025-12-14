// Google Gemini API Service for Code Generation
// Uses REST API to avoid node-modules dependency issues in browser extension

const API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

// Available models
export const GEMINI_MODELS = [
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
    { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
    { id: 'gemini-2.0-pro-exp-02-05', name: 'Gemini 2.0 Pro Experimental' }
];

/**
 * Get API key from Chrome storage
 */
async function getApiKey() {
    try {
        const result = await chrome.storage.sync.get(['geminiApiKey']);
        if (!result.geminiApiKey || result.geminiApiKey.trim() === '') {
            throw new Error('API key not configured. Please add your Gemini API key in Settings tab.');
        }
        return result.geminiApiKey.trim();
    } catch (error) {
        console.error('Failed to get API key:', error);
        throw new Error('Gemini API key not found. Please configure in Settings tab.');
    }
}

/**
 * Clean generated code
 */
function cleanCode(text) {
    if (!text) return '';
    let cleaned = text.replace(/```[\w]*\n?/g, '');
    cleaned = cleaned.replace(/```\s*$/g, '');
    return cleaned.trim();
}

/**
 * Construct system prompts (reusing logic from groq-service for consistency)
 */
const REACT_SYSTEM_PROMPT = `You are an EXPERT React developer specializing in PIXEL-PERFECT UI replication.
YOUR MISSION: Generate React components that are IDENTICAL to the provided design - down to the exact pixel, color, spacing, and asset.

CRITICAL RULES:
1. **EXACT FIDELITY**: Use precise hex colors, exact pixel dimensions, and specific font values.
2. **COMPLETE STRUCTURE**: Replicate the ENTIRE DOM hierarchy.
3. **ASSET ACCURACY**: Use the EXACT URLs provided.
4. **TAILWIND PRECISION**: Use arbitrary values (e.g., \`bg-[#1a1d23]\`) when standard utilities don't match exactly.
5. **NO HALLUCINATIONS**: Only add properties explicitly in the styles.

BACKGROUND CONTEXT RULE (CRITICAL):
- If \`_context.visuallyTransparent\` is true, you MUST use \`_context.effectiveBackgroundColor\` as the visual background.
- Do NOT invent colors.
- If contrastWarning is present, preserve colors but ensure visibility using the effective background.
- DO NOT attempt to improve contrast by changing colors.
- Only resolve visual transparency using provided context.

CONTRAST RULE:
- If \`_context.contrastRatio\` < 4.5, do NOT change colors. Only apply the resolved background context from \`_context\`.

OUTPUT FORMAT:
Return ONLY the complete React component code. No explanations.`;

const HTML_SYSTEM_PROMPT = `You are an EXPERT frontend developer specializing in PIXEL-PERFECT UI replication.
YOUR MISSION: Generate HTML/CSS that is IDENTICAL to the provided design.

CRITICAL RULES:
1. **EXACT FIDELITY**: Use precise hex colors, exact pixel dimensions.
2. **COMPLETE STRUCTURE**: Replicate the ENTIRE DOM hierarchy.
3. **ASSET ACCURACY**: Use the EXACT URLs provided.
4. **CSS PRECISION**: Match all computed styles exactly.

BACKGROUND CONTEXT RULE (CRITICAL):
- If \`_context.visuallyTransparent\` is true, you MUST use \`_context.effectiveBackgroundColor\` as the visual background.
- Do NOT invent colors.
- If contrastWarning is present, preserve colors but ensure visibility using the effective background.
- DO NOT attempt to improve contrast by changing colors.
- Only resolve visual transparency using provided context.

CONTRAST RULE:
- If \`_context.contrastRatio\` < 4.5, do NOT change colors. Only apply the resolved background context from \`_context\`.

OUTPUT FORMAT:
Return ONLY the complete HTML document. No explanations.`;

/**
 * Make API request to Gemini
 */
async function makeGeminiRequest(systemPrompt, userPrompt, modelId = 'gemini-1.5-flash') {
    console.log(`🤖 Making Gemini API request (${modelId})...`);

    const apiKey = await getApiKey();
    const url = `${API_BASE_URL}/${modelId}:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [
                    {
                        role: 'user',
                        parts: [
                            { text: systemPrompt + "\n\n" + userPrompt } // Gemini doesn't have a separate 'system' role in v1beta/generateContent usually, usually passed as first user message or systemInstruction if supported
                        ]
                    }
                ],
                // generationConfig: {
                //     temperature: 0.2,
                //     maxOutputTokens: 8000
                // } 
                // Using systemInstruction property is preferred for newer models if supported, but prepending is safer for broad compatibility
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Gemini API Error:', response.status, errorText);

            let errorMessage = `Gemini API Error ${response.status}`;
            try {
                const errorJson = JSON.parse(errorText);
                if (errorJson.error && errorJson.error.message) {
                    errorMessage = errorJson.error.message;
                }
            } catch (e) { }

            throw new Error(errorMessage);
        }

        const data = await response.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!content) {
            throw new Error('Empty response from Gemini API');
        }

        return cleanCode(content);

    } catch (error) {
        console.error('❌ Gemini Request Failed:', error);
        throw error;
    }
}

// Reuse formatting functions from groq-service (duplicated here to avoid circular deps or complex imports for now)
function stylesToCSS(styles) {
    if (!styles || typeof styles !== 'object') return '';
    return Object.entries(styles)
        .filter(([_, value]) => value !== undefined && value !== null && value !== '')
        .map(([key, value]) => `  ${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value};`)
        .join('\n');
}

function formatDOMStructure(domStructure, indent = 0) {
    if (!domStructure) return '';
    // Simplified version for context
    const indentStr = '  '.repeat(indent);
    let result = `${indentStr}<${domStructure.tagName}`;
    if (domStructure.attributes) {
        for (const [key, value] of Object.entries(domStructure.attributes)) {
            if (['class', 'id', 'src', 'href'].includes(key)) result += ` ${key}="${value}"`;
        }
    }
    result += '>\n';
    if (domStructure.textContent) result += `${indentStr}  ${domStructure.textContent}\n`;
    if (domStructure.children?.length) {
        domStructure.children.forEach(c => result += formatDOMStructure(c, indent + 1));
    }
    result += `${indentStr}</${domStructure.tagName}>\n`;
    return result;
}

function formatAssets(assets) {
    if (!assets || !assets.length) return 'No assets found.';
    return assets.map((a, i) => `${i + 1}. [${a.type}] ${a.url}`).join('\n');
}


export async function generateReactGemini(selector, styles, elementInfo = {}, htmlContext = '', assets = [], domStructure = null, model = 'gemini-1.5-flash') {
    const tagName = elementInfo.tagName || 'div';
    const domFormatted = domStructure ? formatDOMStructure(domStructure) : htmlContext.substring(0, 5000);
    const assetsFormatted = formatAssets(assets);

    // Filter generic styles
    const definedStyles = Object.entries(styles)
        .filter(([_, v]) => v !== undefined && v !== null)
        .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});

    const userPrompt = `
Generate a PIXEL-PERFECT React component for:
Selector: ${selector}
Tag: ${tagName}

STYLES:
${JSON.stringify(definedStyles, null, 2)}

DOM STRUCTURE:
${domFormatted}

ASSETS:
${assetsFormatted}

REQUIREMENTS:
1. Exact matches for all styles using Tailwind.
2. Replicate full DOM structure.
3. Use exact asset URLs.
`;

    return await makeGeminiRequest(REACT_SYSTEM_PROMPT, userPrompt, model);
}

export async function generateHtmlGemini(selector, styles, elementInfo = {}, htmlContext = '', assets = [], domStructure = null, model = 'gemini-1.5-flash') {
    const tagName = elementInfo.tagName || 'div';
    const domFormatted = domStructure ? formatDOMStructure(domStructure) : htmlContext.substring(0, 5000);
    const assetsFormatted = formatAssets(assets);
    const cssString = stylesToCSS(styles);

    const userPrompt = `
Generate a PIXEL-PERFECT HTML/CSS for:
Selector: ${selector}
Tag: ${tagName}

CSS:
${selector} {
${cssString}
}

DOM STRUCTURE:
${domFormatted}

ASSETS:
${assetsFormatted}

REQUIREMENTS:
1. Exact matches for all styles.
2. Replicate full DOM structure.
3. Use exact asset URLs.
`;

    return await makeGeminiRequest(HTML_SYSTEM_PROMPT, userPrompt, model);
}

export default {
    generateReactGemini,
    generateHtmlGemini,
    GEMINI_MODELS
};
