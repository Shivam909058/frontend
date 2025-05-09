import React from "react";
import ChatHistoryDrawer from "../components/ChatHistoryDrawer";
import Header from "../components/header/Header";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const ChatHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [userDetails, setUserDetails] = React.useState<{ id: string } | null>(null);

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  React.useEffect(() => {
    const fetchUserDetails = async () => {
      const token = localStorage.getItem(`${import.meta.env.VITE_TOKEN_ID}`);
      const parsedToken = token ? JSON.parse(token) : null;
      const userEmail = parsedToken?.user.email;

      if (userEmail) {
        const { data, error } = await supabase.from("users").select("id").eq("email", userEmail).single();

        if (error) {
          console.error("Error fetching user details:", error);
        } else {
          setUserDetails(data);
        }
      }
    };

    fetchUserDetails();
  }, []);

  const handleSelectSession = (sessionId: string) => {
    navigate(`/chat?sessionId=${sessionId}`);
  };

  const handleNewChat = () => {
    navigate("/chat");
  };

  return (
    <div className="h-auto w-screen mx-auto flex flex-col bg-white text-ui-90 relative">
      <div className="flex flex-col h-full">
        <div className="fixed top-0 left-0 right-0 z-50 bg-white">
            <Header />
        </div>
        <div className="container mx-auto">
          <div className="flex-1 overflow-hidden mt-20 mb-20">
            {userDetails && (
              <ChatHistoryDrawer userId={userDetails.id} onSelectSession={handleSelectSession} isOpen={true} onClose={() => {}} onNewChat={handleNewChat} isHistoryPage={true} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatHistoryPage;
