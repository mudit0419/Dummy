import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import HomePage from "./components/HomePage";
import PatientProfile from './components/PatientProfile';
import DoctorProfile from './components/DoctorProfile';
import { useEffect, useState } from "react";

import FileUpload from "./components/FileUpload.jsx";
import AIAssistant from "./components/AiAssistant";
import Explore from "./components/Explore";
import AboutUsSection from "./components/AboutUs";
import Footer from "./components/Footer";
import FAQ from "./components/Faq.jsx";
import Navbar from "./components/Navbar";
//import DoctorDashboard from "./components/DoctorDashboard";
import Dashboard from "./components/Dashboard";
//import PatientDashboard from "./components/PatientDashboard";
import PatientRegistration from "./components/PatientRegistration.jsx";
import DoctorRegistration from "./components/DoctorRegistration.jsx";
// import ProfilePage from './components/ProfilePage';
// import UserAvatar from "./components/UserAvatar.jsx";
import AddPatient from "./components/AddPatient.jsx"
import Register from "./components/Register.jsx";
import Login from "./components/Login.jsx";
import UserProfile from "./components/UserProfile";
import UserGuidedFlow from "./components/UserGuidedFlow.jsx";   
import Description from "./components/Description.jsx";


function App() {  

  const [isLoggedIn, setIsLoggedIn] = useState(false);
const [userData, setUserData] = useState(null); // Store full user

const handleLogin = (status, email, user) => {
  setIsLoggedIn(status);
  setUserData(user);
};

const handleLogout = () => {
  // Clear token or session data if stored (optional)
  localStorage.removeItem("authToken"); // if you stored token
  localStorage.removeItem("user"); // if you stored user data

  // Reset state
  setIsLoggedIn(false);
  setUserData(null);
};


  return (
    <BrowserRouter>
      {/* Navbar appears on every page */}
      {/* <Navbar isLoggedIn={isLoggedIn} userEmail={userEmail} onLogout={handleLogout} /> */}
      {/* <Navbar/> */}
      <Navbar isLoggedIn={isLoggedIn} user={userData} onLogout={handleLogout} />

      <Routes>
        <Route path="/" element={<HomePage />} />
        {/* //<Route path="/login" element={<Login onLogin={handleLogin} />} /> */}
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/about" element={<AboutUsSection />} />
        <Route path="/footer" element={<Footer />} />
        <Route path="/description" element={<Description />} />
        <Route path="/user-guided-flow" element={<UserGuidedFlow />} />
       
        <Route path="/faq" element={<FAQ />} />
        <Route path="/portal" element={<FileUpload />} />
        <Route path="/image-analysis" element={<AIAssistant />} />
        <Route path="/history" element={<AIAssistant />} />
        
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/doctor-dashboard" element={<UserProfile isLoggedIn={isLoggedIn} user={userData} onLogout={handleLogout} />} />
        <Route path="/patient-dashboard" element={<UserProfile isLoggedIn={isLoggedIn} user={userData} onLogout={handleLogout} />} />
        <Route path="/patient-registration" element={<PatientRegistration />} />
        <Route path="/doctor-registration" element={<DoctorRegistration />} />
        <Route path="/add-patient" element={<AddPatient/>}/>
        {/* <Route path="/profile" element={<ProfilePage />} />
        <Route path="/UserAvatar" element={<UserAvatar />} /> */}
        <Route
          path="/profile"
          element={<UserProfile isLoggedIn={isLoggedIn} user={userData} onLogout={handleLogout} />}
        />
        <Route path="/patient/profile/:id" element={<PatientProfile />} />
        <Route path="/doctor/profile/:id" element={<DoctorProfile />} />

      </Routes>
      
    </BrowserRouter>
  );
}

export default App;
