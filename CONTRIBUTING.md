# Contributing to openXeco

Thank you for your interest in contributing to openXeco! This document outlines the guidelines for contributing to this project.

---

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](./code_of_conduct.md). Please read it before contributing.

---

## How Can I Contribute?

### Reporting Bugs

If you find a bug, please open an issue on GitHub with the following information:

- **Clear description** of the problem
- **Steps to reproduce** the issue
- **Expected vs actual behavior**
- **Environment details** (OS, Node version, pnpm version, etc.)
- **Screenshots** or error logs if applicable

### Suggesting Features

We welcome feature suggestions! When proposing a new feature:

- **Explain the use case** - Why is this feature needed?
- **Describe the solution** - How should it work?
- **Consider alternatives** - Any other approaches considered?

### Pull Requests

1. **Fork** the repository
2. **Create a feature branch** from `main`
3. **Make your changes** following our coding standards
4. **Add tests** if applicable
5. **Ensure all checks pass** (lint, typecheck, tests)
6. **Update documentation** if needed
7. **Submit a pull request**

---

## Development Setup

Please refer to the following [page](./docs/developer-guide/development.md)

## Coding Standards

### Code Style

This project uses [Biome](https://biomejs.dev/) for formatting and linting:

```bash
# Check for issues
pnpm lint

# Auto-fix issues
pnpm lint:fix
```

### TypeScript

- All code must be written in TypeScript
- Run typecheck before committing:
  ```bash
  pnpm typecheck
  ```

### Git Commit Messages

Use clear, descriptive commit messages:

```
feat: add user registration endpoint
fix: resolve database connection timeout
docs: update authentication guide
refactor: simplify repository structure
```

**Prefixes:**

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, no logic)
- `refactor` - Code refactoring
- `test` - Adding or updating tests
- `chore` - Maintenance tasks

---

## Testing

### Running Tests (when applicable)

```bash
# Run all tests
pnpm test

# Run tests for a specific package
pnpm turbo test --filter=@openxeco/atlas-connector-backend
```

### Writing Tests

- Follow existing test patterns in each package
- Place tests in the same directory as the code being tested
- Use descriptive test names: `should[Functionality]When[Condition]`

---

## Documentation

### Updating Documentation

When contributing code, please update relevant documentation:

- API changes → Update authentication.md or developer-guide/
- Database schema changes → Update database.md
- New features → Add appropriate documentation

### Building Documentation

The documentation is in the `/docs` folder. Make sure to:

- Use clear headings
- Include code examples where appropriate
- Keep tables properly formatted

---

## Pull Request Process

### Before Submitting

1. **Sync your fork** with the main branch
2. **Run all checks** locally:
   ```bash
   pnpm lint
   pnpm typecheck
   pnpm test
   ```
3. **Test your changes** in the local development environment

### PR Description

Include in your pull request:

- **Summary** of changes
- **Related issues** (e.g., "Fixes #123")
- **Testing performed**

### Review Process

- All PRs require review before merging
- Address feedback promptly
- Keep PRs focused and reasonably sized

---

## Questions?

If you have questions about contributing:

- Open an issue for bugs or feature requests
- Start a discussion for general questions
- Contact the maintainers via email

---

## License

By contributing to openXeco, you agree that your contributions will be licensed under the [BSD-2-Clause](https://opensource.org/licenses/BSD-2-Clause) license.
