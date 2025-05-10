import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import ChatHistoryDrawer from "../components/ChatHistoryDrawer";
import Header from "../components/header/Header";
import { Markdown } from "../components/Markdown";
import { truncateTopic, adjustTextareaHeight } from "../utils/chatUtils.tsx";
import { cn } from "@/utils/index.ts";
import CreatePostDrawer from '../modules/feed/components/CreatePostDrawer';
import LoginButton from "../components/shakty_homepage_components/LoginButton";
// Import the apiClient from our services
import { apiClient } from '../services/api';
import { chatWithShakty, saveChatMessage } from '../services/api';
import { checkSourceStatus } from '../services/api';

// Helper function to get access token from localStorage

const mediaQuery = window.matchMedia("(min-width: 768px)");

const ChatPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userDetails, setUserDetails] = useState<{
    id: string;
    name: string;
    location: string;
    profile_picture_url: string;
  } | null>(null);
  const token = localStorage.getItem(`${import.meta.env.VITE_TOKEN_ID}`);
  const parsedToken = token ? JSON.parse(token) : null;
  const userEmail = parsedToken?.user?.email;
  const userId = parsedToken?.user?.id;
  const [isSharedView, setIsSharedView] = useState(false);
  const [chatTopic, setChatTopic] = useState<string>("New Chat");
  const [showDrawer, setShowDrawer] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  // const [isBucketSelected, setIsBucketSelected] = useState(false);
  const [showChatInput, setShowChatInput] = useState(false);
  const [currentBucket, setCurrentBucket] = useState<Bucket | null>(null);
  const [bucketPrompt, setBucketPrompt] = useState<string>("");
  const [bucketSources, setBucketSources] = useState<string[]>([]);
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [showCopiedTooltip, setShowCopiedTooltip] = useState(false);
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [hasStartedChat, setHasStartedChat] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newTopicName, setNewTopicName] = useState("");
  const [selectedNewChat, setSelectedNewChat] = useState(false);
  const [showCreateShaktyModal, setShowCreateShaktyModal] = useState(false);
  const [showCopied, setShowCopied] = useState(false); // Add this state
  const [creatorName, setCreatorName] = useState<string>("");
  // console.log(bucketPrompt);
  // console.log(bucketSources);
  const [messages, setMessages] = useState<{ role: string; content: string; isLoading?: boolean }[]>(
    [
      {
        role: "user",
        content: ` 
        Chatbot Context:
        ${bucketPrompt}

        Sources:
        ${bucketSources.join("\n")}
      `,
      },
    ]
  );

  interface Bucket {
    id: string;
    name: string;
    prompt: string;
    bio: string;
    by_shakty: boolean;
    shakty_dp: string | null;
    character_name: string;
    created_by: string;
    isPublic: boolean;
    creator_name?: string;
    share_id?: string;
    is_verified: boolean;
  }

  // Update the state definition


  // Add fetch function for bucket data
  const fetchBucketData = async (bucketId: string) => {
    try {
      // Fetch bucket prompt
      const { data: promptData, error: promptError } = await supabase
        .from("buckets")
        .select("prompt")
        .eq("id", bucketId)
        .single();

      if (promptError) throw promptError;
      setBucketPrompt(promptData?.prompt || "");

      // Fetch bucket sources with both columns
      const { data: sourcesData, error: sourcesError } = await supabase
        .from("sources")
        .select("source_message, scraped_content")
        .eq("bucket_id", bucketId);

      if (sourcesError) throw sourcesError;

      // Combine message and scraped content for each source
      setBucketSources(
        sourcesData?.map((source) =>
          source.scraped_content
            ? `${source.source_message}\n\n{,Website content,}:\n${source.scraped_content}`
            : source.source_message
        ) || []
      );

      return {
        systemPrompt: promptData?.prompt || "",
        bucketPrompt: promptData?.prompt || "",
        sources: sourcesData?.map((source) => source.source_message) || [],
      };
    } catch (error) {
      console.error("Error fetching bucket data:", error);
      return { systemPrompt: "", bucketPrompt: "", sources: [] };
    }
  };

  const handleBucketSelect = async (bucket: any) => {
    // Navigate to the share URL if the bucket has a share_id
    if (bucket.share_id) {
      navigate(`/${bucket.share_id}`);
      return;
    }

    setCurrentBucket(bucket);
    if (bucket) {
      await fetchBucketData(bucket.id);
    }
    handleNewChat();
  };

  useEffect(() => {
    const fetchBuckets = async () => {
      // Update your bucket fetching query to include creator name and filter for verified buckets
      const { data: bucketsData, error: bucketsError } = await supabase
        .from("buckets")
        .select(`
          *,
          users:created_by (
            name
          )
        `)
        .eq('is_verified', true); // Only fetch verified buckets

      if (bucketsError) {
        console.error("Error fetching buckets:", bucketsError);
        return;
      }

      // Transform the data to include creator_name
      const transformedBuckets = bucketsData?.map((bucket) => ({
        ...bucket,
        creator_name: bucket.users?.name,
      }));

      setBuckets(transformedBuckets || []);
    };

    fetchBuckets();
  }, []);



  const fetchUserDetails = async (email: string) => {
    const { data, error } = await supabase
      .from("users")
      .select("id, name,location, profile_picture_url")
      .eq("email", email)
      .single();

    if (error) {
      console.error("Error fetching user details:", error);
      return null;
    }

    return data;
  };

  useEffect(() => {
    const loadUserDetails = async () => {
      const details = await fetchUserDetails(userEmail);
      setUserDetails(details);
      if (details) {
        setMessages((prevMessages) => [
          {
            ...prevMessages[0],
            content: prevMessages[0].content
              .replace("Name: Unknown", `Name: ${details.name || "Unknown"}`)
              .replace(
                "Location: Unknown",
                `Location: ${details.location || "Unknown"}`
              ),
          },
          ...prevMessages.slice(1),
        ]);
      }
    };
    loadUserDetails();
  }, [userEmail]);

  const handleNewChat = useCallback(() => {
    // Clear the URL parameters by navigating to /chat
    navigate("/chat", { replace: true });
    window.location.reload();

    setCurrentSessionId(null);
    setShowChatInput(false);
    setHasStartedChat(false);
    setSelectedNewChat(true);
    setMessages([
      {
        role: "user",
        content: `
     
        Chatbot Context:
        ${bucketPrompt}

        Sources:
        ${bucketSources.join("\n")}
      `,
      },
    ]);
    setChatTopic("New Chat");
  }, [
    userDetails,
    bucketPrompt,
    bucketSources,
    navigate,
    currentBucket,
  ]); // Add navigate to dependencies

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sharedSessionId = urlParams.get("sessionId");
    if (sharedSessionId) {
      // Check if the current path is /shared-chat
      const isSharedChatPath = window.location.pathname === "/shared-chat";
      setIsSharedView(isSharedChatPath);
      handleSelectSession(sharedSessionId);
    }
  }, []);

  // Add this state near your other state declarations
  

  const handleShareChat = async () => {
    if (currentSessionId) {
      const shareUrl = `${window.location.origin}/shared-chat?sessionId=${currentSessionId}`;
      const shareData = {
        title: "ShaktyAI",
        url: shareUrl,
      };

      // Check if it's mobile (has share capability) and not desktop
      if (
        navigator.share &&
        navigator.canShare(shareData) &&
        window.innerWidth < 768
      ) {
        try {
          await navigator.share(shareData);
          console.log("Chat shared successfully");
        } catch (err) {
          console.error("Error sharing chat:", err);
        }
      } else {
        // Desktop behavior - copy to clipboard with feedback
        try {
          await navigator.clipboard.writeText(shareUrl);
          setShowCopiedTooltip(true);
          setTimeout(() => setShowCopiedTooltip(false), 2000); // Hide after 2 seconds
        } catch (err) {
          console.error("Failed to copy text:", err);
        }
      }
    }
  };

  // Add this new function near the top of the component

  // Define checkAndRefreshToken first
  
  // Then define handleSessionCreation

  // Move this function up before fetchAndProcessAIResponse
  const createChatSession = async (bucketId: string | null | undefined, topic: string) => {
    try {
      console.log(`Creating new chat session for bucket: ${bucketId}, topic: ${topic}`);
      
      const response = await apiClient.post(
        `/api/chat/session/create`,
        null,
        {
          params: {
            bucket_id: bucketId,
            topic: topic
          }
        }
      );
      
      if (response.data && response.data.session_id) {
        console.log(`Created new session: ${response.data.session_id}`);
        return response.data;
      }
      return { session_id: null };
    } catch (error) {
      console.error("Failed to create chat session:", error);
      return { session_id: null };
    }
  };

  // Now define fetchAndProcessAIResponse which uses createChatSession
  const fetchAndProcessAIResponse = useCallback(async (question: string, sessionId: string | null = null) => {
    setIsLoading(true);
    
    try {
      console.log(`Sending chat question about: ${question.substring(0, 50)}...`);
      
      // Use currentBucket?.id as the fallback is safest
      const bucketIdToUse = currentBucket?.id;
      
      if (!bucketIdToUse) {
        throw new Error("No bucket selected");
      }
      
      // Check if any sources are processed yet
      const sourceStatus = await checkSourceStatus(bucketIdToUse);
      
      if (sourceStatus.total_sources === 0) {
        // No sources added yet
        setMessages((prev) => [
          ...prev,
          { 
            role: "llm", 
            content: "I don't have any sources to work with yet. Please add some content like web pages, YouTube videos, or text documents so I can provide informed answers." 
          }
        ]);
        setIsLoading(false);
        return {
          text: "I don't have any sources to work with yet. Please add some content first.",
          sources: [],
          sessionId: sessionId
        };
      }
      
      if (sourceStatus.status_summary?.success === 0 && 
          (sourceStatus.status_summary?.processing > 0 || sourceStatus.status_summary?.pending > 0)) {
        // Sources are still processing
        setMessages((prev) => [
          ...prev,
          { 
            role: "llm", 
            content: "Your sources are still being processed. Please wait a moment before asking questions, or add more sources if you're asking about something specific." 
          }
        ]);
        setIsLoading(false);
        return {
          text: "Your sources are still being processed. Please wait a moment.",
          sources: [],
          sessionId: sessionId
        };
      }
      
      // Create a new session if needed
      let newSessionId = sessionId;
      if (!sessionId) {
        try {
          // If the API returns an object with session_id
          const session = await createChatSession(bucketIdToUse, "Chat session");
          
          // Make sure you're extracting just the session_id string
          newSessionId = session.session_id; // or session.id, depending on your API response
          console.log(`Created new session: ${newSessionId}`);
        } catch (error) {
          console.error("Error creating chat session:", error);
        }
      }
      
      // Get chat history (previous messages for context)
      const chatHistory: [string, string][] = messages
        .filter(msg => msg.role !== "user" || msg.content !== messages[0].content)
        .map(msg => [msg.role === "user" ? "Human" : "AI", msg.content] as [string, string]);
      
      // Send the request to the AI
      const aiResponse = await chatWithShakty(
        bucketIdToUse,
        question,
        chatHistory.slice(-4) // Use last 4 exchanges for context
      );
      
      console.log("Raw AI response:", aiResponse);
      
      // Extract the response text and sources
      let responseText = '';
      let sourceDocs = [];
      
      if (aiResponse && aiResponse.answer) {
        responseText = aiResponse.answer;
        sourceDocs = aiResponse.sources || [];
        console.log(`Retrieved ${sourceDocs.length} sources with the AI response`);
      } else if (aiResponse && aiResponse.message) {
        responseText = aiResponse.message;
      } else {
        responseText = "I'm having trouble retrieving information. Please try again.";
      }
      
      // Add the AI response to messages
        setMessages((prev) => [
        ...prev,
        { role: "llm", content: responseText }
      ]);
      
      // Save messages to the chat session
      if (newSessionId) {
        try {
          // Make sure we're passing a string, not an object
          const sessionIdToUse = typeof newSessionId === 'string'
            ? newSessionId
            : (newSessionId && 'id' in newSessionId ? (newSessionId as { id: string }).id : String(newSessionId));
          
          await saveChatMessage(sessionIdToUse, question, 'user');
          await saveChatMessage(sessionIdToUse, responseText, 'llm');
          console.log(`Stored messages in session: ${sessionIdToUse}`);
          
          // Update current session ID
          setCurrentSessionId(sessionIdToUse);
        } catch (error) {
          console.error("Error saving chat messages:", error);
        }
      }
      
      return {
        text: responseText,
        sources: sourceDocs,
        sessionId: newSessionId
      };
    } catch (error) {
      console.error("Error fetching AI response:", error);
      
      // Add error message to the chat
          setMessages((prev) => [
        ...prev,
        { role: "llm", content: "Sorry, I encountered an error while processing your request. Please try again." }
      ]);
      
      return {
        text: "Sorry, I encountered an error while processing your request. Please try again.",
        sources: [],
        sessionId: sessionId
      };
    } finally {
      setIsLoading(false);
    }
  }, [currentBucket, messages, checkSourceStatus, saveChatMessage, createChatSession, chatWithShakty]);

  // Update the fetchWithRetry function

  // Update the handleSubmit function
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!input.trim() || isLoading) return;

      const userMessage = input.trim();
      setInput('');
      
      // Add user message to the UI
      setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
      
      // Make sure we have a session ID as a string
      let sessionIdToUse = currentSessionId;
      if (typeof sessionIdToUse === 'object' && sessionIdToUse !== null && 'id' in sessionIdToUse) {
        sessionIdToUse = (sessionIdToUse as { id: string }).id;
      } else {
        sessionIdToUse = String(sessionIdToUse);
      }
      
      try {
        // Save user message
        if (sessionIdToUse) {
          await saveChatMessage(sessionIdToUse, userMessage, 'user');
        }
        
        // Process the message and get AI response
        await fetchAndProcessAIResponse(userMessage, sessionIdToUse);
      } catch (error) {
        console.error("Error in chat submission:", error);
        setMessages(prev => [...prev, { role: 'llm', content: "Sorry, I encountered an error. Please try again." }]);
      }
    },
    [input, isLoading, currentSessionId, fetchAndProcessAIResponse]
  );

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleDropdown = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDropdown(!showDropdown);
  };

  const handleSelectSession = async (sessionId: string) => {
    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from("chat_sessions")
        .select(`
          topic,
          bucket_id,
          user_id,
          buckets:buckets (
            id,
            name,
            prompt,
            bio,
            by_shakty,
            shakty_dp,
            created_by,
            character_name,
            isPublic,
            is_verified
          )
        `)
        .eq("id", sessionId)
        .single<{
          topic: string;
          bucket_id: string;
          user_id: string;
          buckets: {
            id: string;
            name: string;
            prompt: string;
            bio: string;
            by_shakty: boolean;
            shakty_dp: string | null;
            created_by: string;
            character_name: string;
            isPublic: boolean;
            is_verified: boolean;
          };
        }>();

      if (sessionError) {
        console.error("Error fetching chat session:", sessionError);
        return;
      }

      if (sessionData) {
        setChatTopic(sessionData.topic || "New Chat");
        setCurrentSessionId(sessionId); // Add this line
        setShowChatInput(true); // Add this line
        setHasStartedChat(true); // Add this line

        // Set the bucket information if available
        if (sessionData.bucket_id && sessionData.buckets) {
          const bucket = {
            id: sessionData.buckets.id,
            name: sessionData.buckets.name,
            prompt: sessionData.buckets.prompt,
            bio: sessionData.buckets.bio,
            by_shakty: sessionData.buckets.by_shakty,
            shakty_dp: sessionData.buckets.shakty_dp,
            created_by: sessionData.buckets.created_by,
            character_name: sessionData.buckets.character_name,
            isPublic: sessionData.buckets.isPublic,
            is_verified: sessionData.buckets.is_verified,
          };
          
          setCurrentBucket(bucket);
          await fetchBucketData(sessionData.buckets.id);
        }

        // Fetch messages for the session
        const { data: messagesData, error: messagesError } = await supabase
          .from("chat_messages")
          .select("*")
          .eq("session_id", sessionId)
          .order("created_at", { ascending: true });

        if (messagesError) {
          console.error("Error fetching chat messages:", messagesError);
          return;
        }

        setMessages([
          {
            role: "user",
            content: `
            Chatbot Context:
            ${bucketPrompt}

            Sources:
            ${bucketSources.join("\n")}
            `,
          },
          ...messagesData.map((msg) => ({
            role: msg.sender === "user" ? "user" : "llm",
            content: msg.message,
          })),
        ]);
      }
    } catch (error) {
      console.error("Error in handleSelectSession:", error);
    }
  };

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    adjustTextareaHeight(textareaRef);
  }, [input]);

  const handleDeleteChat = async () => {
    if (currentSessionId) {
      const { error } = await supabase
        .from("chat_sessions")
        .delete()
        .eq("id", currentSessionId);

      if (error) {
        console.error("Error deleting chat session:", error);
      } else {
        handleNewChat();
        setShowDeleteModal(false);
        setShowDropdown(false);
      }
    }
  };

  const handleReadMore = (event: any) => {
    event.preventDefault();
    const target = event.target as HTMLAnchorElement;
    target.closest(".chat-card")?.classList.remove("readmore");
  };

  const readMoreConfig = {
    userMobile: 100,
    userDesktop: 200,
    llmMobile: 250,
    llmDesktop: 500,
  };
  const isShowReadMore = (role: string, content: string) => {
    // Extract content up to the specified delimiter and remove HTML tags
    const cleanedContent = content
      .split("{,Website content,}")[0]
      .replace(/<\/[^>]+(>|$)/g, "")
      .trim();

    // Determine whether desktop or mobile limits should be applied
    const isDesktop = mediaQuery.matches;

    // Set the maximum length based on role and device type
    const maxLength =
      role === "llm"
        ? isDesktop
          ? readMoreConfig.llmDesktop
          : readMoreConfig.llmMobile
        : isDesktop
        ? readMoreConfig.userDesktop
        : readMoreConfig.userMobile;

    // Determine if "Read More" should be shown
    // console.log(cleanedContent.length, maxLength);
    return cleanedContent.length > maxLength;
  };

  useEffect(() => {
    const selectedBucketId = location.state?.selectedBucketId;

    if (selectedBucketId && buckets.length > 0) {
      const selectedBucket = buckets.find((b) => b.id === selectedBucketId);
      if (selectedBucket) {
        setCurrentBucket(selectedBucket);
        fetchBucketData(selectedBucket.id);
        handleNewChat();
      }
    }
  }, [buckets, location.state]);

  // Add a new state to track if conversation has started
  

  // Add a new state to track if user has sent their first message
  // const [hasFirstMessage, setHasFirstMessage] = useState(false);

  const handleBucketSelectFromHistory = async (bucketId: string) => {
    const selectedBucket = buckets.find((b) => b.id === bucketId);
    if (selectedBucket) {
      await handleBucketSelect(selectedBucket);
      setShowChatInput(true);
    }
  };

  // Update the useEffect for real-time updates
  useEffect(() => {
    if (!currentBucket?.id) return;

    const channel = supabase
      .channel("public:sources")
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to all events
          schema: "public",
          table: "sources",
          filter: `bucket_id=eq.${currentBucket.id}`,
        },
        async (payload) => {
          // Check if the event is either INSERT or UPDATE
          if (
            payload.eventType === "INSERT" ||
            payload.eventType === "UPDATE"
          ) {
            // Fetch latest sources with both columns
            const { data: sourcesData, error: sourcesError } = await supabase
              .from("sources")
              .select("source_message, scraped_content")
              .eq("bucket_id", currentBucket.id);

            if (sourcesError) {
              console.error("Error fetching updated sources:", sourcesError);
              return;
            }

            // Map sources to include both message and scraped content
            setBucketSources(
              sourcesData?.map((source) =>
                source.scraped_content
                  ? `${source.source_message}\n\n{,Website content,}:\n${source.scraped_content}`
                  : source.source_message
              ) || []
            );

            // Update the messages with combined sources
            setMessages((prevMessages) => [
              {
                ...prevMessages[0],
                content: `

                  Chatbot Context:
                  ${bucketPrompt}
                `,
              },
              ...prevMessages.slice(1),
            ]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentBucket?.id]);

  const getBucketColor = (bucketName: string | undefined) => {
    const bucketColors: { [key: string]: string } = {
      "Food and Drinks": "text-[#F95A31]",
      Work: "text-[#8E52DA]",
      Education: "text-[#15C839]",
      "Health & Wellness": "text-[#2D9CDB]",
      Travel: "text-[#deaa0c]",
      Lifestyle: "text-[#EB5757]",
      Finance: "text-[#9B51E0]",
    };

    return bucketName
      ? bucketColors[bucketName] || "text-gray-600"
      : "text-gray-600";
  };

  

  const handleRenameChat = async () => {
    if (currentSessionId && newTopicName.trim()) {
      const { error } = await supabase
        .from("chat_sessions")
        .update({ topic: newTopicName.trim() })
        .eq("id", currentSessionId);

      if (error) {
        console.error("Error renaming chat:", error);
      } else {
        setChatTopic(newTopicName.trim());
        setShowRenameModal(false);
        setNewTopicName("");
        setShowDropdown(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      if (e.shiftKey) {
        // Allow Shift+Enter for new line
        return;
      } else {
        // Prevent default to avoid new line
        e.preventDefault();
        // Submit the form if there's input and not loading
        if (input.trim() && !isLoading) {
          handleSubmit(e);
        }
      }
    }
  };

  // Add this function before the return statement
  const getLLMName = (bucketName: string | undefined) => {
    if (currentBucket?.character_name) {
      return currentBucket.character_name;
    }
    const selectedBucket = buckets.find((b) => b.character_name === bucketName);
    return selectedBucket?.character_name || "AI Assistant"; // Provide a default name
  };

  

  // Add these useEffect hooks after your existing useEffect blocks
  useEffect(() => {
    // Function to handle viewport height on iOS
    const setIOSViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };

    // Initial call and event listener
    setIOSViewportHeight();
    window.addEventListener("resize", setIOSViewportHeight);
    window.addEventListener("orientationchange", setIOSViewportHeight);

    // Cleanup
    return () => {
      window.removeEventListener("resize", setIOSViewportHeight);
      window.removeEventListener("orientationchange", setIOSViewportHeight);
    };
  }, []);

  // Add this useEffect to handle input focus
  useEffect(() => {
    const handleFocus = () => {
      // Scroll to bottom with a slight delay to ensure keyboard is fully shown
      setTimeout(() => {
        window.scrollTo(0, document.body.scrollHeight);
      }, 300);
    };

    const inputElement = textareaRef.current;
    inputElement?.addEventListener("focus", handleFocus);

    return () => {
      inputElement?.removeEventListener("focus", handleFocus);
    };
  }, []);

  

  // Add this component inside ChatPage but before the return statement
  const CreateShaktyModal = ({ onClose }: { onClose: () => void }) => {
    const [name, setName] = useState("");
    const [tagline, setTagline] = useState("");
    const [characterName, setCharacterName] = useState("");
    const [instructions, setInstructions] = useState("");
    const [isPublic, setIsPublic] = useState(false);
    const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(
      null
    );
    const [isUploading, setIsUploading] = useState(false);
    // Add new state for success view
    const [isSuccess, setIsSuccess] = useState(false);
    const [shareUrl, setShareUrl] = useState("");
    const [errors, setErrors] = useState({
      name: false,
      tagline: false,
      characterName: false,
      nameExists: false, // Add this new error type
    });
    

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageClick = () => {
      fileInputRef.current?.click();
    };

    const handleImageChange = async (
      event: React.ChangeEvent<HTMLInputElement>
    ) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsUploading(true);
      try {
        const fileName = `shakty-${Date.now()}.${file.name.split(".").pop()}`;

        const { error: uploadError } = await supabase.storage
          .from("img")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        setUploadedImageUrl(fileName);
      } catch (error) {
        console.error("Error uploading image:", error);
      }
      setIsUploading(false);
    };

    const checkNameExists = async (nameToCheck: string) => {
      // Remove all spaces from the name user has given
      const normalizedName = nameToCheck.replace(/\s+/g, "").toLowerCase();

      // Fetch all buckets created by this user
      const { data, error } = await supabase
        .from("buckets")
        .select("name")
        .eq("created_by", userId);

      if (error) {
        console.error("Error checking name:", error);
        return false;
      }

      // Check if any existing bucket name (with spaces removed) matches the new name
      return (
        data?.some((bucket) => {
          // Remove all spaces from each existing bucket name
          const existingNormalizedName = bucket.name
            .replace(/\s+/g, "")
            .toLowerCase();
          // Compare the normalized names
          return existingNormalizedName === normalizedName;
        }) || false
      );
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      // Reset errors
      setErrors({
        name: false,
        tagline: false,
        characterName: false,
        nameExists: false,
      });

      // Validate required fields
      const newErrors = {
        name: !name.trim(),
        tagline: !tagline.trim(),
        characterName: !characterName.trim(),
        nameExists: false,
      };

      if (Object.values(newErrors).some((error) => error)) {
        setErrors(newErrors);
        return;
      }

      // Check if name already exists
      const nameExists = await checkNameExists(name);
      if (nameExists) {
        setErrors((prev) => ({ ...prev, nameExists: true }));
        return;
      }

      try {
        const getUserName = async () => {
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("username")
            .eq("id", userId)
            .single();

          if (userError || !userData) {
            throw new Error("Could not fetch user data");
          }

          return userData.username;
        };

        const username = await getUserName();
        // Create URL-friendly versions of username and shakty name
        const urlFriendlyUsername = username.toLowerCase();
        const urlFriendlyShaktyName = name.toLowerCase().replace(/\s+/g, "-");
        const share_id = `${urlFriendlyUsername}/${urlFriendlyShaktyName}`;

        const { data, error } = await supabase
          .from("buckets")
          .insert({
            name: name,
            bio: tagline,
            character_name: characterName,
            prompt: instructions,
            isPublic: isPublic,
            shakty_dp: uploadedImageUrl,
            created_by: userId,
            share_id: share_id,
            is_verified: isPublic ? false : true, // Set is_verified to false for public Shakties, true for private ones
          })
          .select()
          .single();

        if (error) throw error;

        // Only show success modal with share URL for public Shakties
        if (isPublic && data) {
          const url = `${window.location.origin}/${data.share_id}`;
          setShareUrl(url);
          setIsSuccess(true);
        } else {
          onClose();
        }
      } catch (error) {
        console.error("Error creating bucket:", error);
      }
    };

    // Add success view JSX
    if (isSuccess) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-[20px] p-8 w-[500px] shadow-lg text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-[#F87631] flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M20 6L9 17L4 12"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            <h2 className="text-2xl font-bold mb-2">Your Shakty {name}</h2>
            <p className="text-xl mb-6">created successfully</p>

            <div className="mb-6">
              <p className="text-gray-600 mb-2">Share this Shakty!</p>
              <div className="flex items-center justify-center gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="p-2 border rounded flex-1 bg-gray-50"
                />
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText(shareUrl);
                    setShowCopied(true);
                    setTimeout(() => setShowCopied(false), 2000); // Hide after 2 seconds
                  }}
                  className="px-4 py-2 bg-[#F87631] text-white rounded-md relative"
                >
                  {showCopied ? (
                    <span className="flex items-center gap-1">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        className="animate-fadeIn"
                      >
                        <path
                          d="M20 6L9 17L4 12"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Copied!
                    </span>
                  ) : (
                    "Copy"
                  )}
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                // Extract the path from the shareUrl and navigate to it
                const path = new URL(shareUrl).pathname;
                navigate(path);
                onClose();
              }}
              className="px-8 py-2 bg-[#F87631] text-white rounded-lg"
            >
              Next →
            </button>
          </div>
        </div>
      );
    }

    // Original modal JSX continues...
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-[20px] p-8 w-[970px] h-[645px] shadow-lg overflow-y-auto relative">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18 6L6 18M6 6L18 18"
                stroke="#000000"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <h2 className="text-[#F87631] text-2xl font-bold mb-8">
            Create a Shakty
          </h2>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-black font-semibold mb-2">
                  Profile Picture
                </h3>
                <div className="flex items-end gap-4">
                  <div className="w-[98px] h-[98px] bg-[#F87631] rounded-full flex items-center justify-center overflow-hidden">
                    {uploadedImageUrl ? (
                      <img
                        src={`${
                          import.meta.env.VITE_SUPABASE_URL
                        }/storage/v1/object/public/img/${uploadedImageUrl}`}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-white">
                        {isUploading ? (
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
                        ) : (
                          <div>
                          <svg
                            width="61"
                            height="52"
                            viewBox="0 0 61 52"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M46.2693 22.4561H40.4205C39.0066 22.4561 37.9139 23.6413 37.9139 25.024L23.1313 25.0899C23.1313 23.6413 21.9744 22.5219 20.6247 22.5219H14.7759C12.5906 22.5219 10.791 24.3656 10.791 26.6044V40.3662C10.791 42.6049 12.5906 44.4486 14.7759 44.4486H46.2693C48.4546 44.4486 50.2542 42.6049 50.2542 40.3662V26.6044C50.3185 24.2997 48.5189 22.4561 46.2693 22.4561ZM43.5056 31.3453V36.8763C43.5056 37.6006 42.9272 38.1932 42.2202 38.1932C41.5132 38.1932 40.9347 37.6006 40.9347 36.8763V31.3453C40.9347 30.621 41.5132 30.0283 42.2202 30.0283C42.9272 30.0283 43.5056 30.621 43.5056 31.3453ZM33.929 38.5883C32.965 39.576 31.7438 40.0369 30.5226 40.0369C29.3014 40.0369 28.0803 39.576 27.1162 38.5883C26.602 38.0616 26.602 37.2714 27.1162 36.7446C27.6304 36.2179 28.4016 36.2179 28.9158 36.7446C29.8156 37.6006 31.1653 37.6006 32.0651 36.7446C32.5793 36.2179 33.3506 36.2179 33.8648 36.7446C34.379 37.2714 34.4432 38.0616 33.929 38.5883ZM20.1105 31.3453V36.8763C20.1105 37.6006 19.532 38.1932 18.8251 38.1932C18.1181 38.1932 17.5396 37.6006 17.5396 36.8763V31.3453C17.5396 30.621 18.1181 30.0283 18.8251 30.0283C19.532 30.0283 20.1105 30.621 20.1105 31.3453Z"
                              fill="white"
                                fillOpacity="0.8"
                            />
                            <path
                              d="M57.3241 27.4616H56.7456V26.5397C56.7456 20.6136 52.0538 15.8727 46.3335 15.8727H31.808V11.8561C34.1861 11.2635 35.9857 9.02469 35.9857 6.39085C35.9857 3.29609 33.5433 0.793945 30.5225 0.793945C27.5017 0.793945 25.0594 3.29609 25.0594 6.39085C25.0594 9.02469 26.859 11.2635 29.2371 11.8561V15.8727H14.7758C8.99132 15.8727 4.36372 20.6794 4.36372 26.5397V27.4616H3.72099C2.04991 27.4616 0.700195 28.8443 0.700195 30.5563V37.536C0.700195 39.248 2.04991 40.6308 3.72099 40.6308H4.36372C4.49226 46.3594 9.11987 51.0344 14.7758 51.0344H46.2692C51.9252 51.0344 56.5528 46.4252 56.6814 40.6308H57.3241C58.9952 40.6308 60.3449 39.248 60.3449 37.536V30.6222C60.3449 28.9102 58.9952 27.4616 57.3241 27.4616ZM57.774 37.6019C57.774 37.8652 57.5812 38.0628 57.3241 38.0628H56.7456V30.1613H57.3241C57.5812 30.1613 57.774 30.3588 57.774 30.6222V37.6019ZM46.2692 48.4664H14.7758C10.4053 48.4664 6.93461 44.8449 6.93461 40.3674V39.3797V28.8443V26.6056C6.93461 22.1939 10.4696 18.5724 14.7758 18.5724H30.5225H46.2692C50.5755 18.5724 54.1105 22.1939 54.1105 26.6056V28.8443V39.3797V40.3674C54.1747 44.8449 50.6398 48.4664 46.2692 48.4664ZM3.27109 37.6019V30.6222C3.27109 30.3588 3.4639 30.1613 3.72099 30.1613H4.36372V38.0628H3.72099C3.4639 38.0628 3.27109 37.8652 3.27109 37.6019ZM30.5225 3.42778C32.1293 3.42778 33.4148 4.7447 33.4148 6.39085C33.4148 8.037 32.1293 9.35392 30.5225 9.35392C28.9157 9.35392 27.6303 8.037 27.6303 6.39085C27.6303 4.7447 28.9157 3.42778 30.5225 3.42778Z"
                              fill="white"
                                fillOpacity="0.8"
                            />
                          </svg>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleImageClick}
                    className="px-4 py-2 bg-[#F87631] text-white rounded-md text-sm"
                  >
                    {uploadedImageUrl ? "Edit" : "Add"}
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>

              {/* Name Input */}
              <div>
                <h3 className="text-black font-semibold mb-2">
                  Name your Shakty
                </h3>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter name"
                  className={`w-full p-4 border-[1px] ${
                    errors.name || errors.nameExists
                      ? "border-red-500"
                      : "border-[#EBEBEB]"
                  } rounded-lg text-sm`}
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">Name is required</p>
                )}
                {errors.nameExists && (
                  <p className="text-red-500 text-xs mt-1">
                    You already have a Shakty with this name. Please choose a
                    different name.
                  </p>
                )}
              </div>

              {/* Tagline Input */}
              <div>
                <h3 className="text-black font-semibold mb-2">Tagline</h3>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="Add a one-line bio for your Shakty"
                  className={`w-full p-4 border-[1px] ${
                    errors.tagline ? "border-red-500" : "border-[#EBEBEB]"
                  } rounded-lg text-sm`}
                />
                {errors.tagline && (
                  <p className="text-red-500 text-xs mt-1">
                    Tagline is required
                  </p>
                )}
              </div>

              {/* Character Name Input */}
              <div>
                <h3 className="text-black font-semibold mb-2">
                  Character Name
                </h3>
                <input
                  type="text"
                  value={characterName}
                  onChange={(e) => setCharacterName(e.target.value)}
                  placeholder="Use the name that users would chat with"
                  className={`w-full p-4 border-[1px] ${
                    errors.characterName ? "border-red-500" : "border-[#EBEBEB]"
                  } rounded-lg text-sm`}
                />
                {errors.characterName && (
                  <p className="text-red-500 text-xs mt-1">
                    Character name is required
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-6">
              {/* Status Toggle */}
              <div>
                <h3 className="text-black font-semibold mb-2">Shakty Status</h3>
                <div className="flex border-[1px] border-[#F87631] rounded-md overflow-hidden">
                  <button
                    className={`flex-1 py-3 text-sm ${
                      !isPublic ? "bg-[#F87631] text-white" : "text-gray-700"
                    }`}
                    onClick={() => setIsPublic(false)}
                  >
                    Private
                  </button>
                  <button
                    className={`flex-1 py-3 text-sm ${
                      isPublic ? "bg-[#F87631] text-white" : "text-gray-700"
                    }`}
                    onClick={() => setIsPublic(true)}
                  >
                    Public
                  </button>
                </div>
              </div>

              {/* Instructions Input */}
              <div>
                <h3 className="text-black font-semibold mb-2">
                  Response Instructions
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Add any text and instructions for how your Shakty should
                  respond and behave to prompts.
                </p>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Respond without using any adjectives, behave like you are a cartoon character."
                  className="w-full h-[172px] p-4 border-[1px] border-[#EBEBEB] rounded-lg text-sm resize-none"
                />
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleSubmit}
                  className="px-8 py-4 bg-[#F87631] text-white rounded-lg"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Add to the top of ChatPage component
  const { username, shareId } = useParams();
  // Add a new state to track if shared Shakty is loaded
  // const [isSharedShaktyLoaded, setIsSharedShaktyLoaded] = useState(false);

  // Update the loadSharedShakty useEffect
  useEffect(() => {
    const loadSharedShakty = async () => {
      if (!username || !shareId) return;

      try {
        // Use the complete share_id format (username/shakty-name)
        const share_id = `${username}/${shareId}`;

        // First fetch the bucket using share_id, but don't filter for is_verified
        const { data: bucketData, error: bucketError } = await supabase
          .from("buckets")
          .select(`
            *,
            users:created_by (
              name
            )
          `)
          .eq("share_id", share_id)
          .single();

        if (bucketError) {
          console.error("Error fetching bucket:", bucketError);
          return;
        }

        if (bucketData) {
          // Set current bucket with all its data
          setCurrentBucket(bucketData);

          // Set creator name from the joined users data
          setCreatorName(bucketData.users?.name || "Unknown");

          // Only proceed with loading data if the Shakty is verified
          if (!bucketData.is_verified) {
            setShowChatInput(false);
            return; // Stop here if not verified
          }

          // Rest of the existing code for loading verified Shakty data...
          try {
            // Fetch prompt
            const { data: promptData } = await supabase
              .from("buckets")
              .select("prompt")
              .eq("id", bucketData.id)
              .single();

            // Fetch sources
            const { data: sourcesData } = await supabase
              .from("sources")
              .select("source_message, scraped_content")
              .eq("bucket_id", bucketData.id);

            const sources =
              sourcesData?.map((source) =>
                source.scraped_content
                  ? `${source.source_message}\n\n{,Website content,}:\n${source.scraped_content}`
                  : source.source_message
              ) || [];

            setBucketSources(sources);
            setBucketPrompt(promptData?.prompt || "");

            setMessages([
              {
                role: "user",
                content: `
                  Chatbot Context:
                  ${promptData?.prompt || ""}

                  Sources:
                  ${sources.join("\n")}
                `,
              },
            ]);

            setShowChatInput(true);
          } catch (error) {
            console.error("Error fetching bucket data:", error);
          }
        }
      } catch (error) {
        console.error("Error in loadSharedShakty:", error);
      }
    };

    if (username && shareId) {
      loadSharedShakty();
    }
  }, [username, shareId]);

  
  // Add this useEffect to fetch creator's name when currentBucket changes
  useEffect(() => {
    const fetchCreatorName = async () => {
      if (currentBucket?.created_by) {
        const { data, error } = await supabase
          .from("users")
          .select("name")
          .eq("id", currentBucket.created_by)
          .single();

        if (data && !error) {
          setCreatorName(data.name);
        }
      }
    };

    fetchCreatorName();
  }, [currentBucket]);
  const getBucketImageSrc = (bucket: any) => {
    if (!bucket.by_shakty && bucket.shakty_dp) {
      return `${
        import.meta.env.VITE_SUPABASE_URL
      }/storage/v1/object/public/img/${bucket.shakty_dp}`;
    }

    const imageSrc = "/assets/";
    switch (bucket.name.toLowerCase()) {
      case "travel":
        return imageSrc + "travel.png";
      case "finance":
        return imageSrc + "finance.png";
      case "health & wellness":
        return imageSrc + "health.png";
      case "work":
        return imageSrc + "work.png";
      case "education":
        return imageSrc + "education.png";
      case "food and drinks":
        return imageSrc + "food.png";
      case "lifestyle":
        return imageSrc + "lifestyle.png";
      default:
        return imageSrc + "bot.svg";
    }
  };

  useEffect(() => {
    if (
      messages.length > 0 &&
      messages[messages.length - 1].role === "llm" &&
      !isLoading &&
      textareaRef.current
    ) {
      textareaRef.current.focus();
    }
  }, [messages, isLoading]);

  // Add console logs for debugging
  useEffect(() => {
    console.log("Current Bucket:", currentBucket);
    console.log("Creator Name:", creatorName);
  }, [currentBucket, creatorName]);

  // Add this useEffect to handle session loading from URL params
  useEffect(() => {
    const loadSessionFromURL = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('sessionId');
      const fromHistory = location.state?.fromHistory;

      if (sessionId && (fromHistory || !currentSessionId)) {
        await handleSelectSession(sessionId);
        // Clear the fromHistory state
        navigate(location.pathname + location.search, { 
          replace: true,
          state: {} 
        });
      }
    };

    loadSessionFromURL();
  }, [location.search, location.state]); // Add dependencies
  console.log("bucket created_by", currentBucket?.created_by)
  console.log("userDetails id", userDetails?.id)

  // Add this line at the beginning of the ChatPage component, right after your other state declarations:
  

  // Then, add this useEffect to keep activeBucketId in sync with currentBucket

  return (
    <main className="chat-page h-screen w-screen mx-auto flex flex-col text-ui-90 relative">
      <div className="flex flex-col lg:flex-row h-full">
        <div className="left-nav">
          <Header />

          {/* Add bucket selector and source button here */}
          {/* <div className="border-b-1 border-[#e0e0e0] w-full bg-white">
            <div className="flex items-center justify-between px-4 py-2">
              <select
                value={currentBucket?.id}
                onChange={async (e) => {
                  const bucket =
                    buckets.find((b) => b.id === e.target.value) || null;
                  setCurrentBucket(bucket);
                  if (bucket) {
                    await fetchBucketData(bucket.id);
                  }
                  handleNewChat();
                }}
                className="p-2 border-[1px] border-[#F87631] rounded-lg flex-1 mr-2 text-sm font-sans"
              >
                {buckets.map((bucket) => (
                  <option key={bucket.id} value={bucket.id}>
                    {bucket.name}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setShowSourceModal(true)}
                className="bg-[#F87631] text-white px-4 py-2 rounded-lg text-sm flex items-center"
              >
                <svg
                  className="w-4 h-4 mr-1"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Source
              </button>
            </div>
          </div> */}

          {/* Existing new chat button and chat topic container */}
          <div
            className={`${
              chatTopic !== "New Chat" ? "border-b-[1px] border-[#e0e0e0]" : ""
            } w-full bg-white flex-1`}
          >
            <div className="flex flex-row lg:flex-col py-3 px-4">
              <div
                className={cn("flex items-center gap-2 w-full", {
                  "hidden lg:flex": chatTopic != "New Chat",
                })}
              >
                <button
                  className="button-primary justify-between items-center w-full hidden lg:flex"
                  onClick={() => handleNewChat()}
                >
                  <span>New Chat</span>

                  {/* <svg
                    height="15"
                    viewBox="0 0 3 15"
                    fill="none"
                    className="w-5 px-2 rotate-90 lg:rotate-0"
                    onClick={toggleDropdown}
                  >
                    <circle cx="1.5" cy="1.5" r="1.5" fill="#ffffff" />
                    <circle cx="1.5" cy="7.5" r="1.5" fill="#ffffff" />
                    <circle cx="1.5" cy="13.5" r="1.5" fill="#ffffff" />
                  </svg> */}
                </button>
              </div>

              <div
                className={cn("hidden items-center gap-2 w-full flex-1", {
                  "flex lg:hidden": chatTopic != "New Chat",
                })}
              >
                {/* <img src="/assets/chat-icon.png" alt="Chat" /> */}
                <div className="flex flex-col  border-[#e0e0e0]">
                  <p className="text-start text-lg text-[#333] text-[16px] font-lexend font-semibold">
                    {truncateTopic(chatTopic)}
                  </p>
                  {currentBucket && chatTopic !== "New Chat" && (
                    <span
                      className={`text-[10px] md:text-[12px] ${getBucketColor(
                        currentBucket.name
                      )} font-lexend font-semibold`}
                    >
                      {currentBucket.name}
                    </span>
                  )}
                </div>
                <div className="flex items-center">
                  <button
                    onClick={handleShareChat}
                    className="ml-4 mt-2 relative overflow-visible" // Add overflow-visible
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 20 22"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M3.50938 13.9757C4.38447 13.9707 5.22615 13.6391 5.86938 13.0457L12.1294 16.6257C12.0496 16.902 12.0092 17.1881 12.0094 17.4757C12.003 18.2872 12.2764 19.0762 12.7836 19.7098C13.2908 20.3433 14.0008 20.7828 14.7941 20.9541C15.5873 21.1254 16.4154 21.0182 17.1389 20.6504C17.8623 20.2827 18.437 19.6768 18.7661 18.935C19.0951 18.1931 19.1585 17.3605 18.9456 16.5774C18.7326 15.7943 18.2563 15.1084 17.5969 14.6354C16.9375 14.1623 16.1352 13.9309 15.3251 13.9801C14.515 14.0294 13.7467 14.3562 13.1494 14.9057L6.88938 11.3257C6.96493 11.0793 7.00533 10.8234 7.00938 10.5657L13.1594 7.0457C13.7534 7.58254 14.514 7.89878 15.3136 7.9414C16.1131 7.98401 16.903 7.7504 17.5508 7.27975C18.1985 6.80909 18.6648 6.13002 18.8713 5.35642C19.0778 4.58281 19.012 3.76173 18.6849 3.03087C18.3579 2.30002 17.7895 1.70384 17.0751 1.34232C16.3606 0.98081 15.5436 0.875947 14.7611 1.04532C13.9785 1.2147 13.278 1.64801 12.777 2.27259C12.2759 2.89716 12.0049 3.67502 12.0094 4.4757C12.0128 4.763 12.0531 5.04868 12.1294 5.3257L6.43938 8.5757C6.10969 8.06565 5.65295 7.65018 5.11406 7.3701C4.57518 7.09003 3.97268 6.955 3.36581 6.97828C2.75893 7.00157 2.16855 7.18237 1.65271 7.50291C1.13687 7.82346 0.713312 8.27271 0.423672 8.80652C0.134032 9.34032 -0.0117219 9.94031 0.000736668 10.5475C0.0131952 11.1547 0.183437 11.7482 0.49473 12.2697C0.806022 12.7912 1.24765 13.2227 1.77621 13.5218C2.30477 13.8209 2.90206 13.9773 3.50938 13.9757ZM15.5094 15.9757C15.8061 15.9757 16.0961 16.0637 16.3427 16.2285C16.5894 16.3933 16.7817 16.6276 16.8952 16.9017C17.0087 17.1758 17.0384 17.4774 16.9806 17.7683C16.9227 18.0593 16.7798 18.3266 16.57 18.5364C16.3603 18.7461 16.093 18.889 15.802 18.9469C15.511 19.0048 15.2094 18.975 14.9354 18.8615C14.6613 18.748 14.427 18.5557 14.2622 18.3091C14.0974 18.0624 14.0094 17.7724 14.0094 17.4757C14.0094 17.0779 14.1674 16.6963 14.4487 16.415C14.73 16.1337 15.1116 15.9757 15.5094 15.9757ZM15.5094 2.9757C15.8061 2.9757 16.0961 3.06367 16.3427 3.22849C16.5894 3.39331 16.7817 3.62758 16.8952 3.90167C17.0087 4.17576 17.0384 4.47736 16.9806 4.76833C16.9227 5.0593 16.7798 5.32658 16.57 5.53636C16.3603 5.74614 16.093 5.889 15.802 5.94688C15.511 6.00475 15.2094 5.97505 14.9354 5.86152C14.6613 5.74798 14.427 5.55573 14.2622 5.30905C14.0974 5.06238 14.0094 4.77237 14.0094 4.4757C14.0094 4.0779 14.1674 3.69634 14.4487 3.41504C14.73 3.13373 15.1116 2.9757 15.5094 2.9757ZM3.50938 8.9757C3.80605 8.9757 4.09606 9.06367 4.34274 9.22849C4.58941 9.39331 4.78167 9.62758 4.8952 9.90167C5.00873 10.1758 5.03844 10.4774 4.98056 10.7683C4.92268 11.0593 4.77982 11.3266 4.57004 11.5364C4.36026 11.7461 4.09299 11.889 3.80202 11.9469C3.51104 12.0048 3.20944 11.975 2.93535 11.8615C2.66127 11.748 2.427 11.5557 2.26218 11.3091C2.09735 11.0624 2.00938 10.7724 2.00938 10.4757C2.00938 10.0779 2.16741 9.69634 2.44872 9.41504C2.73002 9.13373 3.11155 8.9757 3.50938 8.9757Z"
                        fill="#F87631"
                      />
                    </svg>
                    {showCopiedTooltip && (
                      <div className="absolute top-8 left-[30px] transform -translate-x-1/2 bg-white border-[1px] border-[#F87631] text-[#F87631] px-2 py-1 rounded text-xs whitespace-nowrap z-50 font-lexend font-semibold">
                        Copied!
                      </div>
                    )}
                  </button>
                </div>
              </div>
              {!isSharedView && (
                <div
                  className="relative flex justify-center items-center"
                  ref={dropdownRef}
                >
                  <button
                    onClick={toggleDropdown}
                    className={cn("hidden", {
                      "block lg:hidden": messages.length > 1,
                    })}
                  >
                    <svg
                      fill="#000000"
                      viewBox="0 0 32 32"
                      enable-background="new 0 0 32 32"
                      className="w-5"
                    >
                      <path d="M16,13c-1.654,0-3,1.346-3,3s1.346,3,3,3s3-1.346,3-3S17.654,13,16,13z" />
                      <path d="M6,13c-1.654,0-3,1.346-3,3s1.346,3,3,3s3-1.346,3-3S7.654,13,6,13z" />
                      <path d="M26,13c-1.654,0-3,1.346-3,3s1.346,3,3,3s3-1.346,3-3S27.654,13,26,13z" />
                    </svg>
                  </button>
                  {showDropdown && (
                    <div className="absolute right-6 mt-56 w-[185px] bg-white rounded-md shadow-lg z-50">
                      <div className="py-1 lg:hidden">
                        {messages.length > 1 && (
                          <>
                            {/* Add Rename Button */}
                            <button
                              onClick={() => {
                                setShowRenameModal(true);
                                setNewTopicName(chatTopic);
                                setShowDropdown(false);
                              }}
                              className="flex justify-start items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-b-1"
                            >
                              <svg
                                width="18"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M15.2322 5.23223L18.7677 8.76777M16.7322 3.73223C17.7085 2.75592 19.2914 2.75592 20.2677 3.73223C21.244 4.70854 21.244 6.29146 20.2677 7.26777L6.5 21.0355H3V17.4644L16.7322 3.73223Z"
                                  stroke="#5D5D5D"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                              <span className="ml-2">Rename Chat</span>
                            </button>

                            {/* Add Source Button */}
                            <button
                              onClick={() => {
                                console.log("Add Source button clicked");
                                setShowSourceModal(true);
                                console.log("showSourceModal now set to:", true); // Add this log
                              }}
                              className="bg-[#F87631] text-white px-4 py-2 rounded-lg text-sm flex items-center"
                            >
                              Add Source
                            </button>

                            {/* Existing Delete Button */}
                            <button
                              onClick={() => {
                                setShowDeleteModal(true);
                                setShowDropdown(false);
                              }}
                              className="flex justify-start items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-b-1"
                            >
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
                              <span className="ml-2 text-[#FF6969]">
                                Delete Chat
                              </span>
                            </button>

                            {/* Existing Share Button */}
                            <button
                              onClick={handleShareChat}
                              className="flex justify-start items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-b-1"
                            >
                              <svg
                                width="18"
                                height="16"
                                viewBox="0 0 11 11"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M0 5.5C0 6.51078 0.822556 7.33333 1.83333 7.33333C2.31856 7.33333 2.75733 7.14083 3.0855 6.83222L6.74667 8.92467C6.73567 9.00411 6.72222 9.08356 6.72222 9.16667C6.72222 10.1774 7.54478 11 8.55556 11C9.56633 11 10.3889 10.1774 10.3889 9.16667C10.3889 8.15589 9.56633 7.33333 8.55556 7.33333C8.07033 7.33333 7.63156 7.52583 7.30339 7.83444L3.64222 5.74261C3.65322 5.66256 3.66667 5.58311 3.66667 5.5C3.66667 5.41689 3.65322 5.33744 3.64222 5.25739L7.30339 3.16556C7.63156 3.47417 8.07033 3.66667 8.55556 3.66667C9.56633 3.66667 10.3889 2.84411 10.3889 1.83333C10.3889 0.822556 9.56633 0 8.55556 0C7.54478 0 6.72222 0.822556 6.72222 1.83333C6.72222 1.91644 6.73567 1.99589 6.74667 2.07594L3.0855 4.16778C2.74756 3.84675 2.29945 3.66742 1.83333 3.66667C0.822556 3.66667 0 4.48922 0 5.5Z"
                                  fill="#5D5D5D"
                                />
                              </svg>
                              <span className="ml-2">Share Chat</span>
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => {
                            handleNewChat();
                            setShowDropdown(false);
                          }}
                          className="flex justify-start items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="16"
                            viewBox="0 0 18 16"
                            fill="none"
                          >
                            <path
                              d="M1.61118 15.3092H10.7967V13.7783H1.61118V4.59277H0.0802612V13.7783C0.0802612 14.6226 0.766876 15.3092 1.61118 15.3092Z"
                              fill="#5D5D5D"
                            />
                            <path
                              d="M13.8584 0H4.67288C3.82858 0 3.14197 0.686615 3.14197 1.53091V10.7164C3.14197 11.5607 3.82858 12.2473 4.67288 12.2473H13.8584C14.7027 12.2473 15.3893 11.5607 15.3893 10.7164V1.53091C15.3893 0.686615 14.7027 0 13.8584 0ZM12.3275 6.88911H10.0311V9.18548H8.50017V6.88911H6.2038V5.3582H8.50017V3.06183H10.0311V5.3582H12.3275V6.88911Z"
                              fill="#5D5D5D"
                            />
                          </svg>
                          <span className="ml-2">Start a new Chat</span>
                        </button>
                      </div>
                      <div className="border-t-1">
                        <button
                          onClick={() => {
                            navigate("/chat-history");
                            setShowDropdown(false);
                          }}
                          className="flex justify-start items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <svg
                            width={20}
                            height={20}
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <path
                              d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 13.5997 2.37562 15.1116 3.04346 16.4525C3.22094 16.8088 3.28001 17.2161 3.17712 17.6006L2.58151 19.8267C2.32295 20.793 3.20701 21.677 4.17335 21.4185L6.39939 20.8229C6.78393 20.72 7.19121 20.7791 7.54753 20.9565C8.88837 21.6244 10.4003 22 12 22Z"
                              stroke="#1C274C"
                              stroke-width="1.5"
                            />
                            <path
                              opacity="0.5"
                              d="M8 10.5H16"
                              stroke="#1C274C"
                              stroke-width="1.5"
                              stroke-linecap="round"
                            />
                            <path
                              opacity="0.5"
                              d="M8 14H13.5"
                              stroke="#1C274C"
                              stroke-width="1.5"
                              stroke-linecap="round"
                            />
                          </svg>
                          <span className="ml-2">Chat History</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="hidden lg:block">
                <ChatHistoryDrawer
                  userId={userDetails?.id || ""}
                  onSelectSession={handleSelectSession}
                  isOpen={true}
                  onClose={() => setShowDrawer(false)}
                  onNewChat={handleNewChat}
                  onBucketSelect={handleBucketSelectFromHistory}
                  selectedNewChat={selectedNewChat}
                  currentSessionId={currentSessionId}
                  isHistoryPage={false} // Add this prop
                />
              </div>
            </div>
          </div>

          <div className="hidden absolute bottom-3 left-4 z-10 w-11/12 lg:block">
            <button
              className="flex flex-row items-center gap-2 bg-[#F3F3F3] p-2 w-full rounded-md"
              onClick={() => navigate(`/${userDetails?.id}`)}
            >
              <div className="bg-white flex items-center justify-center  rounded-full border-ui-90 w-7 h-7 overflow-hidden border-0.8">
                {userDetails?.profile_picture_url ? (
                  <img
                    src={`${
                      import.meta.env.VITE_SUPABASE_URL
                    }/storage/v1/object/public/img/${
                      userDetails?.profile_picture_url
                    }`}
                    alt="user image"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={"/assets/profile.svg"}
                    alt="logo image"
                    height={24}
                    width={24}
                  />
                )}
              </div>
              <div>{userDetails?.name}</div>
            </button>
          </div>
        </div>

        <div className="flex flex-col flex-1 overflow-hidden mt-16 lg:mt-0 lg:mb-[90px]">
          <div
            className={cn(
              "hidden lg:flex w-full border-b-[2px] border-gray-300 py-4 px-3",
              { "lg:hidden": chatTopic === "New Chat" }
            )}
          >
            <div className="flex flex-col">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="font-semibold text-[20px]">
                    {truncateTopic(chatTopic)}
                  </h1>
                  {currentBucket && chatTopic !== "New Chat" && (
                    <span
                      className={`text-xs ${getBucketColor(
                        currentBucket.name
                      )} mt-1 font-lexend font-semibold`}
                    >
                      {currentBucket.name}
                    </span>
                  )}
                </div>
                <button
                  onClick={handleShareChat}
                  className="ml-4 mt-2 relative overflow-visible" // Add overflow-visible
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 20 22"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M3.50938 13.9757C4.38447 13.9707 5.22615 13.6391 5.86938 13.0457L12.1294 16.6257C12.0496 16.902 12.0092 17.1881 12.0094 17.4757C12.003 18.2872 12.2764 19.0762 12.7836 19.7098C13.2908 20.3433 14.0008 20.7828 14.7941 20.9541C15.5873 21.1254 16.4154 21.0182 17.1389 20.6504C17.8623 20.2827 18.437 19.6768 18.7661 18.935C19.0951 18.1931 19.1585 17.3605 18.9456 16.5774C18.7326 15.7943 18.2563 15.1084 17.5969 14.6354C16.9375 14.1623 16.1352 13.9309 15.3251 13.9801C14.515 14.0294 13.7467 14.3562 13.1494 14.9057L6.88938 11.3257C6.96493 11.0793 7.00533 10.8234 7.00938 10.5657L13.1594 7.0457C13.7534 7.58254 14.514 7.89878 15.3136 7.9414C16.1131 7.98401 16.903 7.7504 17.5508 7.27975C18.1985 6.80909 18.6648 6.13002 18.8713 5.35642C19.0778 4.58281 19.012 3.76173 18.6849 3.03087C18.3579 2.30002 17.7895 1.70384 17.0751 1.34232C16.3606 0.98081 15.5436 0.875947 14.7611 1.04532C13.9785 1.2147 13.278 1.64801 12.777 2.27259C12.2759 2.89716 12.0049 3.67502 12.0094 4.4757C12.0128 4.763 12.0531 5.04868 12.1294 5.3257L6.43938 8.5757C6.10969 8.06565 5.65295 7.65018 5.11406 7.3701C4.57518 7.09003 3.97268 6.955 3.36581 6.97828C2.75893 7.00157 2.16855 7.18237 1.65271 7.50291C1.13687 7.82346 0.713312 8.27271 0.423672 8.80652C0.134032 9.34032 -0.0117219 9.94031 0.000736668 10.5475C0.0131952 11.1547 0.183437 11.7482 0.49473 12.2697C0.806022 12.7912 1.24765 13.2227 1.77621 13.5218C2.30477 13.8209 2.90206 13.9773 3.50938 13.9757ZM15.5094 15.9757C15.8061 15.9757 16.0961 16.0637 16.3427 16.2285C16.5894 16.3933 16.7817 16.6276 16.8952 16.9017C17.0087 17.1758 17.0384 17.4774 16.9806 17.7683C16.9227 18.0593 16.7798 18.3266 16.57 18.5364C16.3603 18.7461 16.093 18.889 15.802 18.9469C15.511 19.0048 15.2094 18.975 14.9354 18.8615C14.6613 18.748 14.427 18.5557 14.2622 18.3091C14.0974 18.0624 14.0094 17.7724 14.0094 17.4757C14.0094 17.0779 14.1674 16.6963 14.4487 16.415C14.73 16.1337 15.1116 15.9757 15.5094 15.9757ZM15.5094 2.9757C15.8061 2.9757 16.0961 3.06367 16.3427 3.22849C16.5894 3.39331 16.7817 3.62758 16.8952 3.90167C17.0087 4.17576 17.0384 4.47736 16.9806 4.76833C16.9227 5.0593 16.7798 5.32658 16.57 5.53636C16.3603 5.74614 16.093 5.889 15.802 5.94688C15.511 6.00475 15.2094 5.97505 14.9354 5.86152C14.6613 5.74798 14.427 5.55573 14.2622 5.30905C14.0974 5.06238 14.0094 4.77237 14.0094 4.4757C14.0094 4.0779 14.1674 3.69634 14.4487 3.41504C14.73 3.13373 15.1116 2.9757 15.5094 2.9757ZM3.50938 8.9757C3.80605 8.9757 4.09606 9.06367 4.34274 9.22849C4.58941 9.39331 4.78167 9.62758 4.8952 9.90167C5.00873 10.1758 5.03844 10.4774 4.98056 10.7683C4.92268 11.0593 4.77982 11.3266 4.57004 11.5364C4.36026 11.7461 4.09299 11.889 3.80202 11.9469C3.51104 12.0048 3.20944 11.975 2.93535 11.8615C2.66127 11.748 2.427 11.5557 2.26218 11.3091C2.09735 11.0624 2.00938 10.7724 2.00938 10.4757C2.00938 10.0779 2.16741 9.69634 2.44872 9.41504C2.73002 9.13373 3.11155 8.9757 3.50938 8.9757Z"
                      fill="#F87631"
                    />
                  </svg>
                  {showCopiedTooltip && (
                    <div className="absolute top-8 left-[30px] transform -translate-x-1/2 bg-white border-[1px] border-[#F87631] text-[#F87631] px-2 py-1 rounded text-xs whitespace-nowrap z-50 font-lexend font-semibold">
                      Copied!
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Increase top margin */}
          <div className="flex-1 overflow-y-auto px-3 bg-white">
            <div className="pt-12 lg:pt-4 h-full">
              {!hasStartedChat && messages.length <= 1 ? (
                <div className="flex flex-col items-center justify-center min-h-full relative lg:mt-0 lg:h-[calc(100vh-200px)] lg:overflow-y-auto">
                  {shareId ? (
                    // Show this when accessing a shared Shakty
                    <div className="flex flex-col items-center">
                      <div className="w-32 h-32 rounded-full overflow-hidden border-[4px] border-[#F87631] mb-4">
                        {currentBucket?.shakty_dp ? (
                          <img
                            src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/img/${currentBucket.shakty_dp}`}
                            alt={currentBucket.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-30 h-32 bg-[#F87631] rounded-full flex items-center justify-center overflow-hidden">
                            <svg
                              width="61"
                              height="61"
                              viewBox="0 0 61 52"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M46.2693 22.4561H40.4205C39.0066 22.4561 37.9139 23.6413 37.9139 25.024L23.1313 25.0899C23.1313 23.6413 21.9744 22.5219 20.6247 22.5219H14.7759C12.5906 22.5219 10.791 24.3656 10.791 26.6044V40.3662C10.791 42.6049 12.5906 44.4486 14.7759 44.4486H46.2693C48.4546 44.4486 50.2542 42.6049 50.2542 40.3662V26.6044C50.3185 24.2997 48.5189 22.4561 46.2693 22.4561ZM43.5056 31.3453V36.8763C43.5056 37.6006 42.9272 38.1932 42.2202 38.1932C41.5132 38.1932 40.9347 37.6006 40.9347 36.8763V31.3453C40.9347 30.621 41.5132 30.0283 42.2202 30.0283C42.9272 30.0283 43.5056 30.621 43.5056 31.3453ZM33.929 38.5883C32.965 39.576 31.7438 40.0369 30.5226 40.0369C29.3014 40.0369 28.0803 39.576 27.1162 38.5883C26.602 38.0616 26.602 37.2714 27.1162 36.7446C27.6304 36.2179 28.4016 36.2179 28.9158 36.7446C29.8156 37.6006 31.1653 37.6006 32.0651 36.7446C32.5793 36.2179 33.3506 36.2179 33.8648 36.7446C34.379 37.2714 34.4432 38.0616 33.929 38.5883ZM20.1105 31.3453V36.8763C20.1105 37.6006 19.532 38.1932 18.8251 38.1932C18.1181 38.1932 17.5396 37.6006 17.5396 36.8763V31.3453C17.5396 30.621 18.1181 30.0283 18.8251 30.0283C19.532 30.0283 20.1105 30.621 20.1105 31.3453Z"
                                fill="white"
                                fillOpacity="0.8"
                              />
                              <path
                                d="M57.3241 27.4616H56.7456V26.5397C56.7456 20.6136 52.0538 15.8727 46.3335 15.8727H31.808V11.8561C34.1861 11.2635 35.9857 9.02469 35.9857 6.39085C35.9857 3.29609 33.5433 0.793945 30.5225 0.793945C27.5017 0.793945 25.0594 3.29609 25.0594 6.39085C25.0594 9.02469 26.859 11.2635 29.2371 11.8561V15.8727H14.7758C8.99132 15.8727 4.36372 20.6794 4.36372 26.5397V27.4616H3.72099C2.04991 27.4616 0.700195 28.8443 0.700195 30.5563V37.536C0.700195 39.248 2.04991 40.6308 3.72099 40.6308H4.36372C4.49226 46.3594 9.11987 51.0344 14.7758 51.0344H46.2692C51.9252 51.0344 56.5528 46.4252 56.6814 40.6308H57.3241C58.9952 40.6308 60.3449 39.248 60.3449 37.536V30.6222C60.3449 28.9102 58.9952 27.4616 57.3241 27.4616ZM57.774 37.6019C57.774 37.8652 57.5812 38.0628 57.3241 38.0628H56.7456V30.1613H57.3241C57.5812 30.1613 57.774 30.3588 57.774 30.6222V37.6019ZM46.2692 48.4664H14.7758C10.4053 48.4664 6.93461 44.8449 6.93461 40.3674V39.3797V28.8443V26.6056C6.93461 22.1939 10.4696 18.5724 14.7758 18.5724H30.5225H46.2692C50.5755 18.5724 54.1105 22.1939 54.1105 26.6056V28.8443V39.3797V40.3674C54.1747 44.8449 50.6398 48.4664 46.2692 48.4664ZM3.27109 37.6019V30.6222C3.27109 30.3588 3.4639 30.1613 3.72099 30.1613H4.36372V38.0628H3.72099C3.4639 38.0628 3.27109 37.8652 3.27109 37.6019ZM30.5225 3.42778C32.1293 3.42778 33.4148 4.7447 33.4148 6.39085C33.4148 8.037 32.1293 9.35392 30.5225 9.35392C28.9157 9.35392 27.6303 8.037 27.6303 6.39085C27.6303 4.7447 28.9157 3.42778 30.5225 3.42778Z"
                                fill="white"
                                fillOpacity="0.8"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                      <h2 className="text-2xl font-bold text-gray-800 mb-2">
                        {currentBucket?.name}
                      </h2>
                      <p className="text-gray-600 text-center max-w-md mb-2">
                        {currentBucket?.bio}
                      </p>
                      {!currentBucket?.is_verified && (
                        <div className=" p-4  rounded-lg">
                          <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-yellow-800" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <p className="text-[12px]">
                              This Shakty is currently under verification. Please check back later.
                            </p>
                          </div>
                        </div>
                      )}
                      {creatorName && (
                        <div className="flex flex-col items-center gap-3 mt-2">
                          <p className="text-[12px] text-gray-500">
                            Created by {creatorName}
                          </p>
                          {!token && <LoginButton />}
                        </div>
                      )}
                    </div>
                  ) : (
                    // Original code for non-shared view
                    <>
                      <img src={"/assets/ellipse.png"} className="w-90 h-90" />
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center w-full">
                        {/* Fixed header section */}
                        <div className="flex flex-col items-center mb-4">
                          <img src="/logo.png" width={80} height={80} />
                          <p className="text-center text-black font-montserrat text-[14px] w-[350px] md:w-[200px] lg:w-[330px] mt-2 font-semibold">
                            Shakty AI - Your Personal AI Superpower
                          </p>
                          <p className="text-center text-black font-montserrat text-[12px] w-[350px] md:w-[200px] lg:w-[330px] mt-1 font-normal">
                            Create, Query, and Share Shaktys.
                          </p>
                        </div>

                        {/* Scrollable Shaktys section */}
                        <div className="w-full max-h-[60vh] overflow-y-auto">
                          <div className="grid grid-cols-1 gap-4 w-full md:w-[800px] max-w-2xl px-3 py-5 mx-auto">
                            {/* Your Shaktys Section */}
                            <div className="space-y-3">
                              <h2 className="text-lg font-semibold text-gray-800">
                                Your Shaktys
                              </h2>
                              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
                                {/* Create Shakty Button - Now always visible */}
                                <div
                                  className="bg-[#f87631] rounded-lg cursor-pointer"
                                  onClick={() => setShowCreateShaktyModal(true)}
                                >
                                  <a className="flex flex-row gap-4 cursor-pointer items-center justify-center p-4 h-full">
                                    <img
                                      src="/images/create.png"
                                      alt="create"
                                      loading="lazy"
                                      decoding="async"
                                      className="w-10 h-10"
                                    />
                                    <div className="flex flex-col justify-center">
                                      <p className="text-[12px] font-semibold text-white">
                                        Create A Shakty
                                      </p>
                                      <p className="text-white text-[10px]">
                                        Add your own data to create a
                                        personalized bot.
                                      </p>
                                    </div>
                                  </a>
                                </div>

                                {/* User's Shaktys */}
                                {buckets
                                  .filter(
                                    (bucket) =>
                                      bucket.created_by === userId
                                  )
                                  .map((bucket) => (
                                    // Existing bucket rendering code
                                    <div
                                      key={bucket.id}
                                      className={`bg-[#fafafa7e] px-2 md:px-4 py-2 md:py-3 rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer min-h-[103px] ${
                                        currentBucket?.id === bucket.id
                                          ? "border-[1.5px] border-[#F87631]"
                                          : ""
                                      }`}
                                      onClick={() => handleBucketSelect(bucket)}
                                    >
                                      <div className="flex items-center gap-1 md:gap-2 justify-start">
                                        <img
                                          src={getBucketImageSrc(bucket)} // Move the image logic to a separate function
                                          alt={bucket.name}
                                          className="w-5 h-5 md:w-6 md:h-6 object-cover rounded-full"
                                        />
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <h3 className="text-sm md:text-lg font-bold mb-1 text-gray-700 text-[12px] md:text-[14px]">
                                              {bucket.name}
                                            </h3>
                                            <span className="text-[10px] text-gray-500">
                                              {bucket.isPublic
                                                ? "Public"
                                                : "Private"}
                                            </span>
                                          </div>
                                          <p className="text-gray-600 text-[10px] md:text-[12px] line-clamp-3">
                                            {bucket.bio}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>

                            {/* Other Shaktys Section */}
                            <div className="space-y-3">
                              <h2 className="text-lg font-semibold text-gray-800">
                                Shaktys By Our Community
                              </h2>
                              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
                                {buckets
                                  .filter(
                                    (bucket) =>
                                      bucket.created_by !== userId &&
                                      bucket.isPublic
                                  )
                                  .map((bucket) => (
                                    <div
                                      key={bucket.id}
                                      className={`bg-[#fafafa7e] px-2 md:px-4 py-2 md:py-3 rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer min-h-[103px] ${
                                        currentBucket?.id === bucket.id
                                          ? "border-[1.5px] border-[#F87631]"
                                          : ""
                                      }`}
                                      onClick={() => handleBucketSelect(bucket)}
                                    >
                                      <div className="flex items-center gap-1 md:gap-2 justify-start">
                                        <img
                                          src={getBucketImageSrc(bucket)}
                                          alt={bucket.name}
                                          className="w-5 h-5 md:w-6 md:h-6 object-cover rounded-full"
                                        />
                                        <div>
                                          <div className="flex flex-col">
                                            <h3 className="text-sm md:text-lg font-bold mb-1 text-gray-700 text-[12px] md:text-[14px]">
                                              {bucket.name}
                                            </h3>
                                          </div>
                                          <p className="text-gray-600 text-[10px] md:text-[12px] line-clamp-3">
                                            {bucket.bio}
                                          </p>
                                          <span className="text-[10px] text-gray-600 font-semibold">
                                            by{" "}
                                            {bucket.creator_name || "Unknown"}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                messages.slice(1).map((message, index) => (
                  <>
                    <div
                      key={`message-${index}`}
                      className="mx-auto flex flex-1 gap-4 text-base md:gap-5 lg:gap-6 md:max-w-3xl lg:max-w-[48rem] xl:max-w-[48rem]"
                    >
                      <div
                        className={`w-full mt-5 ${
                          message.role === "user" ? "text-right" : "text-left"
                        }`}
                      >
                        <div
                          className={`flex ${
                            message.role === "user"
                              ? "justify-end items-center"
                              : "justify-start item-start"
                          } `}
                        >
                          {message.role === "llm" && (
                            <>
                              {currentBucket?.shakty_dp ? (
                                <img
                                  src={`${
                                    import.meta.env.VITE_SUPABASE_URL
                                  }/storage/v1/object/public/img/${
                                    currentBucket.shakty_dp
                                  }`}
                                  alt={currentBucket.name || "bot"}
                                  className="w-8 h-8 rounded-full object-cover mr-2"
                                />
                              ) : (
                                <img
                                  src="/assets/bot.svg"
                                  alt="bot"
                                  className="w-8 h-8 rounded-full object-cover mr-2"
                                />
                              )}
                            </>
                          )}

                          <div
                            className={cn("chat-card", {
                              "bg-[#F87631] text-white rounded-xl shadow-lg px-3 py-1":
                                message.role === "user",
                              "bg-[#ffffff] text-[#000] rounded-xl shadow-lg p-3":
                                message.role === "llm",
                              readmore:
                                index !== messages.length - 2 &&
                                isShowReadMore(message.role, message.content),
                            })}
                          >
                            {message.role === "user" ? (
                              <p className="text-[10px] text-white text-right">
                                {isSharedView ? "user" : "you"}
                              </p>
                            ) : (
                              <p className="text-[12px] text-[#EB5757] font-bold">
                                {currentBucket &&
                                  getLLMName(currentBucket.character_name)}
                              </p>
                            )}
                            {message.role === "llm" && message.isLoading ? (
                              <div className="mt-[10px]">
                                <div className="flex space-x-2 items-center">
                                  <div className="h-[8px] w-[8px] bg-[#F87631] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                  <div className="h-[8px] w-[8px] bg-[#F87631] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                  <div className="h-[8px] w-[8px] bg-[#F87631] rounded-full animate-bounce"></div>
                                </div>
                              </div>
                            ) : (
                              <div className={`mt-[-8px] ${message.role === "user" ? "text-right" : "text-left"}`}>
                                <Markdown
                                  content={
                                    message.role === "user"
                                      ? message.content.split("{,Website content,}")[0].trim()
                                      : message.content
                                  }
                                />
                              </div>
                            )}
                            <button
                              className="read-more"
                              onClick={handleReadMore}
                            >
                              Read More
                            </button>
                          </div>

                          {/* Add back user DP */}
                          {message.role === "user" && (
                            <div className="flex-shrink-0 ml-2">
                              {userDetails?.profile_picture_url ? (
                                <img
                                  src={`${
                                    import.meta.env.VITE_SUPABASE_URL
                                  }/storage/v1/object/public/img/${
                                    userDetails.profile_picture_url
                                  }`}
                                  alt="user"
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className="border-[0.8px] border-[#564d48] rounded-full w-full h-full flex items-center justify-center">
                                  <img
                                    src="/assets/profile.svg"
                                    alt="user"
                                    className="w-8 h-8 rounded-full object-contain"
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Show typing indicator after the last user message */}
                    {message.role === "user" &&
                      index === messages.length - 2 && (
                        <div className="mx-auto flex flex-1 gap-4 text-base md:gap-5 lg:gap-6 md:max-w-3xl lg:max-w-[48rem] xl:max-w-[48rem]">
                          <div className="w-full mt-5 text-left">
                            <div className="flex justify-start items-start">
                              {currentBucket?.shakty_dp ? (
                                <img
                                  src={`${
                                    import.meta.env.VITE_SUPABASE_URL
                                  }/storage/v1/object/public/img/${
                                    currentBucket.shakty_dp
                                  }`}
                                  alt={currentBucket.name || "bot"}
                                  className="w-8 h-8 rounded-full object-cover mr-2"
                                />
                              ) : (
                                <img
                                  src="/assets/bot.svg"
                                  alt="bot"
                                  className="w-8 h-8 rounded-full object-cover mr-2"
                                />
                              )}
                              <div className="bg-[#ffffff] text-[#000] rounded-xl shadow-lg p-3">
                                <p className="text-[12px] text-[#EB5757] font-bold">
                                  {currentBucket &&
                                    getLLMName(currentBucket.character_name)}
                                </p>
                                <div className="mt-[10px] ">
                                  <div className="flex space-x-2 items-center">
                                    <div className="h-[8px] w-[8px] bg-[#F87631] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="h-[8px] w-[8px]  bg-[#F87631] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="h-[8px] w-[8px]  bg-[#F87631] rounded-full animate-bounce"></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                  </>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        <div className="chat-box fixed bottom-0 left-0 right-0 w-full">
          {!isSharedView &&
            showChatInput &&
            token &&
            // Add condition to check if user can access chat input
            (currentBucket?.isPublic ||
              currentBucket?.created_by === userId) && (
              <div className="px-4 py-1 bg-white bg-opacity-20 backdrop-blur-lg">
                <div className="mx-auto flex flex-1 gap-4 text-base md:gap-5 lg:gap-6 md:max-w-3xl lg:max-w-[40rem] xl:max-w-[48rem]">
                  <form className="w-full" onSubmit={handleSubmit}>
                    <div className="flex relative gap-2 items-end">
                      {(currentBucket?.by_shakty ||
                        (!currentBucket?.by_shakty &&
                          currentBucket?.created_by === userId &&
                          !isSharedView)) && (
                        <button
                          type="button"
                          onClick={() => setShowSourceModal(true)}
                          className="bg-[#fef2ea] font-bold p-4 rounded-md focus:outline-none flex-shrink-0 h-[48px] flex items-center"
                        >
                          <div className="flex items-center">
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 12 12"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M6.75 1.5C6.75 1.08579 6.41421 0.75 6 0.75C5.58579 0.75 5.25 1.08579 5.25 1.5V5.25H1.5C1.08579 5.25 0.75 5.58579 0.75 6C0.75 6.41421 1.08579 6.75 1.5 6.75H5.25V10.5C5.25 10.9142 5.58579 11.25 6 11.25C6.41421 11.25 6.75 10.9142 6.75 10.5V6.75H10.5C10.9142 6.75 11.25 6.41421 11.25 6C11.25 5.58579 10.9142 5.25 10.5 5.25H6.75V1.5Z"
                                fill="#F87631"
                              />
                            </svg>
                            {!input && (
                              <p className="text-[12px] text-[#F87631] ml-2">
                                Source
                              </p>
                            )}
                          </div>
                        </button>
                      )}

                      <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onInput={() => adjustTextareaHeight(textareaRef)}
                        onKeyDown={handleKeyDown}
                        className="flex-1 border-[1px] rounded-md pl-4 pr-[100px] py-3 focus:outline-none bg-white text-black font-medium border-solid border-[#EBEBEB] resize-none overflow-hidden"
                        placeholder="Ask anything..."
                        disabled={isLoading}
                        rows={1}
                        style={{ minHeight: "48px", maxHeight: "150px" }}
                      />
                      <div className="absolute right-2 bottom-[6px]">
                        <button
                          type="submit"
                          className="bg-[#F87631] font-bold p-2 rounded-md focus:outline-none"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <span className="flex items-center">
                              {/* <p className="text-[12px] text-[#F87631] mr-2">
                              Sending
                            </p> */}
                              <svg
                                className="animate-spin h-5 w-5 text-[#1e200b]"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="#FFF"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 0 0 0 0 0 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                            </span>
                          ) : (
                            <div className="flex items-center">
                              {/* <p className="text-[12px] text-[#F87631] mr-2">
                              Send
                            </p> */}
                              <svg
                                className="w-5 h-5"
                                viewBox="0 0 13 12"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M12.2845 5.39678L0.95116 0.0634447C0.837037 0.00974487 0.710023 -0.01048 0.584866 0.00511857C0.459709 0.0207172 0.341544 0.0714993 0.244093 0.151568C0.146643 0.231637 0.0739048 0.337707 0.0343255 0.457461C-0.00525383 0.577215 -0.0100504 0.70574 0.0204929 0.828111L0.828493 4.06078L6.00049 6.00011L0.828493 7.93944L0.0204929 11.1721C-0.0106251 11.2946 -0.00622883 11.4234 0.0331674 11.5434C0.0725636 11.6635 0.145331 11.7698 0.242957 11.85C0.340584 11.9303 0.459032 11.981 0.584448 11.9964C0.709864 12.0117 0.837061 11.9911 0.95116 11.9368L12.2845 6.60344C12.399 6.54961 12.4959 6.46428 12.5637 6.35744C12.6315 6.2506 12.6676 6.12666 12.6676 6.00011C12.6676 5.87356 12.6315 5.74962 12.5637 5.64278C12.4959 5.53594 12.399 5.45062 12.2845 5.39678Z"
                                  fill="#FFFF"
                                />
                              </svg>
                            </div>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
                <p className="text-gray-500 text-[9px] mt-1 text-center">
                  ShaktyAI can make mistakes. Please verify important info
                </p>
              </div>
            )}

          {/* Add message when user cannot access private Shakty */}
          {!isSharedView &&
            showChatInput &&
            token &&
            currentBucket &&
            !currentBucket.isPublic &&
            currentBucket.created_by !== userId && (
              <div className="px-4 py-4 text-center">
                <p className="text-gray-600">
                  This is a private Shakty. Only the creator can interact with
                  it.
                </p>
              </div>
            )}
        </div>
      </div>
      {showDrawer && !isSharedView && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40">
          <div className="h-full w-full bg-white flex flex-col">
            <div className="sticky top-[20px] z-50 bg-white">
              <Header />
            </div>
            <div className="flex-1 overflow-y-auto">
              <ChatHistoryDrawer
                userId={userDetails?.id || ""}
                onSelectSession={handleSelectSession}
                isOpen={true}
                onClose={() => setShowDrawer(false)}
                onNewChat={handleNewChat}
                onBucketSelect={handleBucketSelectFromHistory}
                selectedNewChat={selectedNewChat}
                currentSessionId={currentSessionId}
                isHistoryPage={false} // Add this prop
              />
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
      {showSourceModal && (
        <CreatePostDrawer
          bucketId={currentBucket?.id || ''}
          onClose={() => setShowSourceModal(false)}
          onSourceAdded={() => {
            // Refresh sources after adding
            if (currentBucket?.id) {
              fetchBucketData(currentBucket.id);
            }
          }}
        />
      )}
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
      {showCreateShaktyModal && (
        <CreateShaktyModal onClose={() => setShowCreateShaktyModal(false)} />
      )}
    </main>
  );
};

export default ChatPage;