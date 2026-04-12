import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Library from './pages/Library';
import Create from './pages/Create';
import Works from './pages/Works'; // Added Works

const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Create />} />
          <Route path="/works" element={<Works />} />
          <Route path="/classics" element={<Library />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
