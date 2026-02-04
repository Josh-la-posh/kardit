import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Index Page - Redirects to login
 */
const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/login");
  }, [navigate]);

  return null;
};

export default Index;
