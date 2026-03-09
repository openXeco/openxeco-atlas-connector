# Urgent TODO
**Frontend**
- [ ] Fix the automatic "Submit" button when everything is ok. Wait for the user
- [ ] Remove "Other sectors," "Other technologies," "Other use cases" (not needed)
- [x] Fix the entity edit to display taxonomies that are associated (currently the route returns all relations)
- [x] Fix the entity view to display associated taxonomies (inside `Classification` card)
- [x] In the Thematic Area (called "knowledge domains" in the edit form) dropdown make the UI different if it's a root taxonomy or it has parent (see the taxonomy-tree-new.tsx)
- [x] Fix the entity edit to display eventual validation errors at the last wizard view together with the error under the field
- [x] Remove "institution" from the taxonomies

**Backend**
- [x] Remove "institution" from the taxonomies

# Tech Debt TODO
**Frontend**
- [x] Refactor layout.tsx (multiple files) to avoid duplication of <Sidebar />, <Header /> etc inclusion
- [ ] Refactor authentication to manage tokens and sessions in the backend (using session cookies). https://nextjs.org/docs/app/guides/authentication
- [ ] Use ApiClientBackend for all backend related calls and server components when needed
- [ ] Fix the incompatible library error (useReactTable) in entity-data-table.tsx
- [x] Use SWR to avoid waterfalls and better manage cached requests (check if it interferes with authorization)

**Backend**
- [ ] ...
