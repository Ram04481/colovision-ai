# AGENTS.md - Project Coding Rules

## Core Principles

1. **Never invent APIs** - Use existing endpoints, check `docs/api-contract.md`
2. **Never invent database fields** - Check `docs/database-design.md` and entity classes
3. **Never invent model architecture** - Check `docs/ml-models.md` and training notebooks
4. **Never create fake AI predictions** - Real models only, no mocks
5. **Never hard-code prediction results** - All results from model inference
6. **Never change technology stack** without explicit approval (see ADR 001, 002)
7. **Never replace real PyTorch models** with mock models
8. **Never change model preprocessing** without verifying training code (`ML_API/*.ipynb`)
9. **Never change class mapping** without verifying training checkpoint `class_names`
10. **Never modify unrelated files** - Stay focused on the task

## Development Practices

11. **Prefer small focused changes** - One logical change per commit
12. **Before modifying code, identify the root cause** - Don't treat symptoms
13. **Before changing architecture, explain the reason** - Document in ADR
14. **Preserve working functionality** - Don't break what works
15. **Do not rewrite complete files** when a focused change is sufficient
16. **Follow existing project conventions** - Match code style, patterns
17. **Do not introduce unnecessary dependencies** - Justify each addition
18. **Do not install dependencies automatically** unless explicitly requested

## Security Rules

19. **Never expose passwords, JWT secrets, API keys or database credentials**
20. **Never commit .env files**
21. **Never put real credentials into source code**
22. **Validate uploaded files** - magic bytes, dimensions, size
23. **Protect admin endpoints with authorization** - `ROLE_ADMIN` required
24. **Validate resource ownership** - Users only access their data
25. **Use appropriate HTTP status codes** - 400, 401, 403, 404, 415, 503
26. **Use meaningful error handling** - User-friendly messages, no stack traces
27. **Do not silently swallow exceptions** - Log and return proper response
28. **Do not hide errors** just to make the application appear to work
29. **Do not mark a task complete without verification** - Test before done

## Verification Requirements

30. **After every implementation phase**:
    - Build (backend: `mvn verify`, frontend: `npm run build`)
    - Test (run relevant tests)
    - Inspect changed files
    - Report results

31. **Before making a large change**:
    - Explain the change
    - List files that will change
    - Identify risks

## Service Responsibilities (ADR 002)

32. **Keep frontend, backend and ML responsibilities separated**
33. **Spring Boot owns**: Business logic, authentication, authorization, database operations, orchestration
34. **FastAPI owns**: ML inference
35. **PyTorch owns**: Model inference
36. **React owns**: Presentation and user interaction
37. **MySQL owns**: Persistent application data
38. **Do not put ML model logic inside React**
39. **Do not put database credentials inside React**
40. **Do not expose internal ML service credentials to the browser**

## Git Practices

- Commit messages: `<type>(<scope>): <subject>` (feat, fix, docs, refactor, test, chore)
- One logical change per commit
- No secrets in commits (check with `git diff --cached`)
- Update documentation when code changes

## Documentation Maintenance

When implementation changes, update only relevant docs:
- API changed → `docs/api-contract.md`
- Database changed → `docs/database-design.md`
- Authentication changed → `docs/authentication.md`
- ML inference changed → `docs/ml-inference.md` and `docs/ml-models.md`
- Architecture changed → create/update ADR in `docs/decisions/`
- Bug discovered → `docs/troubleshooting.md`
- Feature completed → `docs/implementation-status.md`
- Phase completed → `docs/development-plan.md`