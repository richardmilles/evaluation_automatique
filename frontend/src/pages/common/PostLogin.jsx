import { useContext, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const PostLogin = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;                // si pas encore chargé
    if (user.role === 'student') {
      navigate('/student/dashboard', { replace: true });
    } else if (user.role === 'professor') {
      navigate('/professor/dashboard', { replace: true });
    } else {
      navigate('/');                  // rôle inconnu
    }
  }, [user, navigate]);

  return <p className="text-center mt-10">Redirection...</p>;
};

export default PostLogin;
