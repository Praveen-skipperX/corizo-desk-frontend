# Workspace UI refresh

UI-only follow-up to the engineering upgrade. Existing authentication, MFA, permissions, API calls and business workflows remain in place.

- Split login layout with native SVG abstract ribbon artwork, restrained purple styling and accessible form error descriptions. The same shell supports all existing sign-in/MFA steps.
- Compact grouped navigation, clear selected states, account controls and an 80-pixel desktop rail. Mobile uses a full-width content area and menu drawer with Escape, focus containment and focus restoration.
- Consistent neutral surfaces, subtle borders, solid primary actions, input styles, cards and metric icons. Existing brand identity retained.
- Desktop login reviewed at 1440 × 900; mobile login reviewed at 375 × 812 with no horizontal overflow. Sidebar components reviewed using a disposable, uncommitted local fixture; expansion, collapse and mobile keyboard dismissal verified. No production data was used.
- Production build, existing client tests and lint checked before commit. Existing nonblocking lint warnings remain. Temporary visual fixtures are excluded from the change.
