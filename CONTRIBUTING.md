# Contributing to Aura Stack Auth

First off, thank you for considering contributing to Aura Stack Auth! It's people like you that make this project such a great tool for the community.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Setting Up Your Development Environment](#setting-up-your-development-environment)
- [How Can I Contribute?](#how-can-i-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Enhancements](#suggesting-enhancements)
  - [Your First Code Contribution](#your-first-code-contribution)
  - [Pull Requests](#pull-requests)
- [Development Workflow](#development-workflow)
  - [Project Structure](#project-structure)
  - [Running Tests](#running-tests)
  - [Code Style](#code-style)
- [Commit Guidelines](#commit-guidelines)
- [Release Process](#release-process)

## Code of Conduct

This project and everyone participating in it is governed by a code of conduct. By participating, you are expected to uphold this code. Please be respectful, inclusive, and considerate in all interactions.

### Our Standards

- **Be respectful**: Treat everyone with respect and kindness
- **Be inclusive**: Welcome and support people of all backgrounds
- **Be constructive**: Provide constructive feedback and be open to receiving it
- **Be collaborative**: Work together towards common goals
- **Be patient**: Remember that everyone has different skill levels and learning curves

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18 or higher
- **pnpm** 10.15.0 or higher (required)
- **Git** for version control

### Setting Up Your Development Environment

1. **Fork the repository** on GitHub

2. **Clone your fork** locally:

   ```bash
   git clone https://github.com/YOUR_USERNAME/auth.git
   cd auth
   ```

3. **Add the upstream repository** as a remote:

   ```bash
   git remote add upstream https://github.com/aura-stack-js/auth.git
   ```

4. **Install dependencies**:

   ```bash
   pnpm install
   ```

5. **Build all packages**:

   ```bash
   pnpm build
   ```

6. **Run tests** to ensure everything is working:
   ```bash
   pnpm test
   ```

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the [issue tracker](https://github.com/aura-stack-js/auth/issues) as you might find that you don't need to create one. When you are creating a bug report, please include as many details as possible:

- **Use a clear and descriptive title** for the issue
- **Describe the exact steps to reproduce the problem** in as much detail as possible
- **Provide specific examples** to demonstrate the steps
- **Describe the behavior you observed** and what behavior you expected to see
- **Include screenshots or animated GIFs** if applicable
- **Include your environment details**: OS, Node.js version, package version

**Bug Report Template:**

```markdown
**Description**
A clear and concise description of the bug.

**To Reproduce**
Steps to reproduce the behavior:

1. ...
2. ...
3. ...

**Expected Behavior**
What you expected to happen.

**Actual Behavior**
What actually happened.

**Environment**

- OS: [e.g., Windows 11, macOS 13, Ubuntu 22.04]
- Node.js version: [e.g., 18.17.0]
- Package version: [e.g., 0.0.1]

**Additional Context**
Any other relevant information.
```

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- **Use a clear and descriptive title**
- **Provide a detailed description** of the suggested enhancement
- **Explain why this enhancement would be useful** to most users
- **List any similar features** in other projects if applicable

**Enhancement Template:**

```markdown
**Is your feature request related to a problem?**
A clear description of the problem.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Any alternative solutions or features you've considered.

**Additional Context**
Any other context or screenshots about the feature request.
```

### Your First Code Contribution

Unsure where to begin? You can start by looking through issues labeled:

- `good first issue` - Issues that are good for newcomers
- `help wanted` - Issues that need assistance

### Pull Requests

1. **Create a new branch** from `main`:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** and commit them (see [Commit Guidelines](#commit-guidelines))

3. **Write or update tests** as necessary

4. **Run tests** to ensure everything passes:

   ```bash
   pnpm test
   ```

5. **Run type checking**:

   ```bash
   pnpm type-check
   ```

6. **Format your code**:

   ```bash
   pnpm format
   ```

7. **Push to your fork**:

   ```bash
   git push origin feature/your-feature-name
   ```

8. **Open a Pull Request** on GitHub

**Pull Request Guidelines:**

- Use a clear and descriptive title
- Reference any related issues in the description
- Provide a comprehensive description of the changes
- Include screenshots or GIFs for UI changes
- Ensure all tests pass
- Keep pull requests focused on a single concern
- Update documentation if needed

## Development Workflow

### Project Structure

```
auth/
├── packages/
│   ├── core/           # Main authentication library
│   │   ├── src/        # Source code
│   │   └── tests/      # Tests
│   └── jose/           # JOSE utilities
│       ├── src/        # Source code
│       └── tests/      # Tests
├── .changeset/         # Changesets for versioning
└── turbo.json          # Turborepo configuration
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run tests for a specific package
cd packages/core
pnpm test
```

### Code Style

We use **Prettier** for code formatting and **ESLint** for linting. The configuration is already set up in the project.

- **Format code**: `pnpm format`
- **Check formatting**: `pnpm format:check`
- **Type check**: `pnpm type-check`

**Guidelines:**

- Use TypeScript for all new code
- Write meaningful variable and function names
- Add JSDoc comments for public APIs
- Keep functions small and focused
- Write tests for new features
- Follow existing code patterns

## Commit Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Code style changes (formatting, missing semicolons, etc.)
- `refactor`: Code changes that neither fix a bug nor add a feature
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Changes to build process or auxiliary tools

**Examples:**

```bash
feat(auth): add support for OAuth 2.0 PKCE flow
fix(jose): resolve token expiration validation issue
docs(readme): update installation instructions
test(core): add tests for session management
```

## Release Process

Releases are managed using [Changesets](https://github.com/changesets/changesets). If your PR includes changes that should be noted in the changelog:

1. **Create a changeset**:

   ```bash
   pnpm changeset
   ```

2. **Follow the prompts** to describe your changes

3. **Commit the changeset** file with your PR

The maintainers will handle the actual release process.

## Questions?

If you have questions, feel free to:

- Open a [Discussion](https://github.com/aura-stack-js/auth/discussions)
- Join our community chat (if available)
- Reach out to the maintainers

---

Thank you for contributing to Aura Stack Auth! 🎉

Your contributions help make authentication easier and more secure for developers everywhere.
