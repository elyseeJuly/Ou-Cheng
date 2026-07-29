import React, { Suspense, lazy } from 'react';
import { HashRouter as Router, Navigate, Routes, Route, useParams } from 'react-router-dom';
import Layout from './components/Layout';
import UpdatePrompt from './components/UpdatePrompt';

const Library = lazy(() => import('./pages/Library'));
const Create = lazy(() => import('./pages/Create'));
const Works = lazy(() => import('./pages/Works'));
const Settings = lazy(() => import('./pages/Settings'));
const CipaiGallery = lazy(() => import('./pages/CipaiGallery'));
const CipaiDetail = lazy(() => import('./pages/CipaiDetail'));
const Preview = lazy(() => import('./pages/Preview'));

const CipaiComposeRedirect: React.FC = () => {
  const { variantId } = useParams();
  return <Navigate replace to={`/?cipai=${encodeURIComponent(variantId || '')}`} />;
};

const JintiComposeRedirect: React.FC = () => {
  const { variant } = useParams();
  return <Navigate replace to={`/?jinti=${encodeURIComponent(variant || '')}`} />;
};

const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Suspense fallback={<div className="route-loading">正在展卷……</div>}>
          <Routes>
            <Route path="/" element={<Create />} />
            <Route path="/works" element={<Works />} />
            <Route path="/classics" element={<Library />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/cipai" element={<CipaiGallery />} />
            <Route path="/cipai/:variantId" element={<CipaiDetail />} />
            <Route path="/compose/cipai/:variantId" element={<CipaiComposeRedirect />} />
            <Route path="/compose/jinti/:variant" element={<JintiComposeRedirect />} />
            <Route path="/preview/:poemId" element={<Preview />} />
            <Route path="*" element={<Navigate replace to="/" />} />
          </Routes>
        </Suspense>
      </Layout>
      {!(typeof window !== 'undefined' && window.Capacitor?.isNativePlatform()) && <UpdatePrompt />}
    </Router>
  );
};

export default App;
