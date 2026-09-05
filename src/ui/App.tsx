import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useStore } from "../core/store/useStore";
import { MainLayout } from "./layouts/MainLayout";
import { HomePage } from "./pages/HomePage";
import { RecordPage } from "./pages/RecordPage";
import { PlanPage } from "./pages/PlanPage";
import { InsightsPage } from "./pages/InsightsPage";
import { QuotesPage } from "./pages/QuotesPage";
import { FlowersPage } from "./pages/FlowersPage";
import { MePage } from "./pages/MePage";
import "./styles/index.css";

export function App() {
  // 启动时从数据层加载数据（浏览器 localStorage / Node 文件）
  useEffect(() => {
    useStore.getState().load();
  }, []);

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
          <Route path="/insights" element={<InsightsPage />} />
          <Route path="/insights/quotes" element={<QuotesPage />} />
          <Route path="/insights/flowers" element={<FlowersPage />} />
          <Route path="/me/*" element={<MePage />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}
