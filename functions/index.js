/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { setGlobalOptions } = require("firebase-functions")
const { onRequest } = require("firebase-functions/https")
const logger = require("firebase-functions/logger")

// functions/index.js
const functions = require("firebase-functions")

/**
 * Dummy endpoint:
 * GET https://<region>-<project-id>.cloudfunctions.net/getPatient
 * Always returns the same mock patient record.
 */
exports.getPatient = functions.https.onRequest((_req, res) => {
  res.json({
    id: "123",
    name: "Ahmed",
    allergy: "Penicillin",
  })
})

/**
 * Another example endpoint:
 * GET https://<region>-<project-id>.cloudfunctions.net/listPatients
 * Returns an array of two hard-coded patients.
 */
exports.listPatients = functions.https.onRequest((_req, res) => {
  res.json([
    { id: "123", name: "Ahmed", allergy: "Penicillin" },
    { id: "456", name: "Fatima", allergy: "None" },
  ])
})

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 })

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
