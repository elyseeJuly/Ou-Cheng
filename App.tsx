import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Library from './pages/Library';
import Create from './pages/Create';
import Chat from './pages/Chat';
import Imagine from './pages/Imagine';

const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Library />} />
          <Route path="/create" element={<Create />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/imagine" element={<Imagine />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
