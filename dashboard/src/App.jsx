import { Routes, Route, Link } from "react-router-dom";
import Landing from "./pages/Landing.jsx";
import StudentPage from "./pages/StudentPage.jsx";

function NotFound() {
  return (
    <main className="landing">
      <div className="card landing-card">
        <h1>Page not found</h1>
        <p className="tagline">
          That page doesn't exist — check the address and try again.
        </p>
        <Link to="/">← Back to the landing page</Link>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/student/:studentId" element={<StudentPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
