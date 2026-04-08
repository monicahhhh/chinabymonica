import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import Home from "./pages/Home";
import About from "./pages/About";
import Insights from "./pages/Insights";
import Connect from "./pages/Connect";
import ArticleDetail from "./pages/ArticleDetail";
import AdminArticles from "./pages/AdminArticles";
import AdminLogin from "./pages/AdminLogin";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { useEffect } from "react";
import { useLocation } from "wouter";

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location]);
  return null;
}
function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      {/* English routes */}
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/insights" component={Insights} />
      <Route path="/insights/:id" component={ArticleDetail} />
      <Route path="/connect" component={Connect} />

      {/* Chinese routes under /cn */}
      <Route path="/cn" component={Home} />
      <Route path="/cn/about" component={About} />
      <Route path="/cn/insights" component={Insights} />
      <Route path="/cn/insights/:id" component={ArticleDetail} />
      <Route path="/cn/connect" component={Connect} />

      {/* Admin routes */}
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/articles" component={AdminArticles} />

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <ScrollToTop />
            <Navbar />
            <main className="min-h-screen">
              <Router />
            </main>
            <Footer />
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
