import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-start justify-center  h-screen">
      <div className="mt-[33vh] text-center">
        <h1>Landing Page</h1>
        <button
          onClick={() => navigate('/lobby')}
          className="border-2"
        >
          Go to Lobby
        </button>
      </div>
    </div>
  );
};

export default LandingPage;