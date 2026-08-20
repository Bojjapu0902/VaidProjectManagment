# Design System

> Part of the AI Agent Development Standards (v1.1). Split from the master document into `/docs/`. This file is the project-level source of truth for colors, typography, spacing, components, accessibility and responsive UI rules.

---

## 38.1 design-system.md

Read before detailed frontend UI development. Source of truth for:

```text
Colors
Typography
Spacing
Grid
Breakpoints
Buttons
Forms
Cards
Tables
Navigation
Modals
Icons
Shadows
Border Radius
Components
States
Animations
Accessibility
Responsive behavior
```

---

# 17. UI/UX Standards

The UI must be:

- Responsive
- Accessible
- Consistent
- Modern
- Mobile-friendly
- Keyboard accessible
- Easy to navigate

Always consider:

```text
Desktop
Tablet
Mobile
```

Use a consistent design system:

```text
Typography
Colors
Spacing
Buttons
Forms
Cards
Tables
Modals
Alerts
Navigation
Icons
```

Do not create random styles for every page.

---


# 18. Responsive Design

Use responsive breakpoints appropriate for the selected CSS framework.

Always test:

```text
Mobile
Tablet
Laptop
Desktop
Large Desktop
```

Avoid fixed widths that break smaller screens.

---


# 19. Accessibility

Follow accessibility best practices.

Use:

- Semantic HTML
- Labels for inputs
- Alt text for meaningful images
- Keyboard navigation
- Visible focus states
- Sufficient contrast
- Accessible buttons
- Accessible forms
- ARIA only when necessary

Do not use an icon alone when its purpose is unclear.

---


# 39. Desktop and Mobile Design

First identify whether the project is:

```text
Desktop Web
Mobile Web
Responsive Web
Mobile Application
Desktop + Mobile
```

For responsive web applications, design for:

```text
Mobile → Tablet → Laptop → Desktop → Large Desktop
```

For mobile applications, follow the selected platform's conventions while maintaining the project's Design System.

Do not create unrelated desktop and mobile visual systems.
