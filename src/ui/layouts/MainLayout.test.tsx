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
            <Route path="/discover" element={<div>Discover Content</div>} />
            <Route path="/me" element={<div>Me Content</div>} />
          </Routes>
        </MainLayout>
      </TestRouter>
    );
  }

  it("渲染 5 个底部 Tab", () => {
    renderWithRouter();
    expect(screen.getByText("首页")).toBeInTheDocument();
    expect(screen.getByText("记录")).toBeInTheDocument();
    expect(screen.getByText("计划")).toBeInTheDocument();
    expect(screen.getByText("发现")).toBeInTheDocument();
    expect(screen.getByText("我的")).toBeInTheDocument();
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

  it("发现路由渲染发现内容", () => {
    renderWithRouter("/discover");
    expect(screen.getByText("Discover Content")).toBeInTheDocument();
  });

  it("我的路由渲染我的内容", () => {
    renderWithRouter("/me");
    expect(screen.getByText("Me Content")).toBeInTheDocument();
  });
});
