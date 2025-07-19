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
const patients = [
  {
    id: 374927,
    name: "John Doe",
    DOB: "1985-04-12",
    address: "123 Maple Street, Springfield, IL 62704",
    phone_number: "+1-312-555-0178",
    number_of_previous_visits: 5,
    number_of_previous_admissions: 2,
    date_of_last_admission: "2024-12-05",
    patient_notes:
      "Patient has a history of hypertension. Last visit was for routine check-up. No major complaints.",
    last_record_update: "2025-06-15T10:30:00Z",
  },
  {
    id: 378465,
    name: "Maria Gonzales",
    DOB: "1990-09-28",
    address: "789 Elm Avenue, Dallas, TX 75201",
    phone_number: "+1-972-555-0345",
    number_of_previous_visits: 12,
    number_of_previous_admissions: 1,
    date_of_last_admission: "2023-11-21",
    patient_notes:
      "Diagnosed with Type 2 Diabetes. Monitoring blood sugar levels. Prescribed Metformin.",
    last_record_update: "2025-07-01T14:15:00Z",
  },
  {
    id: 274920,
    name: "Samuel Lee",
    DOB: "1978-02-06",
    address: "456 Oak Blvd, San Francisco, CA 94102",
    phone_number: "+1-415-555-0890",
    number_of_previous_visits: 9,
    number_of_previous_admissions: 3,
    date_of_last_admission: "2025-03-18",
    patient_notes:
      "Patient recovering from knee surgery. Attending physical therapy sessions. Healing as expected.",
    last_record_update: "2025-07-18T09:45:00Z",
  },
]

// functions/index.js
const functions = require("firebase-functions")

/**
 * Dummy endpoint:
 * GET https://<region>-<project-id>.cloudfunctions.net/getPatient
 * Always returns the same mock patient record.
 */
exports.getPatient = functions.https.onRequest((_req, res) => {
  res.json(patients)
  //   res.json({
  //     id: "123",
  //     name: "Ahmed",
  //     allergy: "Penicillin",
  //   })
})

exports.partialSearchPatientName = functions.https.onRequest((_req, res) => {
  const filteredPatients = patients.filter((patient) =>
    patient.name.startsWith(_req.query.name)
  )
  console.log(JSON.stringify(filteredPatients))
  res.json(filteredPatients)
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
