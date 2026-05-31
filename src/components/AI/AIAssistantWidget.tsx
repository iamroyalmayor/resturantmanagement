import { useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'ai';
  text: string;
}

export function AIAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      text: 'Hi! I\'m your AI Assistant. How can I help you today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const suggestionPrompts = [
    '📊 Show pending orders',
    '⏰ Peak hours today',
    '📦 Low stock items',
    '⚠️ Kitchen delays',
  ];

  const handleSendMessage = () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      text: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponses: Record<string, string> = {
        'pending': '📋 You have 8 pending orders. 3 are being prepared, 2 are ready for pickup, and 3 are awaiting confirmation.',
        'peak': '⏰ Peak hours today are 12-2 PM and 7-9 PM. Prepare for high volume orders.',
        'stock': '📦 Low stock warning: Tomatoes (2 units), Mozzarella (1 unit), Olive Oil (low)',
        'kitchen': '⚠️ Kitchen is running 15 minutes behind. 2 orders have delays due to high volume.',
        'default': 'I can help you with: pending orders, peak hours, stock levels, and kitchen status. What would you like to know?',
      };

      let response = aiResponses.default;
      if (input.toLowerCase().includes('pending') || input.toLowerCase().includes('order')) {
        response = aiResponses.pending;
      } else if (input.toLowerCase().includes('peak') || input.toLowerCase().includes('hour')) {
        response = aiResponses.peak;
      } else if (input.toLowerCase().includes('stock') || input.toLowerCase().includes('low')) {
        response = aiResponses.stock;
      } else if (input.toLowerCase().includes('kitchen') || input.toLowerCase().includes('delay')) {
        response = aiResponses.kitchen;
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        text: response,
      };

      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
    }, 800);
  };

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt.split(' ').slice(1).join(' '));
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      text: prompt.split(' ').slice(1).join(' '),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        text: 'Great question! I\'ve analyzed the data and here are my recommendations...',
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
    }, 800);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full p-4 shadow-lg hover:shadow-2xl hover:scale-110 transition transform z-40"
        title="Open AI Assistant"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-8 right-8 w-96 bg-white rounded-lg shadow-2xl flex flex-col h-96 z-40">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-t-lg flex justify-between items-center">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          <span className="font-semibold">AI Assistant</span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="hover:bg-orange-700 p-1 rounded"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <MessageCircle className="w-12 h-12 text-gray-300 mb-2" />
            <p className="text-gray-500 text-sm">Start a conversation</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  msg.type === 'user'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-200 text-gray-900'
                }`}
              >
                <p className="text-sm">{msg.text}</p>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 text-gray-900 px-4 py-2 rounded-lg">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Suggestions */}
      {messages.length === 1 && (
        <div className="px-4 py-3 border-t border-gray-200 bg-white">
          <p className="text-xs font-semibold text-gray-600 mb-2">Try asking about:</p>
          <div className="grid grid-cols-2 gap-2">
            {suggestionPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickPrompt(prompt)}
                className="text-xs bg-gray-100 hover:bg-orange-100 text-gray-700 hover:text-orange-700 px-2 py-1 rounded transition"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Ask me anything..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        <button
          onClick={handleSendMessage}
          disabled={isLoading}
          className="bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-lg transition disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
