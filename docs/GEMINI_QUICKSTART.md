# 🤖 Gemini CLI Quickstart Guide: AI-Powered Audits

The **Gemini CLI** is now integrated into your project as a "Senior Engineer in a Box." It can audit your code for security, logic errors, and compliance.

---

## 1️⃣ Step 1: Authentication
Before using the CLI, you need to log in to your Google Account. Open your terminal and run:

```powershell
gemini login
```
*A browser window will open to authorize the CLI.*

---

## 2️⃣ Step 2: Interactive Mode
You can chat with the project context directly. This is great for asking "How does the grading logic work?" or "Where is the RLS policy for students?"

```powershell
gemini
```
*Type your questions. Type `exit` to quit.*

---

## 3️⃣ Step 3: Run the "Sentinels" (Autonomous Audits)
I have built specialized audit routines that use specific prompt templates. You can run these manually to check your project's health.

### Run All Audits
```powershell
.\.agent\sentinels\gemini\sentinel-run.ps1
```

### Run Only Role-Compliance Audit
```powershell
.\.agent\sentinels\gemini\sentinel-run.ps1 -AuditType role
```

### Run Only Audit-Trail Consistency
```powershell
.\.agent\sentinels\gemini\sentinel-run.ps1 -AuditType audit
```

---

## 📂 Where are the Reports?
Every time you run a sentinel audit, a detailed Markdown report is generated in:
`e:\TTGDBH\BH-EDU\reports\`

---

## 🛠️ Advanced Usage
You can also run one-off commands with specific files:

**Audit a specific file:**
```powershell
gemini -p "Check this file for security issues" supabase/migrations/010_financial_system.sql
```

**Generate documentation for a whole directory:**
```powershell
gemini -p "Generate a README for this directory" web/lib/grades/
```

---

> [!TIP]
> The Gemini CLI uses the `.geminiignore` file I created to ensure it only analyzes relevant code, keeping the AI focused and accurate.
