import { Route, Routes } from "react-router-dom";
import { SiteLayout } from "./components/SiteLayout";
import { Home } from "./pages/Home";
import { InfoPage } from "./pages/InfoPage";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Dashboard } from "./pages/Dashboard";
import { AddPatient } from "./pages/AddPatient";

export default function App() {
  return <Routes>
    <Route element={<SiteLayout />}>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<InfoPage title="About the research" type="about" />} />
      <Route path="/facilities" element={<InfoPage title="Platform facilities" type="facilities" />} />
      <Route path="/contact" element={<InfoPage title="Contact the research team" type="contact" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/patients/new" element={<AddPatient />} />
    </Route>
  </Routes>;
}
