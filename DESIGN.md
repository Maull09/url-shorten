# Pendek design system

## Interaction brief

Assumption: the owner is learning full-stack development; visitors want to shorten and share a URL on desktop or mobile. The initial app is a local learning MVP, without accounts, analytics, or a public link directory.

Primary task: paste a complete HTTP(S) URL, create a short link, then copy or open it. The short link represents a stored destination. Opening it redirects to that destination. Interaction uses a standard labeled form with explicit actions.

Priorities: successful task completion, preserved input after failure, keyboard access, readable results, and responsive reflow. States: empty, submitting, successful result, invalid URL, network/service failure, copy success/failure, and missing short link. Do not fabricate links when the database is unavailable.

## Visual direction

Clean, light, technical, and bold. The characteristic visual is a long URL becoming a short one, paired with large, tightly spaced typography. Use a quiet canvas and one cobalt primary action. Avoid fake usage metrics, stock imagery, decorative gradients, and analytics controls without functionality.

- Canvas: `#f8fafc`.
- Surface: `#ffffff`.
- Ink: `#172554`.
- Secondary text: `#475569`.
- Accent: `#1d4ed8`.
- Border: `#cbd5e1`.
- Control border: `#64748b` for inputs and outlined action buttons.
- Success ink/background: `#166534` / `#f0fdf4`.
- Error ink/background: `#991b1b` / `#fef2f2`.

Type: Manrope for interface/body text, controls, and the wordmark; Lora for hero and error-page display headings; system monospace (`ui-monospace`, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New) for URLs. Store the variable Manrope/Lora font files and OFL licenses locally and load them with `next/font/local`. Body size starts at 16px with 1.5 line height. Display scales from 36–44px on mobile to 72px on desktop, using 1.12 line height and -0.03em tracking for Lora.

Font provenance: variable TrueType files from the official Google Fonts repository, [Manrope](https://github.com/google/fonts/tree/main/ofl/manrope) and [Lora](https://github.com/google/fonts/tree/main/ofl/lora). Original OFL license texts are retained beside each unmodified font in `src/assets/fonts/`.

Layout: max-width 1120px; spacious header; two-column hero with the task form beside its explanation; single-column mobile layout; three sequential steps below. Use an 8px spacing rhythm, 12px panel radii, and 8px control radii. Left-align content.

## Component rules

- Persistent field labels, HTTP(S) helper text, and inline validation.
- Primary button is `Pendekkan link`; pending label is `Membuat link…`.
- Result includes the destination, a selectable short URL, `Salin link`, and `Buka link`.
- Copy feedback uses a polite live region. Errors are announced and preserve entered data.
- Visible 3px focus outline, minimum 44px targets, sufficient text contrast, and no horizontal overflow at 320px.
- Motion only for hover/focus feedback; respect reduced motion.
- Recent links are limited to the current open page and explicitly labeled as such. They are not a public database listing.
- Indonesian and English pages use `/id` and `/en`; `/` redirects to `/id`. A visible ID/EN selector uses native language names, keyboard-operable links, and an explicit current-language state. The locale controls the document language, metadata, interface, and errors. Navigating to another language starts a new page; current form input and page-session link history are not persisted across navigation.
- Short links remain `/s/[code]` in both languages. Redirect error text follows the visitor's browser language, defaulting to Indonesian.

## Guidance provenance

The required UI/UX design-system search could not run because this environment has no working Python installation (`python` and `py -3` both failed). This document uses the skill's general accessibility and form defaults, with project-specific visual choices; it does not claim a verified database match.
