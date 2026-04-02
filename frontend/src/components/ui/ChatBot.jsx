/* eslint-disable no-unused-vars */
import React, { useState, useRef, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiMessageCircle,
  FiX,
  FiSend,
  FiUser,
  FiChevronDown,
} from "react-icons/fi";
import propImg1 from "../../assets/Pimg1.jpg";
import propImg2 from "../../assets/Pimg3.jpg";
import propImg3 from "../../assets/Pimg4.jpg";
import propImg4 from "../../assets/Pimg9.jpg";
import propImg5 from "../../assets/property-hero.jpg";

import { useUser } from "@clerk/clerk-react";
import api from "../../services/apiInstance";
import { ChatbotContext } from "../../App";

import "./ChatBot.css"

const PROPERTY_IMAGES = [propImg1, propImg2, propImg3, propImg4, propImg5];

// get random image for property
const getRandomImage = (id) => {
  if (!id) return PROPERTY_IMAGES[0];
  const index = id % PROPERTY_IMAGES.length;
  return PROPERTY_IMAGES[index];
};



const GENERAL_RESPONSES = {
  search_property: {
    text: "Search properties",
    action: "buffered_response",
    payload: {
      response: "I'd be happy to help you find a property! Here are some of our top-featured listings to get you started. To narrow down the search, could you tell me which Location or BHK you are interested in?",
      properties: [
        { id: 101, Property_Name: "Skyline Residency", Location: "Thane West, Mumbai", Price_Starting_From: "₹1.2 Cr", Existing_Configurations: "2, 3 BHK", Project_Status: "Ready to Move" },
        { id: 102, Property_Name: "Green Valley Estates", Location: "Kharghar, Navi Mumbai", Price_Starting_From: "₹85 Lacs", Existing_Configurations: "1, 2 BHK", Project_Status: "Under Construction" },
        { id: 103, Property_Name: "Sea View Towers", Location: "Worli, Mumbai", Price_Starting_From: "₹4.5 Cr", Existing_Configurations: "3, 4 BHK", Project_Status: "Ready to Move" },
        { id: 104, Property_Name: "Urban Heights", Location: "Andheri East, Mumbai", Price_Starting_From: "₹1.5 Cr", Existing_Configurations: "2 BHK", Project_Status: "Ready to Move" },
        { id: 105, Property_Name: "Palm Grove", Location: "Panvel, Navi Mumbai", Price_Starting_From: "₹65 Lacs", Existing_Configurations: "1, 2 BHK", Project_Status: "Under Construction" },
        { id: 106, Property_Name: "Grand Central", Location: "Mulund, Mumbai", Price_Starting_From: "₹1.8 Cr", Existing_Configurations: "2, 3 BHK", Project_Status: "Near Completion" },
        { id: 107, Property_Name: "Silicon Valley", Location: "Ghansoli, Navi Mumbai", Price_Starting_From: "₹95 Lacs", Existing_Configurations: "2 BHK", Project_Status: "Ready to Move" },
        { id: 108, Property_Name: "Regal Enclave", Location: "Bandra, Mumbai", Price_Starting_From: "₹5.2 Cr", Existing_Configurations: "3, 4, 5 BHK", Project_Status: "Ready to Move" },
        { id: 109, Property_Name: "Park View", Location: "Kandivali, Mumbai", Price_Starting_From: "₹1.1 Cr", Existing_Configurations: "1, 2 BHK", Project_Status: "Under Construction" },
        { id: 110, Property_Name: "Rivera Estate", Location: "Kalyan, Thane", Price_Starting_From: "₹55 Lacs", Existing_Configurations: "1, 2 BHK", Project_Status: "Under Construction" }
      ],
      all_properties: Array.from({length: 20}, (_, i) => ({ id: 101 + i, Property_Name: `Property ${101+i}`, Location: "Mumbai", Price_Starting_From: "₹1 Cr", Existing_Configurations: "2 BHK", Project_Status: "Ready" })), // Dummy set for "Show More" demo
      builders: [],
      last_intent: "search_properties",
      has_more: true,
      total_results: { properties: 50, builders: 0 },
      suggestions: []
    }
  },
  find_builders: {
    text: "Find builders",
    action: "buffered_response",
    payload: {
      response: "I can definitely help you find the right developer! Here are some of the most reputable builders currently active. Do you have a specific builder name in mind?",
      properties: [],
      builders: [
        { rera_id: "B001", company_name: "Godrej Properties", cities: "Mumbai, Pune, Bangalore", completed_projects: 45, ongoing_projects: 12 },
        { rera_id: "B002", company_name: "Lodha Group", cities: "Mumbai, Thane, London", completed_projects: 80, ongoing_projects: 25 },
        { rera_id: "B003", company_name: "Hiranandani Developers", cities: "Thane, Powai, Panvel", completed_projects: 60, ongoing_projects: 10 },
        { rera_id: "B004", company_name: "Oberoi Realty", cities: "Mumbai", completed_projects: 30, ongoing_projects: 8 },
        { rera_id: "B005", company_name: "Tata Housing", cities: "Pan India", completed_projects: 50, ongoing_projects: 15 },
        { rera_id: "B006", company_name: "Kalpataru Group", cities: "Thane, Mumbai", completed_projects: 40, ongoing_projects: 12 },
        { rera_id: "B007", company_name: "Rustomjee", cities: "Mumbai, Virar", completed_projects: 35, ongoing_projects: 7 },
        { rera_id: "B008", company_name: "Indiabulls Real Estate", cities: "Mumbai, Gurgaon", completed_projects: 25, ongoing_projects: 5 },
        { rera_id: "B009", company_name: "Piramal Realty", cities: "Mumbai, Thane", completed_projects: 15, ongoing_projects: 6 },
        { rera_id: "B010", company_name: "Sunteck Realty", cities: "Mumbai", completed_projects: 20, ongoing_projects: 9 }
      ],
      all_builders: Array.from({length: 20}, (_, i) => ({ rera_id: `B${101+i}`, company_name: `Builder ${i+1}`, cities: "Mumbai", completed_projects: 10, ongoing_projects: 2 })),
      last_intent: "search_builders",
      has_more: true,
      total_results: { properties: 0, builders: 20 },
      suggestions: []
    }
  },
  contact_us: {
    text: "Contact us",
    action: "buffered_response",
    payload: {
      response: "I'd be happy to connect you with our team!\n\n📍 Location: Mumbai, India\n📧 Email: hello@housenseek.com\n📞 Phone: +91 123-456-7890\n\nOur team is available to assist you with any questions or schedule property visits!",
      properties: [],
      builders: [],
      last_intent: "contact",
      has_more: false,
      total_results: { properties: 0, builders: 0 },
      suggestions: []
    }
  },
  change_location: {
    text: "Different location",
    action: "buffered_response",
    payload: {
      response: "Sure! Which location are you looking for? You can type a city or area name (e.g., 'Thane', 'Mumbai', 'Andheri').",
      properties: [],
      builders: [],
      last_intent: "general",
      has_more: false,
      total_results: { properties: 0, builders: 0 },
      suggestions: []
    }
  },
  retry: {
    text: "Try again",
    action: "buffered_response",
    payload: {
      response: "I'm ready to try again! What would you like to search for now?",
      properties: [],
      builders: [],
      last_intent: "general",
      has_more: false,
      total_results: { properties: 0, builders: 0 },
      suggestions: []
    }
  }
};

const ChatBot = () => {
  const navigate = useNavigate();
  const { isChatbotOpen, setIsChatbotOpen } = useContext(ChatbotContext);
  const { user, isLoaded: isUserLoaded, isSignedIn } = useUser();

  const [messages, setMessages] = useState([]);

  // Handle initial greeting and sign-in requirement
  useEffect(() => {
    if (!isUserLoaded) return;

    if (!isSignedIn) {
      setMessages([
        {
          id: 1,
          text: "Welcome to HouseNseeK! You must be signed in to use our AI Assistant for property and builder searches.",
          sender: "bot",
          timestamp: new Date(),
          isTypingEffect: false,
          suggestions: [],
        },
      ]);
    } else {
      setMessages([
        {
          id: 1,
          text: `Hello${user?.firstName ? `, ${user.firstName}` : ""}! I'm here to help you find the perfect property. How can I assist you today?`,
          sender: "bot",
          timestamp: new Date(),
          isTypingEffect: false,
          suggestions: [
            GENERAL_RESPONSES.search_property,
            GENERAL_RESPONSES.find_builders,
            GENERAL_RESPONSES.contact_us,
          ],
        },
      ]);
    }
  }, [isUserLoaded, isSignedIn, user?.firstName]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    const initializeChat = async () => {
      if (!isUserLoaded || !isSignedIn) return;
      
      try {
        const response = await api.post(`/chatbot/session/new`, { 
          user_id: user?.id || null 
        });
        setSessionId(response.data.session_id);
      } catch (error) {
        console.error("Error creating session:", error);
      }
    };

    if (isChatbotOpen && !sessionId && isUserLoaded && isSignedIn) {
      initializeChat();
    }
  }, [isChatbotOpen, sessionId, user, isUserLoaded, isSignedIn]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e, messageText = null) => {
    e.preventDefault();
    
    if (!isSignedIn) {
      const loginMessage = {
        id: messages.length + 1,
        text: "Please sign in to send messages and get property recommendations.",
        sender: "bot",
        timestamp: new Date(),
        isTypingEffect: false,
      };
      setMessages((prev) => [...prev, loginMessage]);
      return;
    }

    const textToSend = messageText || inputMessage;
    if (!textToSend.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      text: textToSend,
      sender: "user",
      timestamp: new Date(),
      isTypingEffect: false,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    try {
      const response = await api.post(`/chatbot/ask`, {
        message: textToSend,
        session_id: sessionId,
      });

      const data = response.data;

      const botResponse = {
        id: messages.length + 2,
        text: data.response,
        sender: "bot",
        timestamp: new Date(),
        isTypingEffect: true,
        properties: data.properties || [],
        builders: data.builders || [],
        hasMore: data.has_more || false,
        totalResults: data.total_results || {},
        currentPage: data.current_page || 0,
        suggestions: generateSuggestions(data),
        stats: data.stats,
      };

      setMessages((prev) => [
        ...prev,
        {
          id: messages.length + 2,
          text: "",
          sender: "bot",
          timestamp: new Date(),
          isTypingEffect: true,
        },
      ]);

      setTimeout(() => {
        setMessages((prev) => {
          const updatedMessages = prev.map((msg) =>
            msg.id === messages.length + 2
              ? { ...botResponse, isTypingEffect: false }
              : msg,
          );
          return updatedMessages;
        });
        setIsTyping(false);
      }, 1000);
    } catch (error) {
      console.error("Error sending message:", error);

      const errorMessage = {
        id: messages.length + 2,
        text: "Sorry, I encountered an error. Please try again.",
        sender: "bot",
        timestamp: new Date(),
        isTypingEffect: false,
        suggestions: [
          GENERAL_RESPONSES.retry,
          { text: "Contact support", action: "contact_support" },
        ],
      };

      setMessages((prev) => [...prev, errorMessage]);
      setIsTyping(false);
    }
  };

  const handleLoadMore = async () => {
  if (!sessionId || isLoadingMore) return;
  
  // Find the LAST bot message that has properties or builders
  let targetIndex = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].sender === "bot" && 
        (messages[i].properties?.length > 0 || messages[i].builders?.length > 0)) {
      targetIndex = i;
      break;
    }
  }

  if (targetIndex === -1) return;
  const targetMsg = messages[targetIndex];

  // 🚀 LOCAL PAGINATION CHECK (Buffered Memory)
  if (targetMsg.allProperties && targetMsg.properties?.length < targetMsg.allProperties.length) {
      setIsLoadingMore(true);
      setTimeout(() => {
          const currentCount = targetMsg.properties.length;
          const nextBatch = targetMsg.allProperties.slice(currentCount, currentCount + 10);
          
          setMessages(prev => {
              const updated = [...prev];
              updated[targetIndex] = {
                  ...updated[targetIndex],
                  properties: [...updated[targetIndex].properties, ...nextBatch],
                  hasMore: targetMsg.allProperties.length > currentCount + 10
              };
              return updated;
          });
          setIsLoadingMore(false);
      }, 600);
      return;
  }

  if (targetMsg.allBuilders && targetMsg.builders?.length < targetMsg.allBuilders.length) {
      setIsLoadingMore(true);
      setTimeout(() => {
          const currentCount = targetMsg.builders.length;
          const nextBatch = targetMsg.allBuilders.slice(currentCount, currentCount + 10);
          
          setMessages(prev => {
              const updated = [...prev];
              updated[targetIndex] = {
                  ...updated[targetIndex],
                  builders: [...updated[targetIndex].builders, ...nextBatch],
                  hasMore: targetMsg.allBuilders.length > currentCount + 10
              };
              return updated;
          });
          setIsLoadingMore(false);
      }, 600);
      return;
  }

  // 🌍 SERVER PAGINATION (Standard Flow)
  setIsLoadingMore(true);
  try {
    const response = await api.post(`/chatbot/load-more`, { 
      session_id: sessionId 
    });

    const data = response.data;

    setMessages((prev) => {
      const updated = [...prev];
      updated[targetIndex] = {
        ...updated[targetIndex],
        properties: [
          ...(updated[targetIndex].properties || []),
          ...(data.properties || []),
        ],
        builders: [
          ...(updated[targetIndex].builders || []),
          ...(data.builders || []),
        ],
        hasMore: data.has_more,
        currentPage: data.current_page,
      };

      return updated;
    });
  } catch (error) {
    console.error("Load more error:", error);
    alert("Failed to load more results. Please try again.");
  } finally {
    setIsLoadingMore(false);
  }
};
  const generateSuggestions = (data) => {
    const suggestions = [];

    // 🚀 PRIORITIZE BUFFERED RESPONSES (Backend-generated)
    if (data.buffered_responses && data.buffered_responses.length > 0) {
      data.buffered_responses.forEach(item => {
        suggestions.push({
            text: item.label,
            action: "buffered_response",
            payload: item.payload // This contains the full pre-calculated response
        });
      });
      
      // If we have buffered responses, we can return early or mix them
      return suggestions;
    }

    // Don't show "Show more" as a suggestion chip
    // It will be a separate button

    const lowerText = data.response ? data.response.toLowerCase() : "";

    if (data.properties && data.properties.length > 0) {
      suggestions.push(GENERAL_RESPONSES.change_location);
      suggestions.push(GENERAL_RESPONSES.find_builders);
    } else if (data.builders && data.builders.length > 0) {
      suggestions.push(GENERAL_RESPONSES.search_property);
    }

    if (suggestions.length === 0) {
      suggestions.push(
        GENERAL_RESPONSES.search_property,
        GENERAL_RESPONSES.find_builders,
        GENERAL_RESPONSES.contact_us,
      );
    }

    return suggestions.slice(0, 3);
  };

  const handleSuggestionClick = (suggestion) => {
    const action = suggestion.action;
    
    // 🚀 BUFFERED RESPONSE HANDLER (No API Call)
    if (action === "buffered_response") {
        const payload = suggestion.payload;
        const userText = suggestion.text; // e.g. "Show 2 BHK homes"

        // 1. Add User Message
        const userMessage = {
            id: messages.length + 1,
            text: userText,
            sender: "user",
            timestamp: new Date(),
            isTypingEffect: false,
        };
        setMessages((prev) => [...prev, userMessage]);

        // 2. Simulate Bot Processing
        setIsTyping(true);
        
        // 3. Render Bot Response from Buffer
        setTimeout(() => {
             const botResponse = {
                id: messages.length + 2,
                text: payload.response,
                sender: "bot",
                timestamp: new Date(),
                isTypingEffect: true,
                properties: payload.properties || [],
                allProperties: payload.all_properties || [], // Store the buffer
                builders: payload.builders || [],
                allBuilders: payload.all_builders || [], // Store the buffer
                hasMore: payload.has_more || false,
                totalResults: payload.total_results || {},
                currentPage: payload.current_page || 0,
                // Generate next set of suggestions based on this new data
                suggestions: generateSuggestions({ 
                    response: payload.response, 
                    properties: payload.properties, 
                    builders: payload.builders,
                    buffered_responses: [] // Use client-side fallback for next step
                }),
                stats: payload.stats
            };

            setMessages((prev) => [
                ...prev,
                { id: messages.length + 2, text: "", sender: "bot", timestamp: new Date(), isTypingEffect: true }
            ]);

            setTimeout(() => {
                 setMessages((prev) => {
                  const updatedMessages = prev.map((msg) =>
                    msg.id === messages.length + 2
                      ? { ...botResponse, isTypingEffect: false }
                      : msg,
                  );
                  return updatedMessages;
                });
                setIsTyping(false);
            }, 1000);
            
        }, 500); 
        
        return;
    }

    // EXISTING LOGIC
    let simulatedInput = "";

    switch (action) {
      case "search_property":
        simulatedInput = "Show me available properties";
        break;
      case "find_builders":
        simulatedInput = "Show me builders";
        break;
      case "change_location":
        simulatedInput = "Show me properties in a different location";
        break;
      case "contact_us":
        simulatedInput = "Contact us";
        break;
      case "contact_support":
        simulatedInput = "I need help, contact support";
        break;
      case "retry":
        simulatedInput =
          messages[messages.length - 2]?.text || "Can you help me?";
        break;
      default:
        simulatedInput = `Tell me more about ${action}`;
    }

    setInputMessage(simulatedInput);
    setTimeout(() => {
      handleSendMessage({ preventDefault: () => {} }, simulatedInput);
    }, 100);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <div className="chatbot-trigger-container">
        <button
          className={`chatbot-trigger ${isChatbotOpen ? "hidden" : ""}`}
          onClick={() => setIsChatbotOpen(true)}
          aria-label="Open chat"
        >
          <FiMessageCircle className="chatbot-icon" />
          <span className="chatbot-pulse"></span>
        </button>
      </div>

      <div
        className={`chatbot-container ${isChatbotOpen ? "open" : ""} ${isExpanded ? "expanded" : ""}`}
      >
        <div className="chatbot-header">
          <div className="chatbot-header-content">
            <div className="chatbot-avatar">
              <FiUser className="chatbot-avatar-icon" />
            </div>
            <div className="chatbot-header-info">
              <h3 className="chatbot-title">HnS Assistant</h3>
              <p className="chatbot-status">
                {isTyping ? "Typing..." : "Online"}
              </p>
            </div>
          </div>
         <div className="chatbot-header-actions">
            <button
              className="chatbot-expand"
              onClick={() => setIsExpanded(!isExpanded)}
              aria-label="Toggle expand"
              title={isExpanded ? "Minimize" : "Expand"}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {isExpanded ? (
                  <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                ) : (
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                )}
              </svg>
            </button>

            <button
              className="chatbot-close"
              onClick={() => setIsChatbotOpen(false)}
              aria-label="Close chat"
            >
              <FiX className="chatbot-close-icon" />
            </button>
          </div>
        </div>

        <div className="chatbot-messages">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`chatbot-message ${message.sender === "user" ? "user-message" : "bot-message"}`}
            >
              <div
                className={`chatbot-message-content ${message.properties?.length > 0 || message.builders?.length > 0 ? "chatbot-message-full-width" : ""}`}
              >
                {message.sender === "bot" && message.isTypingEffect ? (
                  <div className="chatbot-typing-effect-text">
                    <TypingEffect text={message.text} />
                  </div>
                ) : (
                  <div className="chatbot-message-text" style={{ whiteSpace: 'pre-wrap' }}>{message.text}</div>
                )}

                {/* Property Cards */}
                {message.properties && message.properties.length > 0 && (
                  <div className="chatbot-property-cards-horizontal">
                    {message.properties.map((prop, idx) => (
                      <div
                        key={prop.id || idx}
                        className="chatbot-property-card-item"
                      >
                        <ChatbotPropertyCard
                          property={prop}
                          navigate={navigate}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Builder Cards */}
                {message.builders && message.builders.length > 0 && (
                  <div className="chatbot-property-cards-horizontal">
                    {message.builders.map((builder, idx) => (
                      <div
                        key={builder.rera_id || idx}
                        className="chatbot-property-card-item"
                      >
                        <ChatbotBuilderCard
                          builder={builder}
                          navigate={navigate}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Show More Button */}
                {message.hasMore && (
                  <div className="chatbot-show-more-container">
                    <button
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                      className="chatbot-show-more-btn"
                    >
                      {isLoadingMore ? (
                        <>Loading...</>
                      ) : (
                        <>
                          <FiChevronDown className="chatbot-show-more-icon" />
                          {/* Dynamic text based on content type */}
                          {message.properties?.length > 0 && message.builders?.length > 0 ? (
                            // Both properties and builders
                            <>
                              Show More ({message.totalResults?.properties || 0} total properties, {message.totalResults?.builders || 0} builders)
                            </>
                          ) : message.properties?.length > 0 ? (
                            // Only properties
                            <>
                              Show More Properties ({message.totalResults?.properties || 0} total)
                            </>
                          ) : (
                            // Only builders
                            <>
                              Show More Builders ({message.totalResults?.builders || 0} total)
                            </>
                          )}
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Suggestion Chips */}
                {message.suggestions && message.suggestions.length > 0 && (
                  <div className="chatbot-suggestions">
                    {message.suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        className="chatbot-suggestion-chip"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        {suggestion.text}
                      </button>
                    ))}
                  </div>
                )}

                <span className="chatbot-message-time">
                  {formatTime(message.timestamp)}
                </span>
              </div>
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="chatbot-input-container">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={isSignedIn ? "Ask about properties, builders, locations..." : "Please sign in to chat..."}
            className="chatbot-input"
            disabled={isTyping || !isSignedIn}
          />
          <button
            type="submit"
            className="chatbot-send"
            disabled={!inputMessage.trim() || isTyping}
            aria-label="Send message"
          >
            <FiSend className="chatbot-send-icon" />
          </button>
        </form>
      </div>
    </>
  );
};

const TypingEffect = ({ text }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prevText) => prevText + text[currentIndex]);
        setCurrentIndex((prevIndex) => prevIndex + 1);
      }, 30);
      return () => clearTimeout(timeout);
    }
  }, [text, currentIndex]);

  return <span className="chatbot-message-text">{displayedText}</span>;
};

// Property Card Component
const ChatbotPropertyCard = ({ property, navigate }) => {
  const pickProjectImage = (p) => {
    const normalizeUrl = (url) => {
      if (!url) return "";
      if (url.startsWith("http")) return url;
      return `http://localhost:5000${url.startsWith("/") ? url : `/${url}`}`;
    };

    if (p.builder_project_image) return normalizeUrl(p.builder_project_image);
    // Use a consistent random image from assets based on property ID
    return getRandomImage(p.id);
  };

  const imageUrl = pickProjectImage(property);

  // Get configurations from property
  const getConfigurations = () => {
    const config = property.Existing_Configurations;
    if (!config) return "";

    try {
      if (typeof config === "string") {
        const parsed = JSON.parse(config);
        if (Array.isArray(parsed)) {
          return parsed
            .map((c) =>
              typeof c === "object" && c !== null && c.type               // get all configurations
                ? c.type
                : String(c),
            )
            .join(", ");
        }
      }
      return String(config);                       // return configurations
    } catch (e) {
      return String(config);
    }
  };

  return (
    <div
      className="chatbot-property-card"
      onClick={async () => {
        try {
          await api.post('/chatbot/track-interaction', { property_id: property.id, action: 'clicked' });
        } catch (e) {
          console.error('Failed to track interaction', e);
        }
        navigate(`/property/${property.id}`);
      }}
      style={{ cursor: "pointer" }}
    >
      <img
        src={imageUrl}
        alt={property.Property_Name || "Property"}
        className="chatbot-property-img"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = getRandomImage(property.id);
        }}
      />
      <div className="chatbot-property-info">
        <h3 className="chatbot-property-name">
          {property.Property_Name || "Property"}
        </h3>
        <p className="chatbot-property-address">
          📍 {property.Location || "Location not specified"}
        </p>
        <div className="chatbot-property-details-row">
          {getConfigurations() && (
            <p className="chatbot-property-features">{getConfigurations()}</p>
          )}
          <p className="chatbot-property-price">
            {property.Price_Starting_From ||
              property.Pricing ||
              "Price on request"}
          </p>
        </div>
      </div>
    </div>
  );
};

// Builder Card Component
const ChatbotBuilderCard = ({ builder, navigate }) => {
  const getBuilderImage = () => {
    if (builder.logo) return builder.logo;
    // Generate a pseudo-random index from builder name or ID
    const seed = builder.rera_id ? 
      parseInt(builder.rera_id.replace(/\D/g, '') || 0) : 
      (builder.company_name ? builder.company_name.length : 0);
    return getRandomImage(seed);
  };
    
  const builderImage = getBuilderImage();

  const handleCardClick = () => {
    if (builder.rera_id) {
      const slug = builder.company_name
  ?.toLowerCase()
  .replace(/\s+/g, '-')
  .replace(/[^a-z0-9-]/g, '');

    navigate(`/builder/${slug}`);
    } else if (builder.company_name) {
      navigate(`/builders?name=${encodeURIComponent(builder.company_name)}`);
    }
  };

  return (
    <div
      className="chatbot-builder-card"
      onClick={handleCardClick}
      style={{ cursor: "pointer" }}
    >
      <img
        src={builderImage}
        alt={builder.company_name || builder.name || "Builder"}
        className="chatbot-builder-img"
        onError={(e) => {
          e.target.onerror = null;
          // Fallback to random image if logo load fails
          const seed = builder.rera_id ? 
            parseInt(builder.rera_id.replace(/\D/g, '') || 0) : 
            (builder.company_name ? builder.company_name.length : 0);
          e.target.src = getRandomImage(seed);
        }}
      />
      <div className="chatbot-builder-info">
        <h3 className="chatbot-builder-name">
          {builder.company_name || builder.name || "Builder"}
        </h3>
        {builder.rera_id && (
          <p className="chatbot-builder-rera">RERA ID: {builder.rera_id}</p>
        )}
        {(builder.completed_projects !== undefined ||
          builder.ongoing_projects !== undefined) && (
          <div className="chatbot-builder-projects-row">
            {builder.completed_projects !== undefined && (
              <p className="chatbot-builder-projects-done">
                🏗️ {builder.completed_projects} Done
              </p>
            )}
            {builder.ongoing_projects !== undefined && (
              <p className="chatbot-builder-projects-ongoing">
                🏗️ {builder.ongoing_projects} Ongoing
              </p>
            )}
          </div>
        )}
        {(builder.city || builder.cities) && (
          <p className="chatbot-builder-location">
            📍 {builder.cities || builder.city}
          </p>
        )}
      </div>
    </div>
  );
};

export default ChatBot;
