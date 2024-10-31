import "./App.css";
import { Route, Routes, BrowserRouter as Router } from "react-router-dom";
import { useEffect, useState } from "react";

import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Sidebar from "./components/Sidebar";
import Calender from "./components/Calender";
import Company from "./components/Company";
import MyAvailabilities from "./components/MyAvailabilities";
import Admin from "./components/Admin";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const user = sessionStorage.getItem("user");
    setIsAuthenticated(!!user); // Set isAuthenticated to true if user is found
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("user");
    setIsAuthenticated(false); // Update isAuthenticated to false on logout
  };

  return (
    <>
      <Router>
        <div className="App flex dark gap-0">
          {isAuthenticated && <Sidebar handleLogout={handleLogout} />}
          <Routes>
            <Route
              path="/"
              element={<Login setIsAuthenticated={setIsAuthenticated} />}
            />
            <Route
              path="/Dashboard"
              element={<Dashboard setIsAuthenticated={setIsAuthenticated} />}
            />
            <Route
              path="/Calender"
              element={<Calender setIsAuthenticated={setIsAuthenticated} />}
            />
            <Route
              path="/MyAvailabilities"
              element={
                <MyAvailabilities setIsAuthenticated={setIsAuthenticated} />
              }
            />
            <Route
              path="/Company"
              element={<Company setIsAuthenticated={setIsAuthenticated} />}
            />
            <Route
              path="/Admin"
              element={<Admin setIsAuthenticated={setIsAuthenticated} />}
            />
          </Routes>
        </div>
      </Router>
    </>
  );
}

export default App;
