// === IMPORTS ===
import { Hono } from 'hono'
import { v4 as uuidv4 } from 'uuid'
import { encode as b64 } from 'base64-arraybuffer'
import { sign } from 'hono/jwt'

// === APP SETUP ===
const app = new Hono()

type RequestBody = {
  destination: string
  durationDays: number
}

// app.get('/', async (c) => {
//   return c.text('Travel Itinerary API!');
// });

app.post('/', async (c) => {
  const body: RequestBody = await c.req.json()
  const jobId = uuidv4()

  try{
    console.log(c)
 // await setInitialFirestoreDoc(c, jobId, body.destination, body.durationDays)

  handleAsyncJob(c, jobId, body.destination, body.durationDays)

  return c.json({ jobId }, 202)
  } catch (err) {
    return c.json({ error: err.message || 'Internal Server Error' }, 500);
  }
})

export default app

// === ASYNC HANDLER ===
async function handleAsyncJob(c, jobId: string, destination: string, durationDays: number) {
  try {
        console.log(6)

    const itinerary = await generateItinerary(c, destination, durationDays)
    console.log(7)
    console.log(itinerary)

    await updateFirestore(c, jobId, {
      status: 'completed',
      completedAt: new Date(),
      itinerary,
      error: null,
    })
  } catch (err: any) {
    await updateFirestore(c, jobId, {
      status: 'failed',
      completedAt: new Date(),
      itinerary: [],
      error: err.message || 'Unknown error',
    })
  }
}

// === LLM CALL ===
async function generateItinerary(c, destination: string, durationDays: number) {
  const prompt = `Create a structured travel itinerary in JSON format for ${durationDays} days in ${destination}. 
  Each day must have a theme and 3 activities (morning, afternoon, evening), with a description and location. 
  Return strictly the JSON that matches this schema: 
  [{"day": 1, "theme": "string", "activities": [{"time": "Morning", "description": "string", "location": "string"}]}]`

  const apiKey = c.env.OPENAI_API_KEY
  console.log(apiKey)
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-5',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    }),
  })
  console.log(response)

  const data = await response.json()
  const text = data.choices[0].message.content

  return JSON.parse(text)
}

// === FIRESTORE FUNCTIONS ===
function getFirestore(c) {
  console.log("Hey")
  const key = JSON.parse(c.env.FIREBASE_SERVICE_ACCOUNT)
  console.log("HHey")

  const projectId = key.project_id
  const tokenUrl = `https://oauth2.googleapis.com/token`

  return {
    async getAccessToken() {
        console.log(key)

      const jwt = await createJWT(key)
        console.log(jwt)

    const res = await fetch("https://oauth2.googleapis.com/token", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion: jwt
  })
});
const data = await res.json();
console.log(data);
      return data.access_token
    },

    async writeDoc(docId: string, body: any) {
      const accessToken = await this.getAccessToken()
      const url = `https://firestore.googleapis.com/v1/projects/travel-itinerary-ab63a/databases/(default)/documents/itineraries/${docId}`
      await fetch(url, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fields: toFirestoreFields(body) }),
      }).then(res => {
      if (!res.ok) {
        console.error("Failed to write doc:", res.status, res.statusText);
        return res.text().then(text => console.error(text));
      } else {
        console.log("Document written successfully");
      }
})
    },
  }
}

async function setInitialFirestoreDoc(c, jobId: string, destination: string, durationDays: number) {
  const firestore = getFirestore(c)
    console.log(45)

  await firestore.writeDoc(jobId, {
    status: 'processing',
    destination,
    durationDays,
    createdAt: new Date().toISOString(),
    completedAt: null,
    itinerary: [],
    error: null,
  })
  console.log(5)
}

async function updateFirestore(c, jobId: string, update: {
  status: string,
  completedAt: Date,
  itinerary: any[],
  error: string | null,
}) {
  const firestore = getFirestore(c)
  await firestore.writeDoc(jobId, update)
}

// === FIRESTORE AUTH HELPERS ===
// async function createJWT(key: any) {
//   const header = {
//     alg: 'RS256',
//     typ: 'JWT',
//   }

//   const iat = Math.floor(Date.now() / 1000)
//   const exp = iat + 3600

//   const payload = {
//     iss: key.client_email,
//     sub: key.client_email,
//     aud: 'https://oauth2.googleapis.com/token',
//     iat,
//     exp,
//     scope: 'https://www.googleapis.com/auth/datastore',
//   }

//   const encodedHeader = btoa(JSON.stringify(header))
//   const encodedPayload = btoa(JSON.stringify(payload))
//   const toSign = `${encodedHeader}.${encodedPayload}`

//   const cryptoKey = await crypto.subtle.importKey(
//     'pkcs8',
//     strToBuffer(atob(key.private_key)),
//     { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
//     false,
//     ['sign']
//   )

//   const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, strToBuffer(toSign))
//   const encodedSig = b64(signature)

//   return `${encodedHeader}.${encodedPayload}.${encodedSig}`
// }

// function strToBuffer(str: string) {
//   const encoder = new TextEncoder()
//   return encoder.encode(str)
// }

async function createJWT(key: any) {
  const iat = Math.floor(Date.now() / 1000)
  const exp = iat + 3600 // 1 hour
        console.log(key.client_email)

  const payload = {
    iss: key.client_email,
    sub: key.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    iat,
    exp,
    scope: 'https://www.googleapis.com/auth/datastore',
  }

  // Remove the PEM header/footer from private key
  const privateKey = key.private_key
    // .replace(/-----BEGIN PRIVATE KEY-----\n?/, '')
    // .replace(/-----END PRIVATE KEY-----\n?/, '')
     //.replace(/\n/g, '')

  // Sign with RS256
  console.log(privateKey)
  const jwt = await sign(payload, privateKey,"RS256")
  console.log(4)

  return jwt
}

// === Firestore field mapping ===
function toFirestoreFields(data: any): any {
  const fields: any = {}
  for (const [key, value] of Object.entries(data)) {
    console.log(key)
    console.log(value)

    fields[key] = toFirestoreValue(value)
  }
  return fields
}

function toFirestoreValue(value: any): any {
  if (value === null) return { nullValue: null };   // <-- Check null first
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'number') return { integerValue: value.toString() };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (value instanceof Date || (typeof value === 'object' && value !== null && 'toISOString' in value))
    return { timestampValue: new Date(value).toISOString() };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(toFirestoreValue) } };
  if (typeof value === 'object') return { mapValue: { fields: toFirestoreFields(value) } };
  throw new Error('Unsupported Firestore value type');
}
