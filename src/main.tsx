import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import { App } from "./App"
import { M3eProvider } from "@/components/m3e/m3e-provider"
import { TooltipProvider } from "@/components/m3e/tooltip"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <M3eProvider
      colorMode={{ toggleKey: false }}
      theme={{
        defaultTheme: { source: { primary: "#1F6E5C" }, variant: "expressive" },
      }}
    >
      <TooltipProvider delay={200}>
        <App />
      </TooltipProvider>
    </M3eProvider>
  </StrictMode>
)
