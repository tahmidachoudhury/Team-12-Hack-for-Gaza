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



exports.searchPatientsByNameAndDOB = functions.https.onRequest(async (req, res) => {
  const name = req.query.name
  const dob = req.query.dob

  if (!name || !dob) {
    return res.status(400).send('Missing "name" or "dob" query parameters')
  }

  try {
    const snapshot = await admin.firestore().collection('patients')
      .where('name', '==', name)
      .where('dob', '==', dob)
      .get()

    if (snapshot.empty) {
      return res.status(404).send('No matching patients found')
    }

    const patients = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    res.status(200).json(patients)
  } catch (error) {
    console.error("Error querying patients:", error)
    res.status(500).send(error.message)
  }
})


exports.addPatient = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed: use POST')
  }

  const {
    id,
    name,
    dob,
    address,
    phone_number,
    number_of_previous_visits,
    number_of_previous_admissions,
    patient_notes,
    last_record_update,
  } = req.body

  // Basic validation
  if (!name || !dob) {
    return res.status(400).send('Missing required fields: "name" and "dob"')
  }

  try {
    const newPatient = {
      id,
      name,
      dob,
      address: address || null,
      phone_number: phone_number || null,
      number_of_previous_visits: number_of_previous_visits || 0,
      number_of_previous_admissions: number_of_previous_admissions || 0,
      patient_notes: patient_notes || '',
      last_record_update: last_record_update || new Date().toISOString(),
    }

    const docRef = await admin.firestore().collection('patients').add(newPatient)
    res.status(201).json({ message: 'Patient added successfully', id: docRef.id })
  } catch (error) {
    console.error('Error adding patient:', error)
    res.status(500).send('Internal Server Error')
  }
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
