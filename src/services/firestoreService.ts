import { createJWT } from '../utils/jwtUtils.ts';
import { toFirestoreFields, formatItineraryForUser } from '../utils/firestoreFormatters.ts';

// This function provides three auxillary functions. 
function getFirestore(firestoreApiKey: string) {
  const key = JSON.parse(firestoreApiKey);
  const projectId = key.project_id;

  return {
    // This function returns an access token from google.
    async getAccessToken() {
      const jwt = await createJWT(key);
      const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: jwt,
        }),
      });
      const data = await res.json();
      return data.access_token;
    },
    // This function writes to the firestore. The update is partial, meaning it only updates selected fields.
    async writeDoc(docId: string, body: any) {
      const accessToken = await this.getAccessToken();
      let url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/itineraries/${docId}`;
      const fieldsToUpdate = Object.keys(body);
      const updateMask = fieldsToUpdate.map((f) => `updateMask.fieldPaths=${encodeURIComponent(f)}`).join('&');
      url += `?${updateMask}`;
      await fetch(url, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fields: toFirestoreFields(body) }),
      });
    },
    // Function to read from firestore. This function is used in GET route to read the itinerary based on jobId.
    async readDoc(docId: string) {
      const accessToken = await this.getAccessToken();
      const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/itineraries/${docId}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
      if (res.status === 404) return null;
      const data = await res.json();
      return data.fields;
    },
  };
}

// A function to make an interim initial document in firestore right after user sends a request to POST endpoint.
// Later this document will be updated based on the outcome of LLM.
export async function setInitialFirestoreDoc(firestoreApiKey, jobId, destination, durationDays) {
  const firestore = getFirestore(firestoreApiKey);
  await firestore.writeDoc(jobId, {
    status: 'processing',
    destination,
    durationDays,
    createdAt: new Date().toISOString(),
    completedAt: null,
    itinerary: [],
    error: null,
  });
}
// Update firestore
export async function updateFirestore(firestoreApiKey, jobId, update) {
  const firestore = getFirestore(firestoreApiKey);
  await firestore.writeDoc(jobId, update);
}
// A function to read a document in firestore based on jobId and return a formatted version of it that is more readable to user.
export async function getFirestoreDoc(firestoreApiKey, jobId) {
  const firestore = getFirestore(firestoreApiKey);
  const fields = await firestore.readDoc(jobId);
  return formatItineraryForUser(fields);
}
