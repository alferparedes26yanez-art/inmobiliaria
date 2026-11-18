import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { LogOut, ShieldX } from 'lucide-react';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { AdminLayout } from './components/layout/AdminLayout';
import { Button, Card, EstadoVacio, Skeleton } from './components/ui/basicos';
import { ToastProvider } from './components/ui/Toast';
import { refrescarTodo } from './lib/datos';
import { useCitasNuevas } from './lib/useCitasNuevas';
import Citas from './pages/admin/Citas';
import ClienteDetalle from './pages/admin/ClienteDetalle';
import Clientes from './pages/admin/Clientes';
import Dashboard from './pages/admin/Dashboard';
import Embudo from './pages/admin/Embudo';
import GuiaEstilo from './pages/admin/GuiaEstilo';
import PropiedadForm from './pages/admin/PropiedadForm';
import Propiedades from './pages/admin/Propiedades';
import Mapa from './pages/publico/Mapa';
import Login from './pages/admin/Login';

/** Protege /admin/*: exige sesión y que el usuario exista en usuario_admin. */
function RutaAdmin() {
  const { estado, admin, correoSesion, salir } = useAuth();
  const navegar = useNavigate();
  const { hayNuevas, marcarVistas } = useCitasNuevas(estado === 'admin');

  if (estado === 'cargando') {
    return (
      <div className="mx-auto max-w-5xl space-y-5 p-6">
        <Skeleton className="h-14 rounded-full" />
        <div className="grid gap-5 sm:grid-cols-2">
          <Skeleton className="h-40 rounded-3xl" />
          <Skeleton className="h-40 rounded-3xl" />
        </div>
        <Skeleton className="h-72 rounded-3xl" />
      </div>
    );
  }

  if (estado === 'sin_sesion') return <Navigate to="/admin/login" replace />;

  if (estado === 'no_admin' || !admin) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <EstadoVacio
            icono={ShieldX}
            titulo="Acceso denegado"
            descripcion={`La cuenta ${correoSesion ?? ''} no tiene permisos de administración. Pide a un administrador que te registre.`}
            accion={
              <Button variante="secundario" icono={LogOut} onClick={salir}>
                Cerrar sesión
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <AdminLayout
      admin={admin}
      onSalir={salir}
      onRefrescar={refrescarTodo}
      hayNotificaciones={hayNuevas}
      onNotificaciones={() => {
        marcarVistas();
        navegar('/admin/citas');
      }}
    />
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Mapa />} />
            <Route path="/admin/login" element={<Login />} />
            <Route path="/admin" element={<RutaAdmin />}>
              <Route index element={<Dashboard />} />
              <Route path="propiedades" element={<Propiedades />} />
              <Route path="propiedades/nueva" element={<PropiedadForm />} />
              <Route path="propiedades/:id" element={<PropiedadForm key="editar" />} />
              <Route path="embudo" element={<Embudo />} />
              <Route path="citas" element={<Citas />} />
              <Route path="clientes" element={<Clientes />} />
              <Route path="clientes/:cedula" element={<ClienteDetalle />} />
              <Route path="estilo" element={<GuiaEstilo />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}
