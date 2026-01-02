import { useEffect } from "react";
import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";
import { App as CapacitorApp } from "@capacitor/app";
import { Home } from "./pages/Home";
import { HostRoom } from "./pages/HostRoom";
import { ViewerRoom } from "./pages/ViewerRoom";

function AppUrlListener() {
  const navigate = useNavigate();
  useEffect(() => {
    CapacitorApp.addListener("appUrlOpen", (data) => {
      // Example: https://stream-wing.vercel.app/viewer/xyz
      // slug = /viewer/xyz
      const slug = data.url.split(".vercel.app").pop();
      if (slug) {
        navigate(slug);
      }
    });
  }, [navigate]);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <AppUrlListener />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/host/:roomId" element={<HostRoom />} />
        <Route path="/viewer/:roomId" element={<ViewerRoom />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
