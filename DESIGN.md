# Campus workspace design

The interface follows the existing neutral shadcn Base UI theme and Inter typography. Shared components own colours, borders, focus treatment, and control variants. CSS custom properties support light and dark themes.

The desktop layout has a persistent sidebar for the three databases and one table workspace. Mobile navigation uses the sidebar's sheet. Tables scroll horizontally inside their container. Search and filter controls wrap into full-width rows on narrow screens.

Each workspace has a database heading and description, a primary Add action, then the record table with search, a field-specific filter, sortable headers, edit/delete controls, and ten-row pagination. Record counts come from API responses. Empty and failed-load states provide a recovery action.

Add and edit forms use Dialog, FieldGroup, Field, Input, and FieldError. Deletes use AlertDialog. Mutations disable repeated submission and retain entered values on errors. Success feedback uses Sonner. Reduced motion is respected.
