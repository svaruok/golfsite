import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import CharityDirectory from "./pages/CharityDirectory";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import { useAuth } from "./_core/hooks/useAuth";

function ProtectedRoute({
  component: Component,
  requiredRole,
}: {
  component: any;
  requiredRole?: string;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <NotFound />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <NotFound />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/charities"} component={CharityDirectory} />
      <Route
        path={"/dashboard"}
        component={() => <ProtectedRoute component={Dashboard} />}
      />
      <Route
        path={"/admin"}
        component={() => (
          <ProtectedRoute component={AdminDashboard} requiredRole="admin" />
        )}
      />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
