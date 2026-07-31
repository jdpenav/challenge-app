import ReactDOM from "react-dom/client";
import App from "./App";
import { worker } from "./mocks/browser";

worker
  .start({
    onUnhandledRequest(request, print) {
      if (new URL(request.url).pathname === "/graphql") {
        print.error();
        return;
      }
    },
  })
  .then(() => {
    ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
  });
