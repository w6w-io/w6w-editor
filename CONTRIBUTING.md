# Contributing to w6w Editor

Thank you for your interest in contributing to the w6w (Workflow) Editor! We welcome contributions from the community.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Pull Request Process](#pull-request-process)
- [Development Setup](#development-setup)
- [Testing](#testing)
- [Code Style](#code-style)

---

## Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please be respectful and professional in all interactions.

---

## Getting Started

### Finding Issues to Work On

- Look for issues labeled **`good first issue`** if you're new to the project
- Issues labeled **`help wanted`** are open for anyone to tackle
- For unlabeled issues, please comment to check if someone is already working on it

### Before You Start

- **Browse existing issues and PRs** to avoid duplicate work
- **Open an issue first** for large features or architectural changes
- **Ask questions** if anything is unclear—we're here to help!

---

## How to Contribute

### Types of Contributions

We welcome:

- **Bug fixes**
- **New features** (especially new workflow components or integrations)
- **Documentation improvements**
- **Test coverage improvements**
- **Performance optimizations**
- **UI/UX enhancements**

### Contribution Workflow

1. **Fork the repository** and create a branch from `main`
2. **Make your changes** following our code style guidelines
3. **Add tests** for new functionality
4. **Update documentation** if needed
5. **Submit a pull request**

---

## Pull Request Process

### PR Requirements

- **Link to an issue**: All PRs should reference a related issue (except for minor typos/docs)
- **Keep it focused**: One feature or fix per PR
- **Write clear descriptions**: Explain what and why, not just how
- **Include a test plan**: Describe how you verified your changes
- **Add screenshots/demos** for UI changes

### PR Template

```markdown
## Description
Brief description of changes

## Related Issue
Fixes #123

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing Plan
How did you test this? Include:
- Unit tests added/updated
- Manual testing steps
- Screenshots (for UI changes)

## Checklist
- [ ] Code follows style guidelines
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] All tests passing
```

### Review Process

- All submissions require review from maintainers
- We'll provide feedback and may request changes
- Once approved, a maintainer will merge your PR

---

## Development Setup

### Prerequisites

- Node.js 18+ and pnpm
- Git

### Setup Steps

```bash
# 1. Clone the repository
git clone https://github.com/w6w/editor.git
cd editor

# 2. Install dependencies
pnpm install

# 3. Run development server
pnpm run dev

# 4. Run tests
pnpm test

# 5. Build the project
pnpm build
```

### Monorepo Structure

This is a monorepo managed with pnpm workspaces:

```
/packages
  /types        - TypeScript type definitions
  /core         - Core workflow engine
  /ui           - React components
  /editor       - Visual workflow editor
```

To work on a specific package:

```bash
# Run commands in a specific package
pnpm --filter @w6w/types test
pnpm --filter @w6w/editor dev
```

---

## Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests for a specific package
pnpm --filter @w6w/core test

# Run with coverage
pnpm test:coverage
```

### Writing Tests

- **Unit tests**: Test individual functions and components in isolation
- **Integration tests**: Test how components work together
- **E2E tests**: Test complete user workflows

**Testing Guidelines:**

- Write tests for all new features and bug fixes
- Keep tests focused and fast
- Use descriptive test names
- Mock external dependencies
- Aim for high coverage, but focus on meaningful tests

**Example:**

```typescript
describe('Workflow Engine', () => {
  it('should execute a simple workflow with one action', async () => {
    const workflow = createWorkflow({
      trigger: { type: 'manual' },
      actions: [{ type: 'log', message: 'Hello' }]
    });

    const result = await engine.execute(workflow);

    expect(result.status).toBe('success');
  });
});
```

---

## Code Style

### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow the existing code style
- Run `pnpm lint` before committing
- Run `pnpm format` to auto-format code

### React Components

- Use functional components with hooks
- Keep components focused and composable
- Use meaningful prop names
- Add PropTypes or TypeScript types

### Git Commits

Use clear, descriptive commit messages:

```
feat: add parallel execution flow control
fix: correct trigger validation logic
docs: update workflow components reference
test: add tests for error handling
```

**Commit Message Format:**

```
<type>: <subject>

<body (optional)>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `test`: Tests
- `refactor`: Code refactoring
- `chore`: Maintenance tasks

---

## Documentation

### When to Update Docs

Update documentation when you:

- Add new features or components
- Change existing behavior
- Add configuration options
- Fix bugs that affect usage

### Documentation Locations

- **User docs**: `/docs` directory
- **API docs**: TSDoc comments in code
- **README**: High-level project overview
- **Component reference**: [docs/workflow-components.md](docs/workflow-components.md)

---

## Questions or Need Help?

- **Open an issue** for bugs or feature requests
- **Start a discussion** for questions or ideas
- **Join our community** (links TBD)

---

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (see [LICENSE](LICENSE)).

---

## Thank You!

Your contributions make w6w better for everyone. We appreciate your time and effort! 🙏
