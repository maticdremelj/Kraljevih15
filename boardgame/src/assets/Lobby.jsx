import { Outlet } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

const Lobby = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-start justify-center h-screen">
      <div className="mt-[33vh] text-center">
        <h1>Lobby</h1>
        <div className="flex flex-col">
          <button
            onClick={() => navigate('join')}
            className="border-2"
          >
            Join
          </button>
          <button
            onClick={() => navigate('host')}
            className="border-2"
          >
            Host
          </button>
        </div>
        <Outlet />
      </div>
    </div>
  );
};

export default Lobby;