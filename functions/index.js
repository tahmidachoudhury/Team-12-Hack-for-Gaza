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


exports.updatePatient = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed: use POST')
  }

  const patientId = req.query.id || req.body.id
  const updateData = req.body

  if (!patientId) {
    return res.status(400).send('Missing patient ID')
  }

  // Don't allow updating the ID field itself
  delete updateData.id

  // Add auto timestamp update if not provided
  if (!updateData.last_record_update) {
    updateData.last_record_update = new Date().toISOString()
  }

  try {
    const docRef = admin.firestore().collection('patients').doc(patientId)
    const doc = await docRef.get()

    if (!doc.exists) {
      return res.status(404).send('Patient not found')
    }

    await docRef.update(updateData)
    res.status(200).json({ message: 'Patient record updated', id: patientId })
  } catch (error) {
    console.error('Error updating patient:', error)
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
