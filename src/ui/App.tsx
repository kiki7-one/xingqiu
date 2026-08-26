import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "./layouts/MainLayout";
import { HomePage } from "./pages/HomePage";
import { RecordPage } from "./pages/RecordPage";
import { PlanPage } from "./pages/PlanPage";
import { DiscoverPage } from "./pages/DiscoverPage";
import { MePage } from "./pages/MePage";
import "./styles/index.css";

export function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <MainLayout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/record/*" element={<RecordPage />} />
          <Route path="/plan/*" element={<PlanPage />} />
          <Route path="/discover/*" element={<DiscoverPage />} />
          <Route path="/me/*" element={<MePage />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}
