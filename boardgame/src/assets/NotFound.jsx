import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const NotFound = () => { 
  const navigate = useNavigate();
  useEffect(() => {
    setTimeout(() => {
      navigate('/'); 
    }, 1000);
  }, [navigate]);

  return (
    <div className="flex items-start justify-center h-screen">
      <div className="mt-[33vh] text-center">
        <h1>404 - Page Not Found</h1>
        Redirecting ...
      </div>
    </div>
  );
};

export default NotFound;