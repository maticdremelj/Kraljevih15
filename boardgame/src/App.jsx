import { BrowserRouter as Router } from 'react-router-dom';
import RoutesComponents from './assets/RoutesComponents';

const App = () => (
  <Router basename="/board-game">
    <RoutesComponents />
  </Router>
);

export default App
