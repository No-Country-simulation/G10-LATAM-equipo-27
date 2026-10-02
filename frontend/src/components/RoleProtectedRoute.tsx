import { Navigate, Outlet } from "react-router-dom";
import { getUser } from "../api/session";

interface RoleProtectedRouteProps {
    allowedRoles: string[];
}

export default function RoleProtectedRoute({
    allowedRoles,
}: RoleProtectedRouteProps) {
    const user = getUser();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (!user.role || !allowedRoles.includes(user.role)) {
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
}