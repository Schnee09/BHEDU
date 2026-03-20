# n8n Automation Guide: BH-EDU

This guide documents the n8n workflows integrated with BH-EDU to handle background processes and external integrations.

## 🏗️ Architecture

1. **Trigger**: Supabase Webhooks (HTTP Post).
2. **Orchestrator**: n8n Workflow.
3. **Actions**: Email (Nodemailer/Resend), SMS, Data Sync.

---

## 📋 Planned Workflows

### 1. Welcome Automation (Student/Staff)
- **Trigger**: New record in `auth.users` via Supabase Webhook.
- **n8n Nodes**:
    - **Webhook node**: Receive user email and role.
    - **Supabase node**: Fetch profile details from `profiles` table.
    - **Email node**: Send a localized (Vietnamese) welcome email with login instructions.

### 2. Low Attendance Alert
- **Trigger**: Daily scheduled task or database update trigger.
- **n8n Nodes**:
    - **Schedule node**: Run every evening at 6:00 PM.
    - **Supabase node**: Query `attendance_records` for absences today.
    - **Filter node**: Identify students with > 3 absences in a month.
    - **Telegram/Zalo node**: Notify class teachers or parents.

---

## ⚙️ Setup Instructions

### 1. n8n Configuration & Self-Hosting

#### To start n8n locally with Docker:
Ensure you have Docker installed and running, then execute:
```powershell
docker-compose -f docker-compose.n8n.yml up -d
```

Your n8n instance will be available at [http://localhost:5678](http://localhost:5678).

#### Configuration:
- Host n8n (Self-hosted or Cloud).
- Add **Credentials**:
    - **Supabase**: URL and Service Role Key (from your `.env.local`).
    - **SMTP/Email Service**: credentials for sending notifications (e.g., Resend or Gmail).

### 2. Supabase Webhook Setup
In the Supabase Dashboard:
1. Navigate to **Database > Webhooks**.
2. Create a new Webhook:
    - **Name**: `n8n-welcome-email`
    - **Table**: `auth.users`
    - **Events**: `INSERT`
    - **URL**: Your n8n Webhook URL.

---

## 🧪 Testing Workflows
To test a workflow without waiting for a database event:
1. Use the **cURL** command provided in the n8n webhook node.
2. Verify the "Execution" history in the n8n dashboard.
