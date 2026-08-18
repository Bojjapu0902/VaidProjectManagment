// The app was built against mock data shaped as {id, ...}. The real API
// returns Mongoose documents shaped as {_id, ...} with no `id`. These give
// every entity from the real API the `id` alias the UI already expects
// (React keys, route params, .find(x => x.id === ...) lookups), without
// touching foreign-key fields (clientId, userId, ...) — those already
// serialize as plain id strings and need no translation.
export const withId = (doc) => (doc && doc._id ? { ...doc, id: doc.id || doc._id } : doc);
export const withIds = (list) => (Array.isArray(list) ? list.map(withId) : list);
