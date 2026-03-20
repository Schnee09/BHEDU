# 🚀 n8n Quickstart Guide: From Zero to Sentinel

This guide will help you get **n8n** running and activate the **Autonomous Sentinels** I've built for you. No coding required!

---

## 1️⃣ Step 1: Start n8n
I have already provided the configuration. To start it, open your terminal (PowerShell) and run:

```powershell
docker-compose -f docker-compose.n8n.yml up -d
```

> [!NOTE]
> Once it's running, open your browser and go to: **[http://localhost:5678](http://localhost:5678)**

---

## 2️⃣ Step 2: First Time Setup
When you first open n8n:
1. Create your owner account (this stays on your computer).
2. You'll see an empty "Canvas." This is where the magic happens.

---

## 3️⃣ Step 3: Link your Supabase
n8n needs to talk to your database.
1. Click on **Credentials** (key icon on the left sidebar).
2. Click **Add Credential** and search for **Supabase**.
3. Fill in:
    - **Host**: Your Supabase Project URL (find it in `supabase/config.toml` or dashboard).
    - **Service Role Key**: Your secret key (marked as `service_role` in Supabase settings).

---

## 4️⃣ Step 4: Import the Sentinels
I have prepared the "brains" of the sentinels for you in `.agent/sentinels/n8n/`.

1. In the n8n sidebar, click **Workflows**.
2. Click **Add Workflow** > **Create New**.
3. Click the **three dots (⋮)** in the top right corner.
4. Select **Import from File**.
5. Choose one of the files from: `e:\TTGDBH\BH-EDU\.agent\sentinels\n8n\`
    - `ghost-class-detector.json`
    - `data-health-monitor.json`
    - `academic-gap-analyzer.json`
6. Click **Activate** (toggle in the top right).

---

## 🛠️ Summary of Sentinels
| Sentinel | What it does |
| :--- | :--- |
| **Ghost Class** | Finds classes where someone forgot to take attendance. |
| **Data Health** | Tells you exactly which rows failed during a CSV import. |
| **Academic Gap** | Uses AI to tell you which students are falling behind which standards. |

---

> [!TIP]
> If you get stuck, just ask me! I can explain any specific node or help you fix connection issues.
