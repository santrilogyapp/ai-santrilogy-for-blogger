# 📋 Master Backlog: Santrilogy AI (v2.0 Refactor)

## 1. Infrastructure & Core Stability

### Implement CDN Semantic Versioning
- **Context:** Currently, the template links to the @--- branch. A bad commit could break the live site immediately.
- **Task:** Create a GitHub Release tag v1.0.0. Update the Blogger XML template to reference jsdelivr.../repo @v1.0.0 instead of @---.

### Fix JavaScript Module Compatibility
- **Context:** Potential Uncaught SyntaxError: Cannot use import statement on older browsers or specific environments.
- **Task:** Refactor main.js and firebase.js to use global namespaces (e.g., firebase.auth()) instead of ES6 imports, OR strictly enforce `<script type="module">` in the Blogger template.

## 2. UI/UX & Responsive Design

### Global Responsive Overhaul
- **Task:** Fix layout, padding, and element sizing across all viewports (Desktop, Tablet, iOS Mobile, Android Mobile). Ensure no horizontal scrolling occurs unintentionally.

### Fix Header & Chat Output Overlap
- **Task:** Resolve z-index and padding-top issues. New chat messages must appear clearly below the fixed header (scrolling upwards) without being hidden behind it.

### Modernize Input Area Layout
- **Task:** Redesign the input bar (text area + buttons). It must be clean, modern, and fully responsive (prevent button stacking/overflow on small screens).

### Fix Iconography & Avatar Scaling
- **Task:** Resize user/AI avatars and action icons. They are currently too large on mobile devices. Ensure they scale proportionally using rem or clamp() units.

## 3. User Onboarding Flow

### Implement "Welcome Mode" State
- **Task:**
  - On the initial load, hide the Input Area and Quick Prompts grid.
  - Show only the Welcome Description and a "Start Discussion" (Mulai) button.
  - Interaction: When "Start" is clicked → Trigger AI greeting → AI asks: "Siapa nama panggilanmu?" (What is your nickname?) → User replies → Unlock full interface.

## 4. Features: Chat & Interaction

### Chat History Sorting
- **Task:** Sort the sidebar chat history list by last_updated timestamp (Descending). The most recent conversation must always be at the top.

### Enhanced Message Actions
- **Task:** Add a toolbar to every AI response bubble containing:
  - Copy (Salin)
  - Regenerate (Refresh)
  - Like (👍) & Dislike (👎)
  - Report (⚠️) → Logic: Save report reason/timestamp to Firebase.

### Sidebar Restructuring
- **Task:** Move "Quick Prompts" to the top of the sidebar (above Recent History). Add a "Show All" toggle to expand/collapse the list.

## 5. Features: Media & Input

### Camera Integration
- **Task:** Add a "Take Photo" button in the input area that triggers the device's native camera (Media Capture API), in addition to the existing file upload.

### Voice Note Integration
- **Task:** Implement a "Microphone" button. Record audio (Web Audio API), convert to blob, and send/transcribe (depending on backend capability).

## 6. Content & Persona Logic

### Update Quick Prompts & Disclaimer Logic
- **Task:** Update prompts to: Bikin RPP, Terjemah Teks Arab, Analisis Data, Diskusi Ilmiah.
- **Mandatory Logic:** Before answering these specific prompts, the AI must inject a disclaimer: "I am an AI, I may make mistakes. Please study with a clear Sanad (lineage of knowledge), think critically, and use correct reasoning. Santrilogy AI is a virtual discussion partner, not a teacher."

## 7. Monetization (Donation System)

### Refine Donation UI & Logic
- **Task:**
  - Fix CSS styling for the Donation Card (make it neat).
  - Fix the broken Midtrans payment link.
  - Trigger Logic: Display the donation card automatically after the 7th, 20th, 50th message, and every subsequent multiple of 50.

## 8. Visual Content & Diagrams

### Replace Mermaid with Enhanced Diagram System
- **Context:** Current Mermaid.js implementation may have responsiveness, aesthetic, and error handling issues.
- **Task:** Replace Mermaid.js with a more aesthetic, responsive, and error-resistant diagram system that includes:
  - Better mobile responsiveness for diagrams
  - More visually appealing styling that matches the template's design system
  - Improved error handling when diagram rendering fails
  - Better fallback mechanisms for unsupported diagram types
  - Optimized rendering performance
  - Support for additional diagram types beyond flowcharts (sequence, gantt, pie charts, etc.)

## 9. Settings

### Functional Settings Menu
- **Task:** Ensure the "Settings" modal is fully functional (e.g., connecting the Theme Toggle, Font Size slider to the actual CSS variables).