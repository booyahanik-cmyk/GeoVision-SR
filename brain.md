# GeoVision-SR — Project Brain

## 1. PROJECT IDENTITY

GeoVision-SR is an AI-powered Super Resolution and Geospatial Intelligence Platform.

Purpose:

Transform low-resolution satellite imagery into actionable geospatial intelligence for better decision making.

Core concept:

Satellite Image
→ AI Enhancement (Super Resolution)
→ Buildings, Roads, Land Cover
→ GIS Dashboard (Maps & Insights)
→ Better Decision

This core flow must remain unchanged.

---

## 2. PROJECT SCOPE

GeoVision-SR focuses on:

- Satellite imagery
- Sentinel-2 data
- Image preprocessing
- Super-resolution enhancement
- Building/object detection
- Land-cover segmentation
- GIS visualization
- Parcel intelligence
- Confidence / uncertainty
- Decision support

Do NOT introduce unrelated features.

Do NOT expand the product into a generic AI platform, social platform, business dashboard, or unrelated SaaS product.

---

## 3. TECHNOLOGY STACK

### Satellite Data
- Sentinel-2

### AI / ML
- SwinIR — Super Resolution
- YOLOv11 — Object Detection
- U-Net — Land Cover Segmentation
- OpenCV — Image Processing

### Frontend
- React.js
- Tailwind CSS
- Leaflet.js
- CesiumJS
- Chart.js

### Backend
- Python
- FastAPI

### Database
- PostgreSQL
- PostGIS

Do not replace these technologies unnecessarily.

---

## 4. CURRENT APPLICATION STRUCTURE

The existing application contains:

- Landing Page
- CesiumJS 3D Globe
- GIS Dashboard
- AI Analysis
- Parcel Intelligence
- Decision Support

Existing functionality and architecture must be preserved unless a task explicitly requires changing them.

This is an existing project.

DO NOT rebuild it from scratch.

DO NOT replace working components with a completely different architecture.

---

## 5. CURRENT GEOSPATIAL EXPERIENCE

### CesiumJS

CesiumJS is used for the 3D Earth/globe experience.

The globe is an important part of the Landing Page and should remain integrated into the product experience.

Do not remove or replace it unnecessarily.

### Leaflet

Leaflet is the primary mapping technology for the GIS Dashboard and other 2D geospatial views.

Do not replace Leaflet unnecessarily.

### GIS Principle

Maps should feel like professional geospatial tools.

Avoid making the map experience look like:

- A gaming interface
- A cyberpunk interface
- A generic dashboard
- A decorative 3D demo

The geospatial data and visualization should remain the focus.

---

## 6. DATA PROCESSING CONCEPT

The project's preprocessing flow includes:

1. Cloud Removal
   - Atmospheric and cloud filtering

2. Noise Reduction
   - Sensor artifact attenuation

3. Image Clipping
   - AOI boundary crop

4. Band Selection
   - Relevant Sentinel-2 visible and NIR channels

5. Resampling
   - Harmonized grid / tiling

6. Image Normalization
   - Radiometric standard scale

The broader technical approach includes:

- Cloud masking
- Image clipping
- Normalization
- Band selection
- Resampling / tiling

Do not invent additional scientific processing steps and present them as part of the project's existing implementation.

---

## 7. AI PIPELINE

The intended AI pipeline is:

Sentinel-2 Satellite Image
→ Preprocessing
→ SwinIR Super Resolution
→ YOLOv11 Object Detection
→ U-Net Land Cover Segmentation
→ Confidence / Uncertainty
→ GIS Visualization
→ Decision Support

Keep this pipeline consistent throughout the application.

Do not silently change model names or their roles.

---

## 8. TRUTHFULNESS AND DATA INTEGRITY

This is extremely important.

NEVER fabricate:

- Accuracy percentages
- Model performance
- Scientific validation
- Processing times
- Satellite observations
- AI confidence values
- Dataset statistics
- Certifications
- Real-world measurements
- Benchmark results
- Official approvals
- Scientific claims

If information is simulated or demonstrative, clearly represent it as:

- Demo
- Simulated
- Example
- Prototype
- Pending
- Not available

Do not make simulated information appear to be real scientific output.

When actual backend/model integration is not present, do not claim that the AI pipeline is genuinely running.

---

## 9. EXISTING DEMO DATA

The current frontend contains demonstration/mock data in places.

Do not silently present demo data as real satellite or AI results.

When modifying UI around demo data:

- Preserve functionality
- Make the demo nature clear when necessary
- Avoid adding fake scientific credibility

Do not invent new numbers just to make the interface look more impressive.

---

## 10. DESIGN DIRECTION

GeoVision-SR should feel:

- Professional
- Scientific
- Geospatial
- Modern
- Premium
- Clean
- Trustworthy

The visual language should be inspired by professional Earth-observation and geospatial platforms.

Reference quality can include products such as:

- Copernicus Data Space
- NASA Earthdata
- Cesium

Use them only as quality/reference inspiration.

DO NOT copy their layouts, branding, or visual identity.

---

## 11. COLOR DIRECTION

Preferred visual palette:

- Deep navy
- Dark blue
- Blue-black
- Restrained cyan / teal
- White
- Light gray

Use:

- Green for successful/positive states
- Amber for warnings
- Red for important errors or critical states

Avoid excessive color.

---

## 12. AVOID AI-SLOP DESIGN

Do NOT use:

- Purple/blue gradient hero sections
- Generic AI SaaS layouts
- Excessive glassmorphism
- Excessive neon
- Cyberpunk styling
- Gaming aesthetics
- Huge glowing text
- Random decorative gradients
- Excessive floating cards
- Icon-tile feature grids everywhere
- Repetitive card layouts
- Fake futuristic terminology
- Decorative UI that has no functional purpose

Avoid making the interface look like a template-generated AI website.

---

## 13. VISUAL HIERARCHY

Every screen should have a clear hierarchy.

Users should immediately understand:

1. Where they are
2. What they are looking at
3. What the important information is
4. What action they can take

Do not fill empty space with unnecessary content.

Whitespace is acceptable.

Do not add UI simply because an area looks empty.

---

## 14. LANDING PAGE

The Landing Page should remain focused and minimal.

The current direction is:

- Clear GeoVision-SR identity
- Short product explanation
- Primary call to action
- Large integrated Cesium Earth experience
- Minimal supporting UI

Do NOT reintroduce unnecessary:

- Technical telemetry
- Large metric sections
- Process tables
- Target registries
- Excessive statistics
- Fake performance claims
- Long technical descriptions
- Decorative status panels

The Cesium globe should remain visually important.

---

## 15. GIS DASHBOARD

The GIS Dashboard should prioritize:

- Map
- AOI
- Satellite information
- Preprocessing controls
- Geospatial layers
- AI analysis controls
- Analysis results

The map should remain the main visual focus.

Panels must not crush or unnecessarily cover the map.

On smaller screens, panels should become appropriate drawers, overlays, or stacked sections.

---

## 16. AI ANALYSIS

The AI Analysis screen should clearly communicate the processing pipeline:

- Satellite Image
- Preprocessing
- SwinIR
- YOLOv11
- U-Net
- Confidence / Uncertainty

The before/after super-resolution comparison should remain usable and reliable.

Do not introduce unsupported AI capabilities.

---

## 17. PARCEL INTELLIGENCE

Parcel Intelligence should remain focused on geospatial information such as:

- Parcel boundaries
- Land use
- Detected features
- Change information
- Confidence

Do not unnecessarily expand it into unrelated:

- Legal systems
- Enforcement systems
- Owner databases
- Government workflows
- Statutory systems
- Legal claims

unless such functionality is explicitly implemented and supported.

---

## 18. DECISION SUPPORT

Decision Support should help users interpret the geospatial analysis.

Relevant information may include:

- Land-cover distribution
- Building information
- Detected features
- Change information
- Confidence
- Relevant charts and summaries

Charts should be understandable and connected to the currently selected AOI/data.

Do not show contradictory numbers.

For example, if one screen shows the active AOI contains a certain number of buildings, another chart must not randomly show a different number unless there is a clear explanation.

---

## 19. AOI CONSISTENCY

AOI selection should remain consistent across the application.

If the user changes the AOI:

- Relevant map data should update
- Analysis data should correspond to that AOI
- Parcel data should correspond to that AOI
- Decision Support data should correspond to that AOI

Never display data from one AOI while the interface indicates another AOI is active.

---

## 20. UPLOADED AOI

If the user uploads a custom AOI/image, preserve the relevant uploaded state when moving between related views where technically appropriate.

Do not allow the interface to silently revert to unrelated default AOI data.

If persistence is not currently implemented, do not pretend that it is.

---

## 21. RESPONSIVE DESIGN

The application must work on:

- Desktop
- Laptop
- Tablet
- Mobile

Check for:

- Horizontal overflow
- Crushed panels
- Overlapping content
- Broken navigation
- Unreadable text
- Buttons outside containers
- Broken maps
- Broken charts

For smaller screens:

- Use drawers
- Stack sections
- Collapse controls
- Preserve the main content

Do not simply shrink desktop layouts until they become unusable.

---

## 22. NAVIGATION

Navigation should be:

- Clear
- Predictable
- Consistent

Users should always know which section they are viewing.

Avoid unnecessary navigation items.

On mobile, use an appropriate menu/drawer rather than allowing navigation items to overflow horizontally.

---

## 23. ACCESSIBILITY

Use:

- Semantic HTML
- Proper button labels
- Keyboard-accessible controls
- Visible focus states
- Good contrast
- Meaningful aria-labels where required
- Accessible interactive controls

Icons alone should not be relied upon when their meaning is unclear.

Interactive controls should have understandable labels/tooltips where appropriate.

---

## 24. ANIMATION

Animation should be subtle and purposeful.

Good uses:

- Panel transitions
- Map transitions
- Chart entrance animations
- Before/after slider movement
- Loading/progress feedback
- Button hover states
- Small state transitions

Animation should generally be:

- Fast
- Smooth
- Controlled
- Professional

Avoid:

- Constant looping animation
- Excessive bouncing
- Large decorative movement
- Distracting effects
- Animation everywhere

Do not use animation simply to make the application look "AI".

---

## 25. GLASS / TRANSPARENCY

Small amounts of transparency can be used when useful.

Good candidates:

- Small map controls
- AOI selectors
- Compact floating controls
- Primary CTA when appropriate

Avoid applying glassmorphism to the entire interface.

Do not use:

- Heavy blur everywhere
- Transparent cards everywhere
- Excessive borders
- Bright glowing glass
- Layer upon layer of translucent panels

The underlying map/globe should remain visually clear.

---

## 26. TYPOGRAPHY

Typography should prioritize:

- Readability
- Hierarchy
- Consistency

Use different weights and sizes to create hierarchy.

Avoid excessive uppercase text.

Avoid tiny unreadable labels.

Avoid using monospace typography for large amounts of normal UI text.

Monospace may be used selectively for technical/data-oriented information.

---

## 27. SPACING

Use consistent spacing throughout the application.

Prefer a structured spacing system rather than arbitrary margins and padding.

Avoid:

- Crowded panels
- Excessive padding
- Random gaps
- Elements touching container edges
- Inconsistent card spacing

---

## 28. COMPONENT REUSE

Before creating a new component:

1. Search the existing codebase.
2. Check whether an equivalent component already exists.
3. Reuse or extend it when appropriate.

Avoid duplicate components performing the same role.

Do not create unnecessary abstraction solely for the sake of abstraction.

---

## 29. CODE MODIFICATION RULES

Before modifying code:

1. Inspect the relevant files.
2. Understand their relationships.
3. Understand existing data flow.
4. Understand current state management.
5. Check dependencies.
6. Identify potential side effects.

Then make the smallest sensible change.

Do not blindly rewrite files.

Do not delete working functionality without a clear reason.

---

## 30. PRESERVE EXISTING ARCHITECTURE

Do not unnecessarily change:

- React structure
- Routing
- Component architecture
- Cesium implementation
- Leaflet implementation
- Chart.js implementation
- Existing data structures
- Existing dependencies

Only change architecture when there is a strong technical reason.

---

## 31. STATE AND INTERACTION QUALITY

Interactive features should behave reliably.

Pay particular attention to:

- Sliders
- Maps
- Layer toggles
- AOI selection
- Upload flows
- Analysis progress
- Navigation
- Charts
- Drawers
- Modals

Avoid state that resets unexpectedly.

Clean up timers, intervals, and event listeners when components unmount.

Prevent duplicate map initialization.

---

## 32. ERROR HANDLING

Errors should be understandable.

Do not expose confusing technical errors to normal users when a simple message is possible.

Examples:

Good:
"Unable to load the selected imagery."

Avoid:
"Unhandled TypeError: Cannot read properties of undefined..."

Developer errors may remain in the console when appropriate, but the user-facing interface should remain understandable.

---

## 33. PERFORMANCE

Avoid unnecessary:

- Re-renders
- Heavy effects
- Duplicate map initialization
- Unnecessary animations
- Large DOM structures
- Repeated data processing

Do not sacrifice functionality merely for micro-optimizations.

---

## 34. SECURITY / ENVIRONMENT

Do not expose secrets or API keys in frontend code.

Respect `.env` configuration.

Never hard-code private credentials.

Do not commit sensitive credentials into the repository.

---

## 35. DEPENDENCIES

Before adding a dependency:

- Check whether the existing project already provides the required functionality.
- Prefer existing libraries.
- Avoid unnecessary packages.

Do not replace package managers or dependency systems without a clear reason.

---

## 36. PRODUCT SCOPE LOCK

Every proposed change must fit the GeoVision-SR product.

Before adding something, ask:

Does this improve:

- Clarity?
- Usability?
- Trust?
- Geospatial understanding?
- AI analysis understanding?
- Decision support?
- Accessibility?
- Performance?
- Visual polish?

If not, do not add it.

---

## 37. NO UNNECESSARY FEATURES

Do not add features just because they are technically possible.

Examples of features that should NOT be added without explicit instruction:

- Chatbots
- User profiles
- Social features
- Gamification
- Notifications systems
- Generic analytics dashboards
- Cryptocurrency/blockchain
- AI assistants
- Unrelated automation
- Payment systems
- Unrelated administrative tools

Stay focused on GeoVision-SR.

---

## 38. DESIGN QUALITY STANDARD

The final interface should feel comparable in quality to strong modern products such as:

- Stripe
- Linear
- Vercel
- Notion
- Framer
- Professional Earth-observation platforms

This refers to:

- Quality
- Clarity
- Spacing
- Typography
- Interaction
- Consistency
- Polish

Do NOT copy their branding or layouts.

---

## 39. PROFESSIONAL GEOSPATIAL STANDARD

The product should look credible to someone familiar with:

- GIS
- Remote sensing
- Satellite imagery
- Earth observation
- Geospatial analysis

Avoid terminology that sounds impressive but has no technical meaning.

Do not use fake "mission control" language simply for aesthetics.

---

## 40. DEMO / PROTOTYPE HONESTY

When a backend, satellite API, AI model, or database is not actually connected:

Do not claim that it is.

Use appropriate states such as:

- Demo
- Prototype
- Simulated
- Pending integration

A polished interface must still remain truthful.

---

## 41. BEFORE MAKING LARGE CHANGES

For major redesigns or refactors:

1. Inspect the complete codebase.
2. Identify affected files.
3. Understand current functionality.
4. Identify possible regressions.
5. Plan the changes.
6. Implement in controlled steps.
7. Test after implementation.

Do not perform a blind full-project rewrite.

---

## 42. QA CHECKLIST

Before declaring a task complete, verify:

### Functionality
- Application starts successfully
- Build succeeds
- No broken imports
- No broken routes
- No broken interactions
- No unexpected state resets

### UI
- Visual hierarchy is clear
- No unnecessary elements
- Consistent spacing
- Consistent typography
- Consistent controls
- No accidental visual clutter

### Responsive
- Desktop works
- Tablet works
- Mobile works
- No horizontal overflow
- Maps remain usable
- Panels remain usable

### Geospatial
- Cesium globe works
- Leaflet maps work
- AOI selection behaves correctly
- Layers behave correctly
- Data corresponds to the active AOI

### AI
- Pipeline terminology remains correct
- No unsupported claims
- Demo data is not presented as real scientific output

### Accessibility
- Buttons are understandable
- Interactive controls are keyboard-friendly
- Labels/aria-labels exist where needed
- Contrast remains readable

### Code
- No unnecessary duplicate components
- No obvious memory leaks
- Timers/intervals cleaned up
- Event listeners cleaned up
- No unnecessary dependencies

---

## 43. CHANGE DISCIPLINE

When a task says:

"Change X only"

then change X only.

Do not redesign unrelated screens.

Do not modify unrelated components.

Do not add extra features.

Do not change working functionality simply because you prefer another implementation.

---

## 44. PRIORITY ORDER

When making decisions, prioritize in this order:

1. Correctness
2. Truthfulness
3. Usability
4. Accessibility
5. Geospatial clarity
6. Performance
7. Consistency
8. Visual polish
9. Decorative effects

Visual effects must never override correctness or usability.

---

## 45. FINAL GOLDEN RULE

GeoVision-SR should always prioritize:

CLARITY
→ TRUST
→ USABILITY
→ GEOSPATIAL QUALITY
→ VISUAL POLISH

Every change should have a reason.

If an element does not improve the product, remove it.

If a claim cannot be supported, do not make it.

If a feature is outside the project scope, do not add it.

If existing functionality works, preserve it.

The goal is not to make GeoVision-SR look more complicated.

The goal is to make it look more professional, credible, clear, and useful.