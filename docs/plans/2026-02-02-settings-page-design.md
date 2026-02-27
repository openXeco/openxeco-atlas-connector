# Settings Page Design

## Overview

Add a Settings page with user management, ATLAS API configuration, and general application settings.

## Structure

Settings page at `/settings` with 3 tabs:

1. **Users** - CRUD for user accounts
2. **ATLAS API** - API credentials configuration
3. **General** - Application settings

## User Management Tab

### Users Table

| Column  | Description                   |
| ------- | ----------------------------- |
| Email   | User email address            |
| Created | Account creation date         |
| Actions | Edit, Change Password, Delete |

### Actions

**Add User** - Modal with:

- Email (required, validated)
- Password (required, min 8 chars)
- Confirm Password

**Edit User** - Modal with:

- Email field (editable)

**Change Password** - Modal with:

- New Password
- Confirm Password

**Delete User** - Confirmation dialog with guards:

- Cannot delete yourself
- Cannot delete if only 1 user exists

### Backend Endpoints

```
GET    /api/users              - List all users
POST   /api/users              - Create user
PATCH  /api/users/:id          - Update user email
PATCH  /api/users/:id/password - Change password
DELETE /api/users/:id          - Delete user
```

All endpoints require authentication.

## ATLAS API Tab

### Form Fields

- **Base URL** - Text input
- **API Key** - Password input with show/hide
- **Username** - Text input
- **Password** - Password input with show/hide

### Actions

- **Save** - Persist to database
- **Test Connection** - Validate credentials against ATLAS API

Settings stored in `atlas_config` table (runtime editable, no restart needed).

## General Settings Tab

### Form Fields

- **Application Name** - Text input (default: "ATLAS Connector")
- **Auto-sync on publish** - Toggle
- **Sync conflict resolution** - Select: Manual | Local wins | Remote wins

## Database Changes

Use existing `atlas_config` table with key-value structure:

- `atlas_base_url`
- `atlas_api_key`
- `atlas_username`
- `atlas_password`
- `app_name`
- `auto_sync_on_publish`
- `sync_conflict_resolution`

## Implementation Files

### Backend

- `packages/backend/src/routes/users.ts` - User CRUD endpoints
- `packages/backend/src/routes/settings.ts` - Settings endpoints
- `packages/backend/src/routes/index.ts` - Register new routes

### Frontend

- `packages/frontend/src/app/(dashboard)/settings/page.tsx` - Settings page
- `packages/frontend/src/components/settings/users-tab.tsx` - User management
- `packages/frontend/src/components/settings/atlas-api-tab.tsx` - API config
- `packages/frontend/src/components/settings/general-tab.tsx` - General settings
- `packages/frontend/src/components/settings/user-dialog.tsx` - Add/Edit user modal
- `packages/frontend/src/components/settings/change-password-dialog.tsx` - Password modal
