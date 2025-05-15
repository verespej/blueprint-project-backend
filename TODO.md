# TODOs

This project is very early in its lifetime. So, a couple TODOs are tracked here.

We can use repo issues when the overhead's worthwhile.


## Dev system

- Add pre-commit hook to run type checking and tests
- Add more tests and test coverage
- Add request logging
- Generic catch-all error handler to produce formatted errors
    - Include re-formatting of zod errors


## Functionality

- Assessment sections should have display orders


### Correctness

- Running of rules engine should be idempotent
    - Note: This impacts the assignment submission API endpoint


## Security and privacy

- Proper authentication and authorization
- Review and revise APIs to avoid information leakage
    - Don't expose certain IDs in URLs - get them from sessions
    - API return values - don't expose full DB records
- HTTPS (when deployed)
