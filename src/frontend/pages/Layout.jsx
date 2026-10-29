import { Outlet } from "react-router-dom";
import { Navbar } from "../components/Navbar.jsx";
import { Sidebar } from "../components/Sidebar.jsx";
import { Footer } from "../components/Footer.jsx";
import { Login } from "../components/Login.jsx";
import { Signup } from "../components/Signup.jsx";
import MessageToast from "../components/MessageToast.jsx"; // Importar el componente de notificación
import { RoutineReminderScheduler } from "../components/RoutineReminderScheduler.jsx";

export const Layout = () => {
  return (
    <div className="min-vh-100 d-flex flex-column position-relative">
      <Navbar />
      <Login loginModal="loginModal" />
      <Signup signupModal="signupModal" />

      <main className="flex-grow-1 d-flex flex-column position-relative">
        {/* Mostrar el mensaje global de manera persistente sobre todo el contenido */}
        <MessageToast />
        <RoutineReminderScheduler />
        <Sidebar />
        <div className="flex-grow-1">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
};
