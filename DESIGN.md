# Pendek design system

## Interaction brief

Assumption: the owner is learning full-stack development; visitors want to shorten and share a URL on desktop or mobile. Registered users also want a private place to manage their own links. Anonymous shortening stays available; links made on the public homepage are not attached to an account. Dashboard-created links belong to the verified user. Analytics and public link listings are outside the current scope.

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

## Authentication and dashboard

- Email/password login and registration use a centered form with persistent labels, password-manager autocomplete, a show/hide password control, pending feedback, and localized errors. Registration asks users to confirm their email; do not imply that a session exists before confirmation succeeds.
- Login and registration each expose the counterpart action and a language selector that stays on the same page type. Passwords and access/refresh tokens never appear in notifications, URLs, or logs. The one-time PKCE authorization code is consumed by the email callback route.
- The dashboard is protected, with a clear `My links` heading, account email, logout, real owned-link count, creation form, and a paginated list (20 per page). Keep Manrope/Lora and the existing palette. On mobile, controls wrap and the form precedes the list; desktop uses a 380px form beside the wider list.
- The server-backed list is the dashboard's source of truth. Creation confirms completion and refreshes that list; do not duplicate saved links in a temporary result/history panel that can remain visible after deletion.
- Each row shows its short link, destination, creation date in Asia/Jakarta, copy, and delete. Avoid charts or fabricated visit counts. Empty and service-error states provide the next action.
- Deletion requires an explicit native confirmation explaining that the short URL will stop working. Preserve rows after a failed delete and refresh the list only after success.
- Switching language changes the dashboard route while keeping server-stored owned links. Page-local input still resets on navigation. Logout clears the session and returns to the localized homepage.

## Guidance provenance

The required UI/UX design-system search could not run because this environment has no working Python installation (`python` and `py -3` both failed). This document uses the skill's general accessibility and form defaults, with project-specific visual choices; it does not claim a verified database match.
