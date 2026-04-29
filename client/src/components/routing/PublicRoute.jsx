import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';

export default function PublicRoute() {
  const token = useSelector((state) => state.auth.token);
  return token ? <Navigate to="/dashboard" replace /> : <Outlet />;
}
