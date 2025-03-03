import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from "react";
import Board from './Board';
import Lobby from './Lobby';
import LandingPage from './LandingPage';
import NotFound from './NotFound';

const Host = lazy(() => import("./Host"));
const Join = lazy(() => import("./Join"));

const RoutesComponents = () => (
  <Routes>
    <Route path="/" element={<LandingPage />} />
	  <Route path="/lobby" element={<Lobby />}>
      <Route 
        path="host" 
        element={
          <Suspense>
            <Host />
          </Suspense>
        } 
      />
      <Route
        path="join"
        element={
          <Suspense>
            <Join />
          </Suspense>
        }
      />
    </Route>
    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default RoutesComponents