"use client";
import { useState, useEffect } from "react";
import { Bot, X } from "lucide-react";
import Chatbot from "@/components/chatbot/Chatbot";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@clerk/nextjs";

export default function FloatingButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const { user, isLoaded } = useUser();

  useEffect(() => {
    // Fetch user data if the user is logged in and chatbot is open
    const fetchUserData = async () => {
      if (isLoaded && user && isOpen) {
        try {
          const response = await fetch(`/api/users/${user.id}`);
          if (response.ok) {
            const data = await response.json();
            setUserData(data);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    };

    fetchUserData();
  }, [user, isOpen, isLoaded]);

  const toggleChatbot = () => setIsOpen((prev) => !prev);

  return (
    <>
      <button
        onClick={toggleChatbot}
        className="fixed bottom-6 right-6 z-50 bg-green-600 text-white p-4 rounded-full shadow-lg hover:bg-green-700 transition-all duration-300"
        aria-label="Open farm finance assistant"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="chatbot"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-20 right-6 z-40 w-[400px] sm:w-[450px] md:w-[500px]"
          >
            <Chatbot 
              onClose={toggleChatbot} 
              userData={userData} 
              isFullPage={false}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
