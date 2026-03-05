# Implementation Plan

[Overview]
Build a simple in-memory "Handwerker" project management API to track project times, assign warehouse inventory to projects, and surface activity summaries.

The existing Node HTTP server exposes a small JSON API. We'll extend it with a dedicated service module for handwerker workflows that lives alongside the current bot logic, leaving existing behavior intact. The new service will manage projects, time entries, notes, and warehouse stock assignments with clear, in-memory data structures. The API will provide endpoints to create and list projects, track time per project, allocate inventory items from a warehouse pool, and retrieve summaries/activity feeds. This approach keeps the implementation small, avoids persistence concerns, and matches the current codebase's in-memory style.

[Types]
Define plain JavaScript object shapes for projects, time entries, notes, warehouse items, and inventory allocations.

- Project: `{ projectId: string, name: string, client: string, address: string | null, status: 'open' | 'archived', tags: string[], createdAt: string, archivedAt: string | null, timeEntries: TimeEntry[], notes: ProjectNote[], allocations: InventoryAllocation[], activity: ActivityEvent[] }`
- TimeEntry: `{ entryId: string, projectId: string, worker: string, start: string | null, end: string | null, minutes: number, description: string, createdAt: string }` with `minutes >= 0` and computed from start/end when omitted.
- ProjectNote: `{ noteId: string, projectId: string, author: string, text: string, createdAt: string }`
- WarehouseItem: `{ itemId: string, sku: string, name: string, unit: string, availableQty: number, location: string | null, createdAt: string }` with `availableQty >= 0`.
- InventoryAllocation: `{ allocationId: string, projectId: string, itemId: string, sku: string, name: string, unit: string, quantity: number, location: string | null, allocatedAt: string }` with `quantity > 0`.
- ActivityEvent: `{ eventId: string, projectId: string, type: 'time_entry' | 'note' | 'inventory_allocated' | 'project_created' | 'project_archived', payload: object, createdAt: string }`.

[Files]
Add a new service module and extend the HTTP API routing.

- New files:
  - `/vercel/sandbox/src/handwerker.js` - in-memory service for projects, time tracking, warehouse stock, and summaries.
- Modified files:
  - `/vercel/sandbox/index.js` - instantiate the new service and add REST-style routes for projects, time entries, inventory allocation, summaries, and activity feeds.
- Deleted/moved files: none.
- Configuration updates: none.

[Functions]
Introduce a new service class and wire its methods into HTTP endpoints.

- New functions (in `/vercel/sandbox/src/handwerker.js`):
  - `createProject({ projectId, name, client, address, tags })` - validate and store project, add activity event.
  - `listProjects()` - return array of projects with lightweight summaries.
  - `getProject(projectId)` - fetch full project with nested data.
  - `addTimeEntry({ projectId, entryId, worker, start, end, minutes, description })` - compute minutes, store entry, log activity.
  - `addProjectNote({ projectId, noteId, author, text })` - store note and activity.
  - `createWarehouseItem({ itemId, sku, name, unit, quantity, location })` - add stock to warehouse pool.
  - `listWarehouseItems()` - return all warehouse items.
  - `allocateInventory({ projectId, allocationId, itemId, quantity, location })` - deduct stock, add allocation, log activity.
  - `archiveProject(projectId)` - mark project archived and log activity.
  - `projectSummary(projectId)` - compute total minutes, hours, allocation counts, last activity.
  - `projectActivity(projectId)` - return activity events sorted by time.
- Modified functions (in `/vercel/sandbox/index.js`):
  - `readJson(req)` - unchanged; reuse for new endpoints.
  - `server` request handler - add routing for the new endpoints, parse URL paths, and return JSON responses.
- Removed functions: none.

[Classes]
Add a new service class for handwerker workflows; no other class changes.

- New classes:
  - `HandwerkerService` in `/vercel/sandbox/src/handwerker.js` with methods listed above and internal Maps for projects and warehouse items.
- Modified classes: none.
- Removed classes: none.

[Dependencies]
No dependency changes; reuse Node.js standard library only.

[Testing]
No automated tests added; manual validation via HTTP requests is sufficient for the new endpoints.

[Implementation Order]
Create the service module first, then wire it into the HTTP routes.

1. Add `/vercel/sandbox/src/handwerker.js` with in-memory data structures and methods.
2. Update `/vercel/sandbox/index.js` to parse URLs, instantiate the service, and add routes for projects, time entries, warehouse items, allocations, summaries, and activity.
3. Ensure error handling and JSON responses are consistent with existing endpoints.
