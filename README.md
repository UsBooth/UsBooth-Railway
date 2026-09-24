# UsBooth

UsBooth is a virtual photobooth platform designed for people to create memories together, including across separate devices.

## Current stage

Phase 1 — cloud foundation.

This repository intentionally starts with a clean foundation. Authentication, PostgreSQL, permanent Booth identities, sessions, storage, realtime, and WebRTC signaling will be added incrementally and tested before the corresponding product pages are built.

## Structure

- `apps/web` — Next.js web application
- `apps/api` — reserved for the production API service
- `packages/types` — shared TypeScript types
- `packages/config` — shared configuration
- `packages/ui` — reusable UI components
- `database` — database documentation and future migrations
- `docs` — architecture and API documentation

## Deployment

The initial web application is intended to deploy to Render from the `main` branch.

## Development principle

Each feature is implemented, tested, documented, and only then treated as complete.
