# 0001 — Application and operations shape

**CURRENT — 2026-09-10.** A Next.js modular monolith with server-mediated commerce is sufficient for one operator and a small catalog. Separate module responsibilities, not deployments. Microservices add coordination without a demonstrated scaling need.

Public metadata and demos are reviewed in Git. Use provider dashboards and documented, access-restricted database operations for private version registration, incident diagnosis and support. Record actor, reason and affected identifiers for administrative changes; never manually flip a generic paid flag. No admin application in MVP.

Graduate to protected admin tools when recurring operations cannot be performed safely/repeatably through runbooks, or nontechnical operators need independent publishing. A second deployment requires evidence of independent scaling or isolation needs and lead review.

Dependency adoption follows [architecture gates](../architecture.md#dependency-gates); no speculative wrappers for replacement providers.
