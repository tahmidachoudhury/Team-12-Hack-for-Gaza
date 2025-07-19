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

const admin = require("firebase-admin")
const functions = require("firebase-functions")
if (!admin.apps.length) {
  admin.initializeApp()
}

const db = admin.firestore()

//api endpoint is https://partialsearchusingpatientname-uob3euoulq-uc.a.run.app
// using POST method, you need name as a parameter, or part of a name (case sensitive)
// it will return all patients with the name starting with the parameter you entered
exports.partialSearchUsingPatientName = functions.https.onRequest(
  async (req, res) => {
    const queryName = req.query.name

    if (!queryName) {
      return res.status(400).json({ error: "Missing name query parameter" })
    }

    try {
      // Firestore doesn't support native `startsWith`, so we use range queries
      const start = queryName
      const end = queryName + "\uf8ff" // highest UTF-8 char

      const snapshot = await db
        .collection("patients")
        .where("name", ">=", start)
        .where("name", "<=", end)
        .get()

      const results = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      console.log(JSON.stringify(results))
      res.json(results)
    } catch (err) {
      console.error("Error searching patients:", err)
      res.status(500).json({ error: "Internal Server Error" })
    }
  }
)
//-------------------------------------------------------------------------------------

// api endpoint is https://getpatientwithid-uob3euoulq-uc.a.run.app
// using POST method, you need patient id as a paramter
// it will return the full patient object with the id
exports.getPatientWithID = functions.https.onRequest(async (req, res) => {
  try {
    const id = req.query.id

    if (!id) {
      return res.status(400).json({ error: "Missing patient ID" })
    }

    const doc = await db.collection("patients").doc(id).get()

    if (!doc.exists) {
      return res.status(404).json({ error: "Patient not found" })
    }

    res.json({ id: doc.id, ...doc.data() })
  } catch (err) {
    console.error("Error fetching patient:", err)
    res.status(500).json({ error: "Internal Server Error" })
  }
})
//-------------------------------------------------------------------------------------

// api endpoint is https://updatepatient-uob3euoulq-uc.a.run.app/
// using POST method, you need patient id as a paramter
// the body of the request should be the patient object with whatever properties you
// want to update

exports.updatePatient = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed: use POST")
  }

  const patientId = req.query.id || req.body.id
  const updateData = req.body

  if (!patientId) {
    return res.status(400).send("Missing patient ID")
  }

  // Don't allow updating the ID field itself
  delete updateData.id

  // Add auto timestamp update if not provided
  if (!updateData.last_record_update) {
    updateData.last_record_update = new Date().toISOString()
  }

  try {
    const docRef = admin.firestore().collection("patients").doc(patientId)
    const doc = await docRef.get()

    if (!doc.exists) {
      return res.status(404).send("Patient not found")
    }

    await docRef.update(updateData)
    res.status(200).json({ message: "Patient record updated", id: patientId })
  } catch (error) {
    console.error("Error updating patient:", error)
    res.status(500).send("Internal Server Error")
  }
})
//-------------------------------------------------------------------------------------

// api endpoint is https://addpatient-uob3euoulq-uc.a.run.app
// using POST method, you need a minimum of 3 parameters: "id" (6 digits), "name", "DOB"
// the body of the request should follow this format: optional to fill everything
// const newPatient = {
//   id,
//   name,
//   DOB: dob,
//   gender: "" || "Unknown",
//   blood_type: "" || "Unknown",
//   address: "" || null,
//   phone_number: "" || null,
//   allergies: [""] || [],
//   chronic_conditions: [""] || [],
//   current_medications: [{}] || [],
//   do_not_resuscitate: "" false,
//   number_of_previous_visits: int || 0,
//   number_of_previous_admissions: int || 0,
//   date_of_last_admission: "" || null,
//   last_diagnosis: "" || "",
//   notes: "" || "",
//   last_record_update: "" || new Date().toISOString(),
// }

exports.addPatient = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed: use POST")
  }

  const {
    id,
    name,
    dob,
    gender,
    blood_type,
    address,
    phone_number,
    allergies,
    chronic_conditions,
    current_medications,
    do_not_resuscitate,
    number_of_previous_visits,
    number_of_previous_admissions,
    date_of_last_admission,
    last_diagnosis,
    patient_notes,
    last_record_update,
  } = req.body

  if (!id || !name || !dob) {
    return res
      .status(400)
      .send('Missing required fields: "id", "name", and "dob"')
  }

  try {
    const newPatient = {
      id,
      name,
      DOB: dob,
      gender: req.body.gender || "Unknown",
      blood_type: req.body.blood_type || "Unknown",
      address: address || null,
      phone_number: phone_number || null,
      allergies: req.body.allergies || [],
      chronic_conditions: req.body.chronic_conditions || [],
      current_medications: req.body.current_medications || [],
      do_not_resuscitate: req.body.do_not_resuscitate || false,
      number_of_previous_visits: number_of_previous_visits || 0,
      number_of_previous_admissions: number_of_previous_admissions || 0,
      date_of_last_admission: req.body.date_of_last_admission || null,
      last_diagnosis: req.body.last_diagnosis || "",
      notes: patient_notes || "",
      last_record_update: last_record_update || new Date().toISOString(),
    }

    const docRef = admin.firestore().collection("patients").doc(String(id))
    await docRef.set(newPatient)

    res
      .status(201)
      .json({ message: "Patient added successfully", id: docRef.id })
  } catch (error) {
    console.error("Error adding patient:", error)
    res.status(500).send("Internal Server Error")
  }
})
//-------------------------------------------------------------------------------------

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
