import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import RenderRouter from "./router";
import React from "react";

const rootElement = document.getElementById("root")!;
const root = createRoot(rootElement);

root.render(
  <BrowserRouter>
    <RenderRouter />
  </BrowserRouter>,
);
