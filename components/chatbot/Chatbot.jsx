"use client";
import { useState, useEffect, useRef } from "react";
import QuickReplies from "@/components/chatbot/QuickReplies";
import { Loader2, Maximize2, Minimize2, Send, DollarSign } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

export default function Chatbot({ onClose, userData, isFullPage = false }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [loanAmountInput, setLoanAmountInput] = useState("");
  const [showLoanInput, setShowLoanInput] = useState(true);
  const chatEndRef = useRef(null);

  // Calculate total account balance
  const totalAccountBalance = userData?.accounts?.reduce(
    (sum, account) => sum + parseFloat(account.balance || 0), 
    0
  ) || 0;

  // Get budget amount if available and ensure it's a number
  const rawBudgetAmount = userData?.budgets?.[0]?.amount;
  const budgetAmount = typeof rawBudgetAmount === 'number' 
    ? rawBudgetAmount 
    : (rawBudgetAmount ? parseFloat(rawBudgetAmount) : 0);

  // Initialize loan amount separate from budget
  const [loanAmount, setLoanAmount] = useState(50000);

  // Initialize greeting with user's name if available
  useEffect(() => {
    // Check if there are saved messages and we're in full page mode
    if (isFullPage) {
      const savedMessages = localStorage.getItem('chatMessages');
      const savedLoanAmount = localStorage.getItem('chatLoanAmount');
      const savedShowLoanInput = localStorage.getItem('chatShowLoanInput');
      
      if (savedMessages) {
        try {
          setMessages(JSON.parse(savedMessages));
        } catch (e) {
          console.error('Error parsing saved messages:', e);
        }
      }
      
      if (savedLoanAmount) {
        const amount = parseFloat(savedLoanAmount);
        if (!isNaN(amount)) {
          setLoanAmount(amount);
        }
      }
      
      if (savedShowLoanInput) {
        setShowLoanInput(savedShowLoanInput === 'true');
      }
    } else {
      // Only initialize default greeting if not restoring from previous chat
      const userName = userData?.name || "farmer";
      setMessages([
        { 
          role: "bot", 
          content: `Hello ${userName}! I'm your AI farming financial assistant. Please enter your loan amount to get personalized farm budget advice. 💬` 
        }
      ]);
    }
  }, [userData?.name, isFullPage]);

  // Handle loan amount submission
  const handleLoanSubmit = (e) => {
    e.preventDefault();
    
    if (!loanAmountInput || isNaN(parseFloat(loanAmountInput))) {
      return;
    }
    
    const amount = parseFloat(loanAmountInput.replace(/,/g, ''));
    setLoanAmount(amount);
    setShowLoanInput(false);
    
    // Add messages about the loan amount
    addMessage("user", `My loan amount is $${amount.toLocaleString()}`);
    addMessage("bot", `Thank you! I'll provide recommendations based on your $${amount.toLocaleString()} loan amount. What would you like to know about optimizing your farm budget?`);
    
    setLoanAmountInput("");
  };

  // Get user's financial data from the database or use default values
  const financialData = {
    budget: budgetAmount || 12000,
    income: userData?.transactions?.filter(t => t.type === "INCOME")
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0) || 15000,
    expenses: userData?.transactions?.filter(t => t.type === "EXPENSE")
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0) || 13000,
    loanAmount: loanAmount, // Use separate loan amount
    accountBalance: totalAccountBalance
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch location and weather data on component mount
  useEffect(() => {
    const fetchLocationAndWeather = async () => {
      try {
        // Fetch location data
        const locationRes = await fetch("/api/location");
        const locationData = await locationRes.json();
        setLocation(locationData);

        // Use location coordinates to fetch weather
        if (locationData.coordinates) {
          const { lat, lon } = locationData.coordinates;
          const weatherRes = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
          const weatherData = await weatherRes.json();
          setWeatherData(weatherData);
        }
      } catch (error) {
        console.error("Error fetching location or weather:", error);
      } finally {
        setLoadingLocation(false);
      }
    };

    fetchLocationAndWeather();
  }, []);

  const addMessage = (role, content) => {
    setMessages((prev) => [...prev, { role, content }]);
  };

  // Extract loan amount from user input if mentioned
  const extractLoanAmount = (message) => {
    const loanMatch = message.match(/\$?(\d+(?:,\d+)*(?:\.\d+)?)\s?(?:loan|budget|rupees|dollars)/i);
    if (loanMatch) {
      // Remove commas and convert to number
      return parseFloat(loanMatch[1].replace(/,/g, ''));
    }
    return null;
  };

  const handleSendMessage = async (customMessage) => {
    // Use customMessage if provided, otherwise use input
    const userMessage = customMessage || input;
    
    if (!userMessage.trim()) return;

    // Add user message to chat using the addMessage function
    addMessage("user", userMessage);
    
    // Only clear input if we're using the input field (not a quick reply)
    if (!customMessage) {
      setInput('');
    }
    setLoading(true);

    try {
      // Check for loan amount in message
      const extractedLoanAmount = extractLoanAmount(userMessage);
      if (extractedLoanAmount) {
        setLoanAmount(extractedLoanAmount);
      }

      // Get the data from local storage if available
      const storedIncome = localStorage.getItem('income') || userData?.income || '0';
      const storedExpenses = localStorage.getItem('expenses') || userData?.expenses || '0';
      const storedBudget = localStorage.getItem('budget') || budgetAmount || '0';
      
      // Prepare financial data including the separate loan amount
      const financialData = {
        income: parseFloat(storedIncome) || 0,
        expenses: parseFloat(storedExpenses) || 0,
        budget: parseFloat(storedBudget) || 0,
        loanAmount: parseFloat(loanAmount) || 0, // Include loan amount as separate field
        accountBalance: totalAccountBalance || (parseFloat(storedIncome) - parseFloat(storedExpenses)) || 0
      };

      // Get user's name from userData or use a default
      const userName = userData?.name || localStorage.getItem('userName') || 'Farmer';

      try {
        // Make API request with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch('/api/gemini', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            prompt: userMessage,
            userName,
            financialData
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId); // Clear the timeout if request completes

        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }

        const data = await response.json();
        
        // Add assistant's response to chat
        addMessage("bot", data.text);
      } catch (apiError) {
        console.error('Error calling Gemini API:', apiError);
        
        // Provide a helpful fallback response
        let fallbackResponse = "I'm having trouble connecting to my services right now. ";
        
        // Give farming advice based on the query without API
        if (userMessage.toLowerCase().includes('crop')) {
          fallbackResponse += "For crop selection, consider factors like your soil type, available water, and local climate. Starting with hardy crops like beans, maize or potatoes is often safe.";
        } else if (userMessage.toLowerCase().includes('loan') || userMessage.toLowerCase().includes('budget')) {
          fallbackResponse += `With your loan of $${loanAmount.toLocaleString()}, I'd recommend allocating about 40% to seeds and planting, 30% to fertilizer and pest control, 20% to equipment, and keeping 10% as reserve.`;
        } else if (userMessage.toLowerCase().includes('fertilizer')) {
          const fertilizerSuggestions = {
            organic: [
              { name: "Dr. Earth Organic Fertilizer", price: "15-25", type: "Organic All Purpose", link: "https://www.amazon.com/Dr-Earth-Premium-Purpose-Fertilizer/dp/B003QB156K/" },
              { name: "Espoma Organic Garden-Tone", price: "20-30", type: "Organic Plant Food", link: "https://www.homedepot.com/p/Espoma-18-lb-Garden-Tone-Herb-and-Vegetable-Food-100047170/203633149" },
              { name: "Jobe's Organics Fertilizer Spikes", price: "10-15", type: "Organic Fertilizer Spikes", link: "https://www.lowes.com/pd/Jobe-s-Organics-50-Pack-Organic-All-Purpose-Fertilizer/1000203285" },
              { name: "Worm Castings Organic Fertilizer", price: "15-30", type: "Organic Soil Amendment", link: "https://www.amazon.com/Wiggle-Worm-Organic-Earthworm-Castings/dp/B000COCZCI/" }
            ],
            synthetic: [
              { name: "Miracle-Gro All Purpose", price: "15-25", type: "NPK 24-8-16", link: "https://www.walmart.com/ip/Miracle-Gro-All-Purpose-Plant-Food-Plant-Fertilizer-5-lb/16888880" },
              { name: "Scotts Turf Builder", price: "25-45", type: "Lawn Fertilizer", link: "https://www.lowes.com/pd/Scotts-Turf-Builder-12-5-lb-5000-sq-ft-30-0-3-All-Purpose-Lawn-Fertilizer/1000225017" },
              { name: "Peters 20-20-20 Fertilizer", price: "15-35", type: "Balanced NPK", link: "https://www.amazon.com/Peters-Professional-Purpose-Fertilizer-Fertilizers/dp/B01N20V3O7/" },
              { name: "Osmocote Smart-Release", price: "20-30", type: "Slow-Release", link: "https://www.homedepot.com/p/Osmocote-Smart-Release-4-lb-Indoor-Outdoor-Granules-Plant-Food-274850/204777650" }
            ]
          };
          
          // Select fertilizers based on user's query and budget
          let organicRecs = fertilizerSuggestions.organic.slice(0, 2);
          let syntheticRecs = fertilizerSuggestions.synthetic.slice(0, 2);
          
          fallbackResponse = `For your farming needs, here are some fertilizer recommendations:\n\n`;
          fallbackResponse += `**Organic Options:**\n\n`;
          
          organicRecs.forEach(fert => {
            fallbackResponse += `• ${fert.name} ($${fert.price}): ${fert.type}\n   Product link: ${fert.link}\n\n`;
          });
          
          fallbackResponse += `**Conventional Options:**\n\n`;
          
          syntheticRecs.forEach(fert => {
            fallbackResponse += `• ${fert.name} ($${fert.price}): ${fert.type}\n   Product link: ${fert.link}\n\n`;
          });
          
          fallbackResponse += `Organic options are more sustainable but may be slightly more expensive. Conventional fertilizers work faster but require more careful application. Many farmers use a combination of both for best results.`;
        } else if (userMessage.toLowerCase().includes('tool') || userMessage.toLowerCase().includes('equipment')) {
          const toolSuggestions = {
            basics: [
              { name: "Garden Hoe", price: "20-40", use: "Weeding and soil preparation", link: "https://www.tractorsupply.com/tsc/product/groundwork-garden-hoe" },
              { name: "Digging Shovel", price: "25-50", use: "Digging and transplanting", link: "https://www.homedepot.com/p/CRAFTSMAN-Fiberglass-Handle-Digging-Shovel-CMXMTLSG0009/304412762" },
              { name: "Hand Pruners", price: "15-30", use: "Pruning plants and harvesting", link: "https://www.amazon.com/Fiskars-91095935J-Softgrip-Bypass-Pruner/dp/B00004SD76/" },
              { name: "Rake", price: "15-30", use: "Clearing debris and leveling soil", link: "https://www.lowes.com/pd/Kobalt-Garden-Bow-Rake-with-Fiberglass-Handle/1000377511" },
              { name: "Watering Can", price: "15-25", use: "Targeted watering of plants", link: "https://www.walmart.com/ip/Expert-Gardener-2-Gallon-Blue-Watering-Can/509245937" }
            ],
            intermediate: [
              { name: "Wheelbarrow", price: "60-120", use: "Moving soil, compost, and harvests", link: "https://www.ruralking.com/true-temper-6-cu-ft-steel-wheelbarrow-with-flat-free-tire" },
              { name: "Drip Irrigation System", price: "50-200", use: "Efficient watering", link: "https://www.amazon.com/Raindrip-R560DP-Automatic-Container-Hanging/dp/B00J2NRSIQ/" },
              { name: "Garden Tiller", price: "200-500", use: "Soil preparation", link: "https://www.tractorsupply.com/tsc/product/yard-machines-208cc-21-in-front-tine-tiller-21aa40m1000" },
              { name: "Protective Gear", price: "50-100", use: "Gloves, boots, hat, eyewear", link: "https://www.amazon.com/Exemplary-Gardens-Gloves-Gardening-Protection/dp/B07BHPJL95/" }
            ],
            advanced: [
              { name: "Small Tractor", price: "1,500+", use: "Larger plot cultivation", link: "https://www.deere.com/en/tractors/compact-tractors/1-series-sub-compact-tractors/" },
              { name: "Rotary Cultivator", price: "300-800", use: "Weed control between rows", link: "https://www.northerntool.com/shop/tools/product_200631482_200631482" },
              { name: "Sprayer System", price: "100-400", use: "Pest and disease control", link: "https://www.ruralking.com/northstar-31-gallon-tow-behind-boom-broadcast-sprayer" }
            ]
          };
          
          // Select tools based on loan amount
          let recommendedTools = [];
          if (loanAmount < 5000) {
            recommendedTools = toolSuggestions.basics.slice(0, 4);
          } else if (loanAmount < 15000) {
            recommendedTools = [...toolSuggestions.basics.slice(0, 3), ...toolSuggestions.intermediate.slice(0, 2)];
          } else {
            recommendedTools = [...toolSuggestions.basics.slice(0, 2), ...toolSuggestions.intermediate.slice(0, 2), toolSuggestions.advanced[0]];
          }
          
          fallbackResponse = `With your loan of $${loanAmount.toLocaleString()}, here are the best farming tools to invest in:\n\n`;
          
          recommendedTools.forEach(tool => {
            fallbackResponse += `• ${tool.name} ($${tool.price}): ${tool.use}\n   Product link: ${tool.link}\n\n`;
          });
          
          fallbackResponse += `Start with the essential hand tools, then add powered equipment as your farm grows. You can find more options at farm supply stores like Tractor Supply Co. or Rural King.`;
        } else {
          fallbackResponse += "Please try asking your question again later when my connection is restored.";
        }
        
        addMessage("bot", fallbackResponse);
      }
    } catch (error) {
      console.error('Error in message handling:', error);
      addMessage("bot", "I apologize for the technical difficulty. Please try again with a different question.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSendMessage();
  };

  const openFullPage = () => {
    // Save current messages to localStorage before navigating
    localStorage.setItem('chatMessages', JSON.stringify(messages));
    localStorage.setItem('chatLoanAmount', loanAmount.toString());
    localStorage.setItem('chatShowLoanInput', showLoanInput.toString());
    router.push('/farm-assistant');
  };

  // Determine height based on full page mode or floating mode
  const chatHeight = isFullPage ? "h-[80vh]" : "h-[600px]";
  const chatWidth = isFullPage ? "w-full max-w-4xl mx-auto" : "w-full";

  const renderMessageWithLinks = (text) => {
    if (!text) return '';
    
    // Regular expression to match URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    
    // Split the text by URLs and create an array of text and link elements
    const parts = text.split(urlRegex);
    const matches = text.match(urlRegex) || [];
    
    // Combine text parts with link elements
    const result = [];
    parts.forEach((part, i) => {
      if (part) {
        result.push(<span key={`text-${i}`}>{part}</span>);
      }
      if (matches[i]) {
        result.push(
          <a 
            key={`link-${i}`} 
            href={matches[i]} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 underline break-all"
          >
            {matches[i]}
          </a>
        );
      }
    });
    
    return result;
  };

  return (
    <div className={`bg-green-50/30 rounded-2xl border border-green-200 shadow-xl p-4 ${chatHeight} flex flex-col ${chatWidth}`}>
      <div className="flex justify-between items-center mb-3 bg-green-700 text-white p-3 rounded-lg">
        <h2 className="font-bold text-lg flex items-center">
          <span className="mr-2">🌱</span> {t('farmAssistant.title')}
        </h2>
        <div className="flex items-center gap-2">
          {!isFullPage && (
            <button 
              onClick={openFullPage} 
              className="text-white/80 hover:text-white transition-colors"
              aria-label="Open in full page"
            >
              <Maximize2 className="w-5 h-5" />
            </button>
          )}
          <button 
            onClick={onClose || (() => router.back())} 
            className="text-white/80 hover:text-white transition-colors"
            aria-label="Close"
          >
            {isFullPage ? <Minimize2 className="w-5 h-5" /> : "✖️"}
          </button>
        </div>
      </div>
      
      {userData && (
        <div className="p-3 mb-3 bg-white rounded-lg shadow-inner">
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-sm flex items-center">
                <span className="mr-1">👨‍🌾</span> {userData.name || "Guest Farmer"}
              </span>
              <span className="text-sm bg-blue-100 px-2 py-1 rounded-full">
                💼 Account: ${(totalAccountBalance || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-sm bg-green-100 px-2 py-1 rounded-full">
                📊 Budget: ${(budgetAmount || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </span>
              <span className="text-sm bg-amber-100 px-2 py-1 rounded-full">
                💰 Loan: ${(loanAmount || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </span>
            </div>
          </div>
        </div>
      )}
      
      {loadingLocation && (
        <div className="flex items-center justify-center p-2 mb-2 bg-white rounded-lg">
          <Loader2 className="w-4 h-4 mr-2 animate-spin text-green-700" />
          <span className="text-xs">Loading your location data...</span>
        </div>
      )}
      
      {location && weatherData && !loadingLocation && (
        <div className="p-3 mb-3 bg-white rounded-lg shadow-inner">
          <div className="flex justify-between items-center">
            <span className="text-sm flex items-center">
              <span className="mr-1">📍</span> 
              {location.city || location.region}, {location.country}
            </span>
            <span className="text-sm bg-blue-50 px-2 py-1 rounded-full">
              🌡️ {Math.round(weatherData.main?.temp || 0)}°C, {weatherData.weather?.[0]?.main || "Clear"}
            </span>
          </div>
        </div>
      )}

      {showLoanInput && (
        <div className="mb-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
          <h3 className="font-medium text-sm mb-2 text-amber-800">Enter your loan amount to start</h3>
          <form onSubmit={handleLoanSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign className="h-4 w-4 text-gray-500" />
              </div>
              <input
                type="text"
                className="block w-full rounded-md pl-9 border-gray-300 shadow-sm focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50 bg-white h-9 text-sm"
                placeholder="10,000"
                value={loanAmountInput}
                onChange={(e) => {
                  // Allow only numbers, commas and decimal points
                  const value = e.target.value.replace(/[^0-9,.]/g, '');
                  setLoanAmountInput(value);
                }}
              />
            </div>
            <button
              type="submit"
              className="bg-green-700 text-white px-3 py-2 rounded-md text-sm hover:bg-green-800 transition-colors"
            >
              Submit
            </button>
          </form>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-2 pr-1 mb-3 bg-white p-3 rounded-lg shadow-inner">
        {messages.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">👨‍🌾</div>
            <p>Welcome! I'm your farm assistant.</p>
            <p className="text-sm mt-1">Ask me anything about farming, tools, or your budget.</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`p-2 rounded-lg text-sm whitespace-pre-wrap ${
              msg.role === "user" || msg.sender === "user"
                ? "bg-blue-100 self-end ml-auto max-w-[80%]"
                : "bg-green-50 border border-green-100 self-start mr-auto max-w-[80%]"
            }`}
          >
            <div className="flex flex-col">
              <span className={`text-xs mb-1 ${msg.role === "user" || msg.sender === "user" ? "text-blue-600" : "text-green-600"}`}>
                {msg.role === "user" || msg.sender === "user" ? "You" : "Farm Buddy"}
              </span>
              <span>{renderMessageWithLinks(msg.content || msg.text)}</span>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center text-sm text-gray-500 p-2">
            <Loader2 className="w-3 h-3 mr-2 animate-spin" />
            Typing...
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="mt-2 mb-2 flex-shrink-0">
        <QuickReplies onSend={handleSendMessage} isCompact={messages.length > 1} />
      </div>

      <form onSubmit={handleSubmit} className="flex mt-1 flex-shrink-0">
        <input
          className="flex-1 p-2 rounded-l-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('farmAssistant.askQuestion')}
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-green-700 text-white px-3 py-2 rounded-r-lg text-sm hover:bg-green-800 disabled:bg-green-400 transition-colors flex items-center"
        >
          <Send className="w-4 h-4 mr-1" />
          {t('farmAssistant.send')}
        </button>
      </form>
    </div>
  );
} 
