import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'

import MainLayout from './layouts/MainLayout'

import Dashboard from './pages/Dashboard'
import Messages from './pages/Messages'
import Highlights from './pages/Highlights'
import Analytics from './pages/Analytics'
import ContentStudio from './pages/ContentStudio'
import Approvals from './pages/Approvals'
import Audit from './pages/Audit'
import Security from './pages/Security'
import Settings from './pages/Settings'
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleProtectedRoute from "./components/RoleProtectedRoute";
import Hashtags from "./pages/Hashtags";
import Audience from "./pages/Audience";
import Calendar from "./pages/Calendar";
import Export from "./pages/Export";
import MyReports from "./pages/MyReports";
import OCIStorage from "./pages/OCIStorage";


function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Ruta pública: sin Sidebar */}
        <Route path="/login" element={<Login />} />

        {/* Área privada de la aplicación */}
        <Route
          path="/*"
          element={
            <MainLayout>
              <Routes>

                {/* Rutas protegidas: cualquier usuario autenticado */}
                <Route element={<ProtectedRoute />}>

                  {/* Dashboard e Ingesta: todos los usuarios autenticados */}
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/messages" element={<Messages />} />

                  {/* Módulos de análisis: administrador y revisor */}
                  <Route
                    element={
                      <RoleProtectedRoute
                        allowedRoles={["admin", "reviewer"]}
                      />
                    }
                  >
                    <Route path="/highlights" element={<Highlights />} />
                    <Route path="/hashtags" element={<Hashtags />} />
                    <Route path="/audience" element={<Audience />} />
                    
                    <Route path="/calendar" element={<Calendar />} />
                    <Route path="/export" element={<Export />} />
                    <Route path="/my-reports" element={<MyReports />} />
                  </Route>

                  {/* Análisis */}
                  <Route
                    element={
                      <RoleProtectedRoute
                        allowedRoles={["admin", "reviewer", "community_manager"]}
                      />
                    }
                  >
                    <Route path="/analytics" element={<Analytics />} />
                  </Route>

                  {/* Otros módulos de análisis: administrador y revisor */}
                  <Route
                    element={
                      <RoleProtectedRoute
                        allowedRoles={["admin", "reviewer"]}
                      />
                    }
                  >
                    <Route path="/highlights" element={<Highlights />} />
                    <Route path="/hashtags" element={<Hashtags />} />
                    <Route path="/audience" element={<Audience />} />
                    <Route path="/calendar" element={<Calendar />} />
                    <Route path="/export" element={<Export />} />
                    <Route path="/my-reports" element={<MyReports />} />
                  </Route>



                  {/* Flujo de contenidos */}
                  <Route
                    element={
                      <RoleProtectedRoute
                        allowedRoles={["admin", "reviewer", "community_manager"]}
                      />
                    }
                  >
                    <Route path="/content" element={<ContentStudio />} />
                    <Route path="/approvals" element={<Approvals />} />
                  </Route>
                  

                  {/* Flujo de contenidos */}
                  <Route
                    element={
                      <RoleProtectedRoute
                        allowedRoles={["admin", "reviewer", "community_manager"]}
                      />
                    }
                  >
                    <Route path="/content" element={<ContentStudio />} />
                    <Route path="/approvals" element={<Approvals />} />
                  </Route>

                  {/* Solo administrador */}
                  {/* Informes y Almacenamiento */}
                  <Route
                    element={
                      <RoleProtectedRoute
                        allowedRoles={["admin", "community_manager"]}
                      />
                    }
                  >
                    <Route path="/oci-storage" element={<OCIStorage />} />
                  </Route>

                  {/* Solo administrador */}
                  <Route
                    element={
                      <RoleProtectedRoute allowedRoles={["admin"]} />
                    }
                  >
                    <Route path="/audit" element={<Audit />} />
                    <Route path="/security" element={<Security />} />
                    <Route path="/settings" element={<Settings />} />
                  </Route>

                  <Route
                    path="*"
                    element={<Navigate to="/dashboard" replace />}
                  />

                </Route>

              </Routes>
            </MainLayout>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;