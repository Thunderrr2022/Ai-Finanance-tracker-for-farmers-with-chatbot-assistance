export default function MessageBubble({ sender, text }) {
    const isUser = sender === 'user';
    return (
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-[80%] px-4 py-2 rounded-xl text-sm ${isUser ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
          {text}
        </div>
      </div>
    );
  }
  