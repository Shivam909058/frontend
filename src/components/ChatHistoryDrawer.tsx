import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { RealtimeChannel } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";

interface ChatSession {
  id: string;
  topic: string;
  last_message_at: string;
  bucket_id: string | null;
  bucket_name?: string;
}

interface ChatHistoryDrawerProps {
  userId: string;
  onSelectSession: (sessionId: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onBucketSelect?: (bucketId: string) => void;
  selectedNewChat?: boolean;
  currentSessionId?: string | null;
  isHistoryPage?: boolean;
}

const ChatHistoryDrawer: React.FC<ChatHistoryDrawerProps> = ({
  userId,
  onSelectSession,
  isOpen,
  onClose,
  onNewChat,
  // onBucketSelect,
  selectedNewChat,
  currentSessionId,
  isHistoryPage,
}) => {
  const navigate = useNavigate();
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [showDropdown, setShowDropdown] = useState<string | null>(null);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newTopicName, setNewTopicName] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{ left: number; top: number } | null>(null);

  useEffect(() => {
    const fetchChatSessions = async () => {
      const { data, error } = await supabase
        .from("chat_sessions")
        .select(
          `
          id,
          topic,
          bucket_id,
          buckets (name),
          chat_messages (
            created_at
          )
        `
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching chat sessions:", error);
      } else {
        const sessionsWithLastMessageDate = data.map((session: any) => ({
          id: session.id,
          topic: session.topic,
          bucket_id: session.bucket_id,
          bucket_name: session.buckets?.name,
          last_message_at:
            session.chat_messages.length > 0
              ? session.chat_messages[session.chat_messages.length - 1]
                  .created_at
              : session.created_at,
        }));
        // Sort the sessions by last_message_at in descending order
        sessionsWithLastMessageDate.sort(
          (a, b) =>
            new Date(b.last_message_at).getTime() -
            new Date(a.last_message_at).getTime()
        );
        setChatSessions(sessionsWithLastMessageDate);
      }
    };

    fetchChatSessions();

    // Subscribe to real-time updates for chat_messages
    const channel: RealtimeChannel = supabase
      .channel("chat_messages_channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
        },
        (payload) => {
          const newMessage = payload.new as { session_id: string };
          updateChatSessionOrder(newMessage.session_id);
          const isNewChat = chatSessions.filter(
            (session) => session.id === newMessage.session_id
          );
          if (isNewChat.length === 0) {
            fetchChatSessions();
          }
        }
      )
      .subscribe();

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (
        showDropdown &&
        !target.closest('.dropdown-menu') &&
        !target.closest('button')
      ) {
        setShowDropdown(null);
      }
      if (
        showRenameModal &&
        !target.closest('.rename-modal')
      ) {
        setShowRenameModal(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      channel.unsubscribe();
    };
  }, [userId, showDropdown, showRenameModal]);

  const updateChatSessionOrder = async (sessionId: string) => {
    const updatedSessions = chatSessions.slice();
    const sessionIndex = updatedSessions.findIndex(
      (session) => session.id === sessionId
    );

    if (sessionIndex !== -1) {
      const [movedSession] = updatedSessions.splice(sessionIndex, 1);
      movedSession.last_message_at = new Date().toISOString();
      updatedSessions.unshift(movedSession);
      setChatSessions(updatedSessions);

      // Update the last_message_at timestamp in the database
      const { error } = await supabase
        .from("chat_sessions")
        .update({ last_message_at: movedSession.last_message_at })
        .eq("id", sessionId);

      if (error) {
        console.error("Error updating chat session timestamp:", error);
      }
    }
  };

  const getBucketColor = (bucketName: string | undefined) => {
    const bucketColors: { [key: string]: string } = {
      "Food and Drinks": "text-[#F95A31]", // Orange
      Work: "text-[#8E52DA]", // Purple
      Education: "text-[#15C839]", // Green
      "Health & Wellness": "text-[#2D9CDB]", // Blue
      Travel: "text-[#deaa0c]", // Yellow
      Lifestyle: "text-[#EB5757]", // Red
      Finance: "text-[#9B51E0]", // Deep Purple
    };

    return bucketName
      ? bucketColors[bucketName] || "text-gray-600"
      : "text-gray-600";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const truncateTopic = (topic: string, maxLength: number = 34) => {
    return topic.length > maxLength ? topic.slice(0, maxLength) + "..." : topic;
  };

  const handleRenameChat = async () => {
    if (selectedSessionId && newTopicName.trim()) {
      const { error } = await supabase
        .from("chat_sessions")
        .update({ topic: newTopicName.trim() })
        .eq("id", selectedSessionId);

      if (error) {
        console.error("Error renaming chat:", error);
      } else {
        setChatSessions((prevSessions) =>
          prevSessions.map((session) =>
            session.id === selectedSessionId
              ? { ...session, topic: newTopicName.trim() }
              : session
          )
        );
        setShowRenameModal(false);
        setNewTopicName("");
        setSelectedSessionId(null);
      }
    }
  };

  const handleSessionClick = async (sessionId: string) => {
    if (sessionId) {
      if (isHistoryPage) {
        navigate(`/chat?sessionId=${sessionId}`, {
          replace: true,
          state: { fromHistory: true }
        });
      } else {
        window.history.replaceState(null, '', `/chat?sessionId=${sessionId}`);
        onSelectSession(sessionId);
        onClose();
      }
    } else {
      console.error("Invalid session ID");
    }
  };

  const handleDeleteChat = async () => {
    if (selectedSessionId) {
      const { error } = await supabase
        .from("chat_sessions")
        .delete()
        .eq("id", selectedSessionId);

      if (error) {
        console.error("Error deleting chat session:", error);
      } else {
        setChatSessions((prevSessions) =>
          prevSessions.filter((session) => session.id !== selectedSessionId)
        );
        setShowDeleteModal(false);
        setSelectedSessionId(null);
      }
    }
  };

  const handleDropdownToggle = (e: React.MouseEvent, sessionId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (showDropdown === sessionId) {
      setShowDropdown(null);
      setDropdownPosition(null);
    } else {
      setShowDropdown(sessionId);
      setDropdownPosition({
        left: e.currentTarget.getBoundingClientRect().right - 192,
        top: e.currentTarget.getBoundingClientRect().top
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 pb-0">
        <div className="flex justify-between items-center border-y-[1px] border-[#e0e0e0] py-3 -mx-4 md:-mx-6">
          <h1 className="text-start flex-1 font-semibold text-[22px] text-[rgb(51,51,51)] font-lexend pl-4 lg:pl-2 md:pl-6">
            Recent conversations
          </h1>
          <div
            className="mr-4 lg:hidden cursor-pointer"
            onClick={() => {
              onNewChat();
              onClose();
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
            >
              <path
                d="M1.8 18H12.6V16.2H1.8V5.40002H0V16.2C0 17.1927 0.8073 18 1.8 18Z"
                fill="black"
              />
              <path
                d="M16.2 0H5.40001C4.40731 0 3.60001 0.8073 3.60001 1.8V12.6C3.60001 13.5927 4.40731 14.4 5.40001 14.4H16.2C17.1927 14.4 18 13.5927 18 12.6V1.8C18 0.8073 17.1927 0 16.2 0ZM14.4 8.1H11.7V10.8H9.90001V8.1H7.20001V6.3H9.90001V3.6H11.7V6.3H14.4V8.1Z"
                fill="black"
              />
            </svg>
          </div>
        </div>
      </div>
      <ul className="chat-list flex-1 overflow-y-auto">
        {chatSessions.map((session, index) => (
          <li
            key={session.id}
            className={`cursor-pointer p-4 rounded my-1 ${
              index !== chatSessions.length - 1 ? 'border-b-[1px]' : ''
            } lg:border-0 border-[#e0e0e0] font-lexend font-medium relative ${
              (currentSessionId === session.id || (selectedNewChat && session.topic === "New Chat")) ? 'bg-gray-50' : 'hover:bg-gray-50'
            }`}
            onClick={() => handleSessionClick(session.id)}
          >
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <span className={` flex-grow`}>
                  {truncateTopic(session.topic, 30)}
                </span>
                {session.bucket_name && (
                  <span
                    className={`text-xs ${getBucketColor(
                      session.bucket_name
                    )} mt-1`}
                  >
                    {session.bucket_name}
                  </span>
                )}
              </div>
              <div className="relative w-6 h-6">
                <button
                  className="w-full h-full flex rotate-90 lg:rotate-0 items-center justify-center"
                  onClick={(e) => handleDropdownToggle(e, session.id)}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <svg width="3" height="15" viewBox="0 0 3 15" fill="none">
                    <circle cx="1.5" cy="1.5" r="1.5" fill="#222222" />
                    <circle cx="1.5" cy="7.5" r="1.5" fill="#222222" />
                    <circle cx="1.5" cy="13.5" r="1.5" fill="#222222" />
                  </svg>
                </button>
                {showDropdown === session.id && (
                  <div 
                    className="fixed w-48 bg-white rounded-md shadow-lg z-50 dropdown-menu"
                    style={{
                      left: `${dropdownPosition?.left}px`,
                      top: `${dropdownPosition?.top}px`
                    }}
                  >
                    <button
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-b-[1px] border-[#e0e0e0]"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSessionId(session.id);
                        setShowRenameModal(true);
                        setShowDropdown(null);
                      }}
                    >
                      <div className="flex items-center justify-start">
                        <svg
                          width="18"
                          height="16"
                          viewBox="0 0 12 13"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M10.8 3.24402H10.2V4.44402H10.8V9.24402H10.2V10.444H10.8C11.4618 10.444 12 9.90582 12 9.24402V4.44402C12 3.78282 11.4612 3.24402 10.8 3.24402ZM2.40001 5.64402H7.79701V8.04402H2.40001V5.64402Z"
                            fill="#5D5D5D"
                          />
                          <path
                            d="M9 10.4439V2.04692H10.797V0.846924H5.997V2.04692H7.8V3.24392H1.2C0.5382 3.24392 0 3.78212 0 4.44392V9.24392C0 9.90572 0.5382 10.4439 1.2 10.4439H7.8V11.6469H5.997V12.8469H10.797V11.6469H9V10.4439ZM1.2 9.24392V4.44392H7.8V9.24392H1.2Z"
                            fill="#5D5D5D"
                          />
                        </svg>
                        <span className="ml-2">Rename</span>
                      </div>
                    </button>
                    {/* <button
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-b-[1px] border-[#e0e0e0]"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (session.bucket_id) {
                          onBucketSelect?.(session.bucket_id);
                        }
                        onNewChat();
                        onClose();
                        setShowDropdown(null);
                      }}
                    >
                      <div className="flex items-center justify-start">
                        <svg
                          width="18"
                          height="16"
                          viewBox="0 0 18 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className={getBucketColor(session.bucket_name)}
                        >
                          <path
                            d="M1.61118 15.3092H10.7967V13.7783H1.61118V4.59277H0.0802612V13.7783C0.0802612 14.6226 0.766876 15.3092 1.61118 15.3092Z"
                            fill="currentColor"
                          />
                          <path
                            d="M13.8584 0H4.67288C3.82858 0 3.14197 0.686615 3.14197 1.53091V10.7164C3.14197 11.5607 3.82858 12.2473 4.67288 12.2473H13.8584C14.7027 12.2473 15.3893 11.5607 15.3893 10.7164V1.53091C15.3893 0.686615 14.7027 0 13.8584 0ZM12.3275 6.88911H10.0311V9.18548H8.50017V6.88911H6.2038V5.3582H8.50017V3.06183H10.0311V5.3582H12.3275V6.88911Z"
                            fill="currentColor"
                          />
                        </svg>
                        <span
                          className={`${getBucketColor(
                            session.bucket_name
                          )} ml-2`}
                        >
                          New{" "}
                          <span
                            className={`${getBucketColor(session.bucket_name)}`}
                          >
                            {session.bucket_name}
                          </span>{" "}
                          Chat
                        </span>
                      </div>
                    </button> */}
                    <button
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSessionId(session.id);
                        setShowDeleteModal(true);
                        setShowDropdown(null);
                      }}
                    >
                      <div className="flex items-center justify-start">
                        <svg
                          width="18"
                          height="16"
                          viewBox="0 0 12 15"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M2 3.68209H1.33333V12.6566C1.33333 13.0228 1.47381 13.374 1.72386 13.6329C1.97391 13.8918 2.31304 14.0373 2.66667 14.0373H9.33333C9.68696 14.0373 10.0261 13.8918 10.2761 13.6329C10.5262 13.374 10.6667 13.0228 10.6667 12.6566V3.68209H2ZM4.66667 11.9663H3.33333V5.75313H4.66667V11.9663ZM8.66667 11.9663H7.33333V5.75313H8.66667V11.9663ZM9.07867 1.61104L8 0.230347H4L2.92133 1.61104H0V2.99174H12V1.61104H9.07867Z"
                            fill="#FF6969"
                          />
                        </svg>
                        <span className="ml-2 text-[#FF6969]">Delete Chat</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
            <span className="text-xs text-gray-500 flex items-center mt-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="11"
                height="11"
                viewBox="0 0 11 11"
                fill="none"
              >
                <path
                  d="M5.5 0C2.4673 0 0 2.4673 0 5.5C0 8.5327 2.4673 11 5.5 11C8.5327 11 11 8.5327 11 5.5C11 2.4673 8.5327 0 5.5 0ZM5.5 9.9C3.07395 9.9 1.1 7.92605 1.1 5.5C1.1 3.07395 3.07395 1.1 5.5 1.1C7.92605 1.1 9.9 3.07395 9.9 5.5C9.9 7.92605 7.92605 9.9 5.5 9.9Z"
                  fill="#B4B4B4"
                />
                <path
                  d="M6.05 2.75H4.95V5.7277L6.76115 7.53885L7.53885 6.76115L6.05 5.2723V2.75Z"
                  fill="#B4B4B4"
                />
              </svg>
              <p className="text-[#B4B4B4] text-[10px] ml-2">
                {formatDate(session.last_message_at)}
              </p>
            </span>
          </li>
        ))}
        {chatSessions.length === 0 && (
          <li className="text-center text-gray-500 p-4 font-lexend h-full flex items-center justify-center mt-[300px]">
            No recent conversations
          </li>
        )}
      </ul>
      {showRenameModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center font-lexend z-50">
          <div className="bg-white p-3 rounded-lg rename-modal">
            <h2 className="text-xl mb-4">Rename Chat</h2>
            <input
              type="text"
              value={newTopicName}
              onChange={(e) => setNewTopicName(e.target.value)}
              className="w-full border-[1px] border-gray-300 rounded px-3 py-2 mb-4"
              placeholder="New topic name"
            />
            <div className="flex justify-end">
              <button
                onClick={handleRenameChat}
                className="bg-[#fef2ea] text-black font-bold p-2 rounded-md focus:outline-none"
              >
                <div className="flex items-center">
                  <p className=" text-[12px] text-[#F87631] mr-2">Rename</p>
                  <svg
                    width="13"
                    height="12"
                    viewBox="0 0 13 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      id="Vector"
                      d="M12.2845 5.39678L0.95116 0.0634447C0.837037 0.00974487 0.710023 -0.01048 0.584866 0.00511857C0.459709 0.0207172 0.341544 0.0714993 0.244093 0.151568C0.146643 0.231637 0.0739048 0.337707 0.0343255 0.457461C-0.00525383 0.577215 -0.0100504 0.70574 0.0204929 0.828111L0.828493 4.06078L6.00049 6.00011L0.828493 7.93944L0.0204929 11.1721C-0.0106251 11.2946 -0.00622883 11.4234 0.0331674 11.5434C0.0725636 11.6635 0.145331 11.7698 0.242957 11.85C0.340584 11.9303 0.459032 11.981 0.584448 11.9964C0.709864 12.0117 0.837061 11.9911 0.95116 11.9368L12.2845 6.60344C12.399 6.54961 12.4959 6.46428 12.5637 6.35744C12.6315 6.2506 12.6676 6.12666 12.6676 6.00011C12.6676 5.87356 12.6315 5.74962 12.5637 5.64278C12.4959 5.53594 12.399 5.45062 12.2845 5.39678Z"
                      fill="#F87631"
                    />
                  </svg>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 font-lexend">
          <div className="bg-white p-6 rounded-lg">
            <h2 className="text-xl mb-4 font-bold">Delete Chat</h2>
            <p className="mb-4">Are you sure you want to delete this chat?</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteChat}
                className="px-4 py-2 bg-red-500 text-white rounded-md"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatHistoryDrawer;
