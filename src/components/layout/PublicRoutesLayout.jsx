import Loading from "@components/Loading";
import { Link, Outlet } from "react-router-dom";

const PublicRoutesLayout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-r from-blue-500 to-purple-600">
      {/* Header */}
      <header className="h-fit text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="w-28 bg-white flex items-center justify-center rounded-2xl"> 
            <img src="/Images/genwriteLogo.png" alt="Genwrite logo" className="object-contain pl-1.5" />
          </div>
          <nav className="space-x-4">
            <Link to="/login" className="hover:underline">
              Login
            </Link>
            <Link to="/signup" className="hover:underline">
              Sign Up
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-100 text-center py-4">
        &copy; Genwrite 2025 —{" "}
        <Link to="/privacy" className="hover:underline">
          Privacy
        </Link>{" "}
        &nbsp;|&nbsp;
        <Link to="/terms" className="hover:underline">
          Terms
        </Link>
      </footer>
    </div>
  );
};

export default PublicRoutesLayout;
