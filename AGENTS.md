<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project Docs

Before making product, UX, architecture, schema, or component changes, read the relevant docs in `docs/` and keep them in sync with the implementation:

- `docs/project-design.md`: product scope, routes, UX rules, assets, and formation generation behavior
- `docs/component-conventions.md`: FSD boundaries, component responsibilities, naming, styling, and implementation conventions
- `docs/database-schema.md`: Supabase tables, columns, ownership, and RLS expectations

If implementation and docs disagree, either update the docs as part of the change or explicitly call out the mismatch.
