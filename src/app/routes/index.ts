import { homeRoute } from "./home";
import { loginRoute } from "./login";
import { registerRoute } from "./register";
import { sharedTextRoute } from "./shared-text";
import { snippetDetailRoute } from "./snippet-detail";
import { snippetsRoute } from "./snippets";
import { rootRoute } from "./root";

export const routeTree = rootRoute.addChildren([
  homeRoute,
  loginRoute,
  registerRoute,
  snippetsRoute,
  snippetDetailRoute,
  sharedTextRoute,
]);
