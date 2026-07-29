import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CreateLeadPage() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/leads?create=1', { replace: true });
  }, [navigate]);
  return null;
}
