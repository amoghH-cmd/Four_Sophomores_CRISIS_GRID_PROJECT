import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './views/Login';
import AdminDashboard from './views/AdminDashboard';
import NGODashboard from './views/NGODashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/ngo" element={<NGODashboard />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
