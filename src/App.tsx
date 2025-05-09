import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { TanstackQueryProvider } from "./providers/TanstackQueryProvider";
import HomePage from "./pages/HomePage";
// import SingUpPage from "./pages/SignUpPage";
// import { VerificationInProcessPage } from "./pages/VerificationInProcessPage";
import TermsAndServices from "./pages/TermsAndServices";
import PrivacyPolicy from "./pages/PrivacyPolicies";
import AboutUs from "./pages/AboutUs";
import ProfileCreationPage from "./pages/ProfileCreationPage";
import FeedPage from "./pages/FeedPage";
// import FollowersPage from "./pages/FollowersPage";
// import ActivityPage from "./pages/ActivityPage";
// import ExplorePage from "./pages/ExplorePage";
// import NotificationPage from "./pages/NotificationPage";
// import CreatePostPage from "./pages/CreatePostPage";
import ChatPage from './pages/ChatPage';
import ChatHistoryPage from './pages/ChatHistoryPage';
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem(`${import.meta.env.VITE_TOKEN_ID}`);
  const parsedToken = token ? JSON.parse(token) : null;
  const isAuthenticated = parsedToken?.user?.email;
  return isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
};

export default function App() {
  return (
    <TanstackQueryProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          {/* <Route path="/signup" element={<SingUpPage />} />
          <Route
            path="/verification-in-process"
            element={<VerificationInProcessPage />}
          /> */}
          <Route path="/tos" element={<TermsAndServices />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/shared-chat" element={<ChatPage />} />
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfileCreationPage />
            </ProtectedRoute>
          } />
          <Route path="/:userId" element={
            <ProtectedRoute>
              <FeedPage />
            </ProtectedRoute>
          } />
          <Route path="/chat" element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          } />
          <Route path="/chat-history" element={
            <ProtectedRoute>
              <ChatHistoryPage />
            </ProtectedRoute>
          } />
          {/* <Route path="/followers/:id" element={<FollowersPage />} /> */}
          {/* <Route path="/activities" element={<ActivityPage />} /> */}
          {/* <Route path="/notifications" element={<NotificationPage />} /> */}
          {/* <Route path="/explore" element={<ExplorePage />} /> */}
          {/* <Route path="/create" element={<CreatePostPage />} /> */}
          <Route path="/:username/:shareId" element={<ChatPage />} />
        </Routes>
        
      </Router>
    </TanstackQueryProvider>
  );
}
