// Format the fields into key-value pairs suitable for firestore.
export function toFirestoreFields(data: any) {
  const fields: any = {};
  for (const [key, value] of Object.entries(data)) {
    fields[key] = toFirestoreValue(value);
  }
  return fields;
}
// Format the values that are going to be stored in firestore into suitable form.
function toFirestoreValue(value: any): any {
  if (value === null) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'number') return { integerValue: value.toString() };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (value instanceof Date || (typeof value === 'object' && 'toISOString' in value))
    return { timestampValue: new Date(value).toISOString() };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(toFirestoreValue) } };
  if (typeof value === 'object') return { mapValue: { fields: toFirestoreFields(value) } };
  throw new Error('Unsupported Firestore value type');
}
// Format the fields of the returned document from firestore, so that it becomes more readable to user.
export function formatItineraryForUser(fields: any) {
  if (!fields || !fields.itinerary) return null;
  const itinerary = (fields.itinerary.arrayValue?.values || []).map((dayObj) => {
    const dayFields = dayObj.mapValue.fields;
    return {
      day: Number(dayFields.day?.integerValue || 0),
      theme: dayFields.theme?.stringValue || '',
      activities: (dayFields.activities?.arrayValue?.values || []).map((act) => {
        const actFields = act.mapValue.fields;
        return {
          time: actFields.time?.stringValue || '',
          description: actFields.description?.stringValue || '',
          location: actFields.location?.stringValue || '',
        };
      }),
    };
  });
  return itinerary;
}
