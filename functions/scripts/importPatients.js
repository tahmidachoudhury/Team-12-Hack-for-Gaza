// functions/scripts/importPatients.js  (now valid ESM)
import admin from "firebase-admin"
import fs from "fs"
import { createRequire } from "module"
const require = createRequire(import.meta.url) // to load JSON

const serviceAccount = require("../../serviceAccount.json")

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: "team-12-dd",
  })
}

const db = admin.firestore()
const patients = JSON.parse(
  fs.readFileSync(new URL("./patients.json", import.meta.url), "utf8")
)

const chunkSize = 500

async function seedPatients() {
  try {
    for (let i = 0; i < patients.length; i += chunkSize) {
      const batch = db.batch()

      patients.slice(i, i + chunkSize).forEach((p) => {
        const ref = db.collection("patients").doc(String(p.id))
        batch.set(ref, p)
      })

      await batch.commit()
      console.log(
        `Imported ${Math.min(i + chunkSize, patients.length)} / ${
          patients.length
        }`
      )
    }
    console.log("✅  Import complete")
    process.exit(0)
  } catch (err) {
    console.error("❌ Import failed:", err)
    process.exit(1)
  }
}

seedPatients()
