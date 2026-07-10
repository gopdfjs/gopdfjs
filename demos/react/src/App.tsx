import { Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import CompressToolPage from "./pages/CompressToolPage";
import GenericToolPage from "./pages/GenericToolPage";
import HomePage from "./pages/HomePage";

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/tools/compress" element={<CompressToolPage />} />
        <Route path="/tools/:toolId" element={<GenericToolPage />} />
      </Route>
    </Routes>
  );
}
