// AI Prompt Templates for Code Generation

export const SECTION_GENERATION_PROMPT = (elementType, styles, context = {}) => `
Generate production-ready code for a UI section with these specifications:

Element Type: ${elementType}
Current Styles: ${JSON.stringify(styles, null, 2)}
${context.layout ? `Layout Type: ${context.layout}` : ''}
${context.framework ? `Framework: ${context.framework}` : ''}

Requirements:
1. Semantic HTML5
2. Modern CSS (flexbox/grid)
3. Responsive design (mobile-first)
4. Accessibility (ARIA labels, proper contrast)
5. Clean, maintainable code
6. Include JavaScript for interactive elements
${context.useTailwind ? '7. Use Tailwind CSS classes' : ''}

Provide:
- Complete HTML structure
- Full CSS (inline or separate)
- JavaScript for interactions
- Comments explaining key decisions
`;

export const FULL_PAGE_PROMPT = (editedElements) => `
Generate a complete, production-ready webpage based on these specifications:

Edited Elements:
${JSON.stringify(editedElements, null, 2)}

Design Requirements:
- Professional, modern design
- Fully responsive (320px to 1920px+)
- Cross-browser compatible
- Optimized performance
- Accessibility compliant (WCAG 2.1 AA)

Technical Requirements:
- HTML5 semantic markup
- CSS Grid and Flexbox for layout
- Vanilla JavaScript
- Mobile-first approach

Provide a single HTML file with:
1. Complete <!DOCTYPE html> structure
2. All CSS in <style> tag
3. All JavaScript in <script> tag
4. Responsive meta tags
5. Font imports if needed
6. Comments for each major section
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
