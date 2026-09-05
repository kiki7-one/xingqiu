import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Routes, Route } from "react-router-dom";
import { TestRouter } from "../../test/TestRouter";
import { MainLayout } from "../layouts/MainLayout";

describe("MainLayout", () => {
  function renderWithRouter(initialPath: string = "/") {
    return render(
      <TestRouter initialEntries={[initialPath]}>
        <MainLayout>
          <Routes>
            <Route path="/" element={<div>Home Content</div>} />
            <Route path="/record" element={<div>Record Content</div>} />
            <Route path="/plan" element={<div>Plan Content</div>} />
            <Route path="/plan/todos" element={<div>Todos Content</div>} />
            <Route path="/insights" element={<div>Insights Content</div>} />
            <Route path="/me" element={<div>Me Content</div>} />
          </Routes>
        </MainLayout>
      </TestRouter>
    );
  }

  it("渲染 5 个底部 Tab", () => {
    renderWithRouter();
    expect(screen.getByText("首页")).toBeInTheDocument();
    expect(screen.getByText("计划")).toBeInTheDocument();
    expect(screen.getByText("记录")).toBeInTheDocument();
    expect(screen.getByText("洞察")).toBeInTheDocument();
    expect(screen.getByText("我的")).toBeInTheDocument();
  });

  it("记录 tab 直接展示文案", () => {
    renderWithRouter();
    const recordTab = screen.getByText("记录");
    expect(recordTab).toBeInTheDocument();
  });

  it("首页路由渲染首页内容", () => {
    renderWithRouter("/");
    expect(screen.getByText("Home Content")).toBeInTheDocument();
  });

  it("记录路由渲染记录内容", () => {
    renderWithRouter("/record");
    expect(screen.getByText("Record Content")).toBeInTheDocument();
  });

  it("计划路由渲染计划内容", () => {
    renderWithRouter("/plan");
    expect(screen.getByText("Plan Content")).toBeInTheDocument();
  });

  it("计划 tab 直达待办页", () => {
    renderWithRouter("/plan/todos");
    expect(screen.getByText("Todos Content")).toBeInTheDocument();
  });

  it("洞察路由渲染洞察内容", () => {
    renderWithRouter("/insights");
    expect(screen.getByText("Insights Content")).toBeInTheDocument();
  });

  it("我的路由渲染我的内容", () => {
    renderWithRouter("/me");
    expect(screen.getByText("Me Content")).toBeInTheDocument();
  });
});
