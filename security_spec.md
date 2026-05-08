# Security Specification - Olodo Stars FC

This document defines the security invariants and test payloads for the Olodo Stars FC Firestore database.

## Data Invariants

1.  **Identity Hierarchy**: 
    -   `super_admin`: Full CRUD access to all collections. Bootstrapped by email `149benblue@gmail.com`.
    -   `editor`: Can update specific non-critical fields in players, officials, and news. Can create news articles (pending approval).
    -   `viewer`: Read-only access to public collections. Can submit opinions and increment commitment counts.
    -   `guest`: Read-only access to public collections (except donations).

2.  **Collection Invariants**:
    -   `users`: Documents must be either `request.auth.uid` or start with `pre_` (pre-authorization). Only Super Admins can set roles other than 'viewer'.
    -   `players`: Commitment count can be incremented by anyone (ratelimited conceptually by only allowing increment).
    -   `news`: Public submissions must have `approved: false`. Admins can approve.
    -   `donations`: Anyone can create, only Super Admins can read (PII isolation).

## The "Dirty Dozen" Payloads

1.  **Identity Spoofing**: Attempt to create a user profile for a different UID.
2.  **Privilege Escalation**: A viewer attempting to set their own role to `super_admin`.
3.  **Bypassing Pre-auth**: A guest trying to create a `pre_` authorized record for themselves.
4.  **Shadow Update**: Attempting to add an `isAdmin: true` field to a player document.
5.  **State Shortcutting**: Approving a news article as a guest.
6.  **Resource Poisoning**: Sending a 1MB string as a player name.
7.  **Unverified Admin**: Accessing admin paths with `email_verified: false` but correct email.
8.  **Terminal State Lock**: Modifying a finished match's score (if terminal states existed).
9.  **Relational Orphan**: Creating an opinion for a non-existent player.
10. **PII Leak**: A viewer trying to list all donations.
11. **Malicious ID**: Using a 2KB junk string as a document ID.
12. **Timestamp Fraud**: Providing a client-side `createdAt` timestamp instead of server timestamp.

## Red Team Audit Results (Anticipated)

-   **Pass**: All malicious payloads rejected by strict validation and identity checks.
-   **Pass**: "pre_" user creation restricted to Super Admins.
-   **Pass**: Affected keys verified for all partial updates.
