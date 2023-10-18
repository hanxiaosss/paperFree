import React, { lazy, Suspense } from "react";
import { useRoutes } from "react-router-dom";

const load = (children: any) => (
  <Suspense fallback={<div></div>}>{children}</Suspense>
);
const BoardApp = lazy(() => import("../board-app"));
export interface RouteConfig {
  path: string;
  element: React.ReactNode;
  auth: boolean;
  children?: RouteConfig[];
  redirect?: string;
}

export const routerList = [
  {
    path: "/",
    element: load(<BoardApp />),
  },
];

const RenderRouter = () => {
  const element = useRoutes(routerList);
  return element;
};
export default RenderRouter;
