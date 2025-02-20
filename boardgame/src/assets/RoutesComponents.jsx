import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Board from './Board';
import Lobby from './Lobby';
import LandingPage from './LandingPage';
import Host from './Host';
import Join from './Join';
import NotFound from './NotFound';

const RoutesComponents = () => (
  <Routes>
    <Route path="/" element={<LandingPage />} />
	  <Route path="/lobby" element={<Lobby />}>
      <Route path="host" element={<Host />} />
      <Route path="join" element={<Join />} />
    </Route>
    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default RoutesComponents