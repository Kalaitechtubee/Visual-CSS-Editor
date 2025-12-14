// prompt-templates.js
// AI Prompt Templates for Code Generation
export const SECTION_GENERATION_PROMPT = (elementType, styles, context = {}) => `
YOU ARE A PIXEL-PERFECT CODE GENERATOR. Your goal is to replicate the EXACT design of the provided element.
CRITICAL: You must use the EXACT values from "Current Styles" for colors, metrics, and typography. Do NOT use generic "best text" or "modern interpretations" if they differ from the specific values provided.
Element Type: ${elementType}
Current Styles: ${JSON.stringify(styles, null, 2)}
${context.layout ? `Layout Type: ${context.layout}` : ''}
${context.framework ? `Framework: ${context.framework}` : ''}
Strict Design Rules:
1.  **Exact Colors**: Use the precise HEX or RGBA values from Current Styles (e.g., if style says "background-color: #1a1d23", use "#1a1d23", not "gray-900").
2.  **Exact Dimensions**: Use the specific pixel values for width, height, padding, and margin found in Current Styles.
3.  **Exact Typography**: Match font-size, font-weight, and line-height exactly.
4.  **No Hallucinations**: Do not add shadow or border unless explicitly present in Current Styles.
Requirements:
1.  Semantic HTML5
2.  Modern CSS (flexbox/grid)
3.  Accessibility (ARIA labels)
4.  Clean, maintainable code
${context.useTailwind ? '5. Use Tailwind CSS arbitrary values (e.g., `bg-[#1a1d23]`) if standard utility classes do not match exact values.' : ''}
Provide:
- Complete HTML structure
- Full CSS/Tailwind classes
- JavaScript for immediate interactivity (if applicable)
`;

export const FULL_PAGE_PROMPT = (editedElements) => `
Generate a PIXEL-PERFECT replica webpage based on these specifications.
Your task is to rebuild the page exactly as described in "Edited Elements".
Edited Elements:
${JSON.stringify(editedElements, null, 2)}
Strict Design Rules:
- **Colors**: Use EXACT color codes from the data. Do not approximation.
- **Spacing**: Use EXACT pixel values for spacing.
- **Typography**: Respect specific font sizes and weights.
Technical Requirements:
- HTML5 semantic markup
- CSS Grid/Flexbox
- Vanilla JavaScript for interactions
- Responsive adaptation (scale down preserving ratio)
Provide a single HTML file with:
1. Complete <!DOCTYPE html> structure
2. All CSS in <style> tag
3. All JavaScript in <script> tag
4. Responsive meta tags
`;

export const FRAMEWORK_CONVERSION_PROMPT = (html, css, framework) => `
Convert this HTML/CSS code to ${framework}:
HTML:
${html}
CSS:
${css}
Requirements:
1. Component-based architecture
2. Use ${framework} best practices
3. ${framework === 'React' ? 'Tailwind CSS for styling' : 'Scoped styles'}
4. ${framework === 'React' || framework === 'Vue' ? 'TypeScript types (if applicable)' : ''}
5. Proper state management
6. Reusable components
7. Props with validation
8. Responsive utilities
Provide:
- Component file structure
- All necessary imports
- Full implementation
- Usage example
`;

export const STYLE_SUGGESTIONS_PROMPT = (styles) => `
Analyze these CSS styles and suggest improvements:
Current Styles:
${JSON.stringify(styles, null, 2)}
Provide suggestions for:
1. Accessibility improvements (contrast, focus states)
2. Modern design trends (gradients, shadows, animations)
3. Performance optimizations
4. Responsive design improvements
5. CSS best practices
Format as a list of actionable suggestions with:
- Issue description
- Recommended fix
- Before/after CSS examples
`;

export const DESIGN_SYSTEM_PROMPT = (editedElements) => `
Analyze these styled elements and generate a design system:
Edited Elements:
${JSON.stringify(editedElements, null, 2)}
Generate:
1. CSS Custom Properties (tokens) for:
   - Colors (primary, secondary, neutral scale)
   - Typography (font families, sizes, weights)
   - Spacing scale
   - Border radius values
   - Shadow definitions
2. Reusable utility classes
3. Component style patterns
Format as:
- CSS custom properties block
- Utility classes
- Documentation comments
`;

export default {
    SECTION_GENERATION_PROMPT,
    FULL_PAGE_PROMPT,
    FRAMEWORK_CONVERSION_PROMPT,
    STYLE_SUGGESTIONS_PROMPT,
    DESIGN_SYSTEM_PROMPT
};