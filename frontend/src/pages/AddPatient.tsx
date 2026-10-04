import { FormEvent, useState } from "react";
import { UploadCloud } from "lucide-react";
import { createPatient, createPrediction } from "../services/api";

export function AddPatient() {
  const [file, setFile] = useState<File | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) return;
    setError("");
    setNotice("");

    const f = new FormData(e.currentTarget);

    try {
      const patient = await createPatient({
        patientId: f.get("patientId") as string,
        name: f.get("name") as string,
        age: Number(f.get("age")),
        gender: f.get("gender") as string,
        address: f.get("address") as string,
        contact: f.get("contact") as string,
      });

      const image = new FormData();
      image.append("patient_id", patient.id.toString());
      image.append("image", file);

      const prediction = await createPrediction(patient.id, file);
      setNotice(`Analysis complete: ${prediction.predicted_class} (${(prediction.confidence * 100).toFixed(1)}% confidence).`);
      e.currentTarget.reset();
      setFile(null);
    } catch {
      setError("The patient record or analysis could not be completed. Check that the API is running and the models are available.");
    }
  }

  return (
    <section className="section narrow">
      <p className="eyebrow">PATIENT INTAKE</p>
      <h1>Add patient and test image</h1>
      <form className="form panel" onSubmit={submit}>
        {notice && <p className="notice">{notice}</p>}
        {error && <p className="error">{error}</p>}
        <div className="two-columns">
          <label>Patient ID<input name="patientId" required /></label>
          <label>Patient name<input name="name" required /></label>
          <label>Age<input name="age" type="number" min="0" required /></label>
          <label>Gender<select name="gender" required><option value="">Select</option><option>Female</option><option>Male</option><option>Other</option></select></label>
        </div>
        <label>Address<textarea name="address" required rows={3} /></label>
        <label>Contact number<input name="contact" required /></label>
        <label className="dropzone">
          <UploadCloud />
          <span>{file ? file.name : "Choose a JPG, JPEG, or PNG testing image"}</span>
          <input type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" onChange={e => setFile(e.target.files?.[0] ?? null)} />
        </label>
        <button className="button" type="submit">Analyze</button>
      </form>
    </section>
  );
}