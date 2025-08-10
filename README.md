# 🌍 Travel Itinerary Generator API

**Live Demo**: *[Add your deployed Cloudflare Pages/Workers link here]*  
**Repository**: *[Add your GitHub repo link here]*

---

## 📌 Overview

The **Travel Itinerary Generator API** is a serverless API built with [Hono](https://hono.dev) that creates **structured travel itineraries** using **OpenAI GPT-4o** or **Google Gemini** and stores them in **Google Firestore**.

It is designed with **asynchronous job processing** so you can submit a request, instantly receive a `jobId`, and then check back later to retrieve the generated itinerary.  
Perfect for integrating into web apps, mobile apps, or other travel-related services.

---

## ✨ Features

- 📤 **POST** `/` — Start an itinerary generation job with `destination` and `durationDays`.
- ⚡ **Asynchronous Processing** — Uses `c.executionCtx.waitUntil` for non-blocking background tasks.
- 💾 **Firestore Integration** — Store and retrieve job status + results.
- 📥 **GET** `/job/:jobId` — Retrieve a job’s current status and formatted itinerary.
- 🤖 **LLM Support** — Works with **OpenAI GPT-4o** and **Google Gemini**.
- 🛠 **Partial Firestore Updates** — Updates only relevant fields without overwriting the full document.

---

## 🚀 How to Use

### 1️⃣ Start a Job

```bash
curl -X POST https://your-worker-url/ \
  -H "Content-Type: application/json" \
  -d '{"destination": "Paris", "durationDays": 5}'
```
Response:
```bash

{ "jobId": "123e4567-e89b-12d3-a456-426614174000" }
```
2️⃣ Retrieve the Job Result
```bash

curl https://your-worker-url/job/123e4567-e89b-12d3-a456-426614174000
```
Response:
```bash

{
  "status": "completed",
  "itinerary": "Day 1 - Eiffel Tower visit..."
}
```
🛠️ Running Locally
🔄 Clone the Repository
```bash

git clone https://github.com/yourusername/travel-itinerary-api.git
cd travel-itinerary-api
```
📦 Install Dependencies
```bash

npm install
```
⚙️ Set Environment Variables
Create a .dev.vars file in the same directory as source code
OPENAI_API_KEY='sk-xxxxx'
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
▶️ Start the API

npm run dev
📂 Folder Structure

src/
├── index.ts                # Hono server routes
├── .dev.vars
🧠 Technical Highlights
Hono: Minimal, high-performance web framework for Cloudflare Workers.

c.executionCtx.waitUntil: Runs long tasks without delaying HTTP responses.

Firestore Partial Updates: Uses updateMask to add new fields without overwriting existing ones.

Multi-LLM Support: Easily switch between OpenAI and Gemini APIs.

Structured JSON Output: Enforced prompt schema for consistent results.

✅ Completed Capabilities
Capability	Status
Async job handling	✅
Firestore integration	✅
Partial updates	✅
Ready for Cloudflare Workers	✅
API endpoints documented	✅

