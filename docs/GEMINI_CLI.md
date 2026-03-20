# Gemini CLI Usage Guide

This guide outlines how to use the Gemini CLI for BH-EDU development tasks.

## 🚀 Getting Started

Ensure you have the Gemini CLI installed:
```bash
npm install -g @google/gemini-cli
```

Authenticate your session:
```bash
gemini login
```

## 🛠️ Common Tasks

### 1. Code Security Audit
Analyze a specific directory for security vulnerabilities:
```bash
gemini "Audit the security of the API routes in web/app/api/admin and suggest improvements."
```

### 2. Documentation Generation
Generate documentation for a complex service:
```bash
gemini "Create a detailed README.md for the studentService.ts including all exported methods and their parameters."
```

### 3. Commit Message Generation
Summarize your changes for a commit:
```bash
git diff | gemini "Generate a concise, conventional commit message based on these changes."
```

### 4. Interactive Debugging
Start a REPL session to explore the codebase:
```bash
gemini --interactive
```

## 📝 Best Practices
- **Context is Key**: Use the CLI within the project root to leverage the `.geminiignore` filter.
- **Specific Prompts**: Instead of "Fix this code," use "Identify potential edge cases in the `calculateGPA` function and provide fixes."
