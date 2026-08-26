import { MemoryRouter, type MemoryRouterProps } from "react-router-dom";
import { type ReactNode } from "react";

/**
 * 测试用 Router，已启用 v7 future flags，消除警告
 */
export function TestRouter({
  initialEntries,
  children,
}: {
  initialEntries?: string[];
  children: ReactNode;
}) {
  return (
    <MemoryRouter
      initialEntries={initialEntries ?? ["/"]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      {children}
    </MemoryRouter>
  );
}
