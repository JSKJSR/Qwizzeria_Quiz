# Phase 5 Implementation Plan

Unified App Shell + Retention + Competition + Admin Intelligence (No
Billing Yet)

## Objectives

-   Use existing code and minimum number of tokens, 
-   think like an product manager, SDE, a quiz master
-   Single entry point web app
-   Role-based access (visitor, user, super_admin)
-   Retention features: profile, history, resume quiz
-   Competition features: leaderboards, timed mode
-   Admin intelligence: analytics dashboard, pack performance
-   Stripe & billing deferred to Phase 6

## Architecture & Audit Summary

### Scalability

-   Unify apps to avoid config drift
-   Add indexes on quiz_sessions and question_attempts
-   Use materialized views for leaderboards/analytics
-   Enforce pagination on admin tables

### Security

-   RBAC stored in DB (user_roles)
-   Enforce RLS for sessions, attempts, content mutation
-   Guard admin routes frontend + DB
-   Audit logs for admin actions

### UX

-   Single entry point
-   Role-based navigation
-   Persistent quiz sessions
-   Profile + history for retention
-   Admin observability

## Milestones

### Milestone B -- Retention

-   /profile page
-   /history page
-   Resume quiz (/resume/:id)
-   DB: quiz_sessions.status

### Milestone C -- Competition

-   Leaderboards (global, per-pack, time-based)
-   Timed mode with speed bonus
-   Indexes and cached views

### Milestone D -- Admin Intelligence

-   /admin/analytics dashboard
-   Pack performance metrics
-   Per-question accuracy & drop-off

## Testing

### Unit Tests

-   Auth & role guards
-   Resume logic
-   Timer & scoring

### Integration Tests

-   Visitor → login → play pack
-   Resume flow
-   Admin access control

### RLS Tests

-   Users cannot access others' data
-   Admin content permissions

## Bug Fixes & Hardening

-   Prevent double-submit
-   Prevent client-side score tampering
-   Retry logic for writes
-   Offline/reconnect handling

## Performance

-   Pagination
-   Caching leaderboards
-   Lazy-load analytics
-   Avoid N+1 queries

## Security Checklist

-   Enforce RLS on all tables
-   Disable anonymous writes
-   Rate-limit session creation
-   Input validation
-   Audit logs

## Migration Plan

1.  Unify app shell
2.  Add RBAC + RLS
3.  Assign super_admin
4.  Route guards
5.  Retention features
6.  Competition features
7.  Admin analytics
8.  Indexes + views
9.  Tests
10. Bugfix sprint

## Out of Scope (Phase 6)

-   Stripe
-   Billing
-   Subscriptions
-   Webhooks

## Acceptance Criteria

-   DB-level admin enforcement
-   Resume works after refresh
-   Leaderboards performant at scale
-   Admin analytics \<2s load
-   Users cannot spoof scores
-   Core flows tested
-   update memory and claude.md with the workflow
-   compile lint
