import { Outlet } from "react-router-dom";
import { Navbar } from "../components/Navbar.jsx";
import { Sidebar } from "../components/Sidebar.jsx";
import { Footer } from "../components/Footer.jsx";
import { Login } from "../components/Login.jsx";
import { Signup } from "../components/Signup.jsx";
import MessageToast from "../components/MessageToast.jsx"; // Importar el componente de notificación

// Theme imports
import { ThemeProvider } from "styled-components";
import { theme, GlobalStyles } from "../theme/theme.js";

export const Layout = () => {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      <Navbar />
      <Login loginModal="loginModal" />
      <Signup signupModal="signupModal" />

      <main className="d-flex align-items-start">
        {/* Mostrar el mensaje global de manera persistente sobre todo el contenido */}
        <MessageToast />
        <Sidebar />
        <div className="flex-grow-1">
          <Outlet />
        </div>
      </main>
      <Footer />
    </ThemeProvider>
  );
};
