import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from "react";
import Lobby from './Lobby';
import LandingPage from './LandingPage';
import NotFound from './NotFound';
import { WebRTCProvider } from './WebRTCContext';

const Host = lazy(() => import("./Host"));
const Join = lazy(() => import("./Join"));
const Board = lazy(() => import("./game/Board"));

const RoutesComponents = () => (
  <WebRTCProvider>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
          path="board/:gameId"
          element={
            <Suspense> 
              <Board />
            </Suspense>
          }
      />
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
  </WebRTCProvider>
);

export default RoutesComponents;