import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Home } from "./pages/Home";
import { HostRoom } from "./pages/HostRoom";
import { ViewerRoom } from "./pages/ViewerRoom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/host/:roomId" element={<HostRoom />} />
        <Route path="/viewer/:roomId" element={<ViewerRoom />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
