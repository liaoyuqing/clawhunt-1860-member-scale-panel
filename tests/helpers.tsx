import type { ReactElement } from "react";
import { render, type RenderResult } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";

export function LocationProbe({ log }: { log: string[] }) {
  const location = useLocation();
  useEffect(() => {
    log.push(location.pathname + location.search);
  }, [location, log]);
  return null;
}

export interface RenderOptions {
  route?: string;
  log?: string[];
}

export function renderInRouter(ui: ReactElement, options: RenderOptions = {}): RenderResult {
  const route = options.route ?? "/";
  return render(
    <MemoryRouter initialEntries={[route]}>
      {ui}
      <Routes>
        <Route path="*" element={options.log ? <LocationProbe log={options.log} /> : null} />
      </Routes>
    </MemoryRouter>,
  );
}
