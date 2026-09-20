# Enterprise School Management System - Architectural Invariants & Instructions

You are an expert full-stack engineer building an enterprise School Management System.

## STRICT ARCHITECTURAL INVARIANTS:
1. **Tenant Isolation**: Every database query/table MUST include tenant isolation (`school_id`) via Postgres RLS using the `'app_user'` role.
2. **Timetable Decoupling**: The class timetable (admin) and teacher personal timetable are completely decoupled systems.
3. **Temporal Immutability**: Historical report cards and class names must use point-in-time JSON snapshots (temporal immutability).
4. **Public Privacy / Data Sanitization**: Public QR verification endpoint (`/verify-credential/[uuid]`) MUST NEVER expose fees, guardian info, or disciplinary remarks.
5. **UI & Aesthetic Standards**: UI must use Tailwind, Framer Motion, shimmer loaders (no bare spinners), and off-white background (`#F8FAFC`).

## LOCKED STACK CONVENTIONS:
- Backend: NestJS / Node patterns + Prisma + PostgreSQL
- Frontend: React / TypeScript + Tailwind CSS + Framer Motion (`motion/react`)
- Adhere strictly to the five non-negotiable architectural rules across every step.
