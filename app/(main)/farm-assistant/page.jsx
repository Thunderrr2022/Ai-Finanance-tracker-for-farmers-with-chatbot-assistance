"use client";

import Chatbot from "@/components/chatbot/Chatbot";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";

export default function FarmAssistantPage() {
  const [userData, setUserData] = useState(null);
  const { user, isLoaded } = useUser();

  useEffect(() => {
    // Fetch user data if the user is logged in
    const fetchUserData = async () => {
      if (isLoaded && user) {
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
  }, [user, isLoaded]);

  return (
    <div className="py-8 px-4">
      <h1 className="text-2xl font-bold text-center mb-6">Farm Finance AI Assistant</h1>
      <Chatbot userData={userData} isFullPage={true} />
    </div>
  );
} 