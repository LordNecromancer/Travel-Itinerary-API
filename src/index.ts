// === IMPORTS ===
import { Hono } from 'hono'
import { v4 as uuidv4 } from 'uuid'
import { setInitialFirestoreDoc, getFirestoreDoc } from './services/firestoreService';
import { handleAsyncJob } from './services/itineraryService';

// === APP SETUP ===
const app = new Hono()

type RequestBody = {
  destination: string
  durationDays: number
}

// Main API route, which expects destination and durationDays as input.
app.post('/', async (c) => {
  const body: RequestBody = await c.req.json()
  const jobId = uuidv4()
  const LLMApiKey=c.env.OPENAI_API_KEY
  const firestoreApiKey=c.env.FIREBASE_SERVICE_ACCOUNT

  try{
  await setInitialFirestoreDoc(firestoreApiKey, jobId, body.destination, body.durationDays)

  c.executionCtx.waitUntil(
      handleAsyncJob(LLMApiKey, firestoreApiKey, jobId, body.destination, body.durationDays)
    );

  return c.json({ jobId }, 202)
  } catch (err) {
    return c.json({ error: err.message || 'Internal Server Error' }, 500);
  }
})

// Route to get the generated itinerary from firestore.
app.get('/job/:jobId', async (c) => {
  const jobId = c.req.param('jobId')
  const firestoreApiKey = c.env.FIREBASE_SERVICE_ACCOUNT

  try {
    const doc = await getFirestoreDoc(firestoreApiKey, jobId)
    if (!doc) {
      return c.json({ error: 'Job not found' }, 404)
    }
    return c.json(doc)
  } catch (err) {
    return c.json({ error: err.message || 'Internal Server Error' }, 500)
  }
})

export default app
