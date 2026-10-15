import { Navigate, Outlet } from "react-router-dom";
import { isAuthenticated } from "../api/session";

export default function ProtectedRoute() {
    if (!isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}