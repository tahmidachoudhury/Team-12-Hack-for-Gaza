const admin = require("firebase-admin")
const fs = require("fs")

// Path to your downloaded service account key
const serviceAccount = require("../../serviceAccount.json")

// Path to your patients JSON file
const patients = JSON.parse(fs.readFileSync("./patients.json", "utf8"))

// Initialise Firebase Admin SDK with your key
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: "team-12-dd",
  })
}

const db = admin.firestore()

// Seed Firestore with patients
async function seedPatients() {
  const batch = db.batch() // For efficiency
  const collection = db.collection("patients")

  patients.forEach((patient) => {
    const docRef = collection.doc(String(patient.id)) // use patient.id as document ID
    batch.set(docRef, {
      ...patient,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    })
  })

  await batch.commit()
  console.log(`✅ ${patients.length} patients seeded to Firestore!`)
  process.exit(0)
}

seedPatients().catch((err) => {
  console.error("❌ Failed to seed:", err)
  process.exit(1)
})
