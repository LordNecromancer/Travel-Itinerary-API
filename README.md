# 🌍 Travel Itinerary Generator API

**Live Cloudflare API**: https://travel-itinerary-api.mmdp313.workers.dev

**Repository**: https://github.com/LordNecromancer/Travel-Itinerary-API

---

## 📌 Overview

The **Travel Itinerary Generator API** is a serverless API built with [Hono](https://hono.dev) that creates **structured travel itineraries** using **OpenAI GPT-4o** and stores them in **Google Firestore**.

It is designed with **asynchronous job processing** so you can submit a request, instantly receive a `jobId`, and then check back later to retrieve the generated itinerary.  

---

## ✨ Features

- 📤 **POST** `/` — Start an itinerary generation job with `destination` and `durationDays`.
- ⚡ **Asynchronous Processing** — Uses `c.executionCtx.waitUntil` for non-blocking background tasks.
- 💾 **Firestore Integration** — Store and retrieve job status + results.
- 📥 **GET** `/job/:jobId` — Retrieve a job’s current status and formatted itinerary.
- 🛠 **Partial Firestore Updates** — Updates only relevant fields without overwriting the full document.
- 🔄 **Exponential Retry for LLM Calls** — Automatically retries contacting the LLM with exponential backoff to handle transient failures.


---

## 🚀 How to Use

### 1️⃣ Start a Job

```bash
curl -X POST https://travel-itinerary-api.mmdp313.workers.dev/ \
  -H "Content-Type: application/json" \
  -d '{"destination": "Isfahan", "durationDays": 2}'
```
Sample Response:
```bash
{ "jobId": "123e4567-e89b-12d3-a456-426614174000" }
```
### 2️⃣ Retrieve the Job Result
```bash
curl https://https://travel-itinerary-api.mmdp313.workers.dev/job/123e4567-e89b-12d3-a456-426614174000
```
Sample Response

The `/job/:jobId` endpoint returns the itinerary in structured JSON format:

```json
[
    {
        "day": 1,
        "theme": "Historical and Cultural Exploration",
        "activities": [
            {
                "time": "Morning",
                "description": "Visit the stunning Naqsh-e Jahan Square, a UNESCO World Heritage site featuring magnificent architecture including the Shah Mosque.",
                "location": "Naqsh-e Jahan Square"
            },
            {
                "time": "Afternoon",
                "description": "Explore the historic Chehel Sotoun Palace, known for its Persian garden and beautiful wall paintings that tell stories of the Safavid era.",
                "location": "Chehel Sotoun Palace"
            },
            {
                "time": "Evening",
                "description": "Enjoy a leisurely stroll along the historic Khaju Bridge, known for its beautiful arches and vibrant evening atmosphere.",
                "location": "Khaju Bridge"
            }
        ]
    }
]

---

## 🛠️ Running Locally
### 🔄 Clone the Repository
```bash

git clone https://github.com/yourusername/travel-itinerary-api.git
cd travel-itinerary-api
```

### 📦 Install Dependencies
```bash
npm install
```

### ⚙️ Set Environment Variables
Create a .dev.vars file in the same directory as source code with the two following keys:
```bash
OPENAI_API_KEY='sk-xxxxx'
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
```

### ▶️ Start the API
```bash
npx wrangler dev
```

The worker is available at:
```
http://127.0.0.1:8787
```
---

## ☁️ Deploying to Production

Make sure you’re logged in to Cloudflare:
```bash
npx wrangler login
```

Deploy the Worker:

```bash
npx wrangler deploy
```

You’ll get a live URL like:
```
https://travel-itinerary-api.your-account.workers.dev
```
---

## 📂 Folder Structure

travel-itinerary-api/
│
├── .dev.vars
├── wrangler.toml
├── package.json
├── tsconfig.json
│
└── src/
    ├── index.ts
    │
    ├── services/
    │   ├── firestoreService.ts
    │   └── itineraryService.ts
    │
    └── utils/
        ├── jwtUtils.ts
        └── firestoreFormatters.ts

---

## 🧠 Technical Highlights

Hono: Minimal, high-performance web framework for Cloudflare Workers.

c.executionCtx.waitUntil: Runs long tasks without delaying HTTP responses.

Firestore Partial Updates: Uses updateMask to add new fields without overwriting existing ones.

Multi-LLM Support: Easily switch between OpenAI and Gemini APIs.

Structured JSON Output: Enforced prompt schema for consistent results.



