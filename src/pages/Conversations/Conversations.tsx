import React, { useEffect, useMemo, useState } from 'react';
import { MessageCircle, Send, Phone, Mail, User, CheckCircle2, AlertCircle } from 'lucide-react';

interface Conversation {
  id: string;
  customerName: string;
  source: 'whatsapp' | 'instagram' | 'website';
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  avatar?: string;
  status?: string;
  activeOrder?: { id: string; status: string; total: string };
}

interface Message {
  id: string;
  sender: 'customer' | 'bot';
  content: string;
  timestamp: string;
}

const initialConversations: Conversation[] = [
  {
    id: '1',
    customerName: 'Sarah Johnson',
    source: 'whatsapp',
    lastMessage: 'Can I modify my order?',
    timestamp: '2 min ago',
    unread: true,
    avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100',
    activeOrder: { id: 'ORD-2024-001', status: 'preparing', total: '$45.99' },
  },
  {
    id: '2',
    customerName: 'Michael Chen',
    source: 'website',
    lastMessage: 'Great service! Will order again',
    timestamp: '1 hour ago',
    unread: false,
    status: 'resolved',
  },
  {
    id: '3',
    customerName: 'Emma Wilson',
    source: 'instagram',
    lastMessage: 'Are you open on Sundays?',
    timestamp: '3 hours ago',
    unread: true,
  },
  {
    id: '4',
    customerName: 'John Davis',
    source: 'whatsapp',
    lastMessage: 'Order received! Thanks!',
    timestamp: '5 hours ago',
    unread: false,
  },
  {
    id: '5',
    customerName: 'Lisa Martinez',
    source: 'website',
    lastMessage: 'Can I place a large group order?',
    timestamp: '1 day ago',
    unread: false,
  },
];

const initialMessages: Record<string, Message[]> = {
  '1': [
    { id: '1', sender: 'customer', content: 'Hi! I just placed an order. Can I modify it?', timestamp: '2:30 PM' },
    { id: '2', sender: 'bot', content: 'Hello! 👋 Thanks for ordering. I can help you modify your order. What would you like to change?', timestamp: '2:31 PM' },
    { id: '3', sender: 'customer', content: 'I want to add extra cheese to my pizza', timestamp: '2:32 PM' },
    { id: '4', sender: 'bot', content: "✓ I've noted that. Extra cheese will be added to your pizza. This will add $2.50 to your order.", timestamp: '2:32 PM' },
  ],
  '2': [
    { id: '1', sender: 'customer', content: 'Great service! Will order again', timestamp: '11:15 AM' },
    { id: '2', sender: 'bot', content: 'Thank you for your kind words! We look forward to serving you again.', timestamp: '11:17 AM' },
  ],
  '3': [
    { id: '1', sender: 'customer', content: 'Are you open on Sundays?', timestamp: '9:08 AM' },
    { id: '2', sender: 'bot', content: 'Yes, we are open Sunday from 12 PM to 10 PM.', timestamp: '9:10 AM' },
  ],
  '4': [
    { id: '1', sender: 'customer', content: 'Order received! Thanks!', timestamp: '4:20 PM' },
    { id: '2', sender: 'bot', content: 'You are welcome! Your order will be ready shortly.', timestamp: '4:22 PM' },
  ],
  '5': [
    { id: '1', sender: 'customer', content: 'Can I place a large group order?', timestamp: '1:05 PM' },
    { id: '2', sender: 'bot', content: 'Absolutely! We can prepare a special menu for your group. How many guests?', timestamp: '1:08 PM' },
  ],
};

const aiSuggestions = [
  'Show pending orders',
  'Confirm delivery address',
  'Suggest payment methods',
  'Offer to call customer',
];

const sourceIcons: Record<string, React.ReactNode> = {
  whatsapp: '💬',
  instagram: '📷',
  website: '🌐',
};

const sourceColors: Record<string, string> = {
  whatsapp: 'bg-green-100 text-green-800',
  instagram: 'bg-pink-100 text-pink-800',
  website: 'bg-blue-100 text-blue-800',
};

export function Conversations() {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messagesByConversation, setMessagesByConversation] = useState<Record<string, Message[]>>(initialMessages);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    if (!selectedConversation && conversations.length) {
      setSelectedConversation(conversations[0].id);
    }
  }, [selectedConversation, conversations]);

  const selectedConv = useMemo(
    () => conversations.find((conv) => conv.id === selectedConversation) ?? null,
    [conversations, selectedConversation],
  );

  const selectedMessages = useMemo(
    () => (selectedConversation ? messagesByConversation[selectedConversation] ?? [] : []),
    [messagesByConversation, selectedConversation],
  );

  const handleSendMessage = () => {
    if (!selectedConversation || !newMessage.trim()) {
      return;
    }

    const message: Message = {
      id: Date.now().toString(),
      sender: 'customer',
      content: newMessage.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessagesByConversation((current) => ({
      ...current,
      [selectedConversation]: [...(current[selectedConversation] || []), message],
    }));

    setConversations((current) =>
      current.map((conv) =>
        conv.id === selectedConversation
          ? { ...conv, lastMessage: newMessage.trim(), timestamp: 'Now', unread: false }
          : conv,
      ),
    );

    setNewMessage('');

    setTimeout(() => {
      const botReply: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        content: 'Thanks for the update! I have shared that with the kitchen and your order is being adjusted.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessagesByConversation((current) => ({
        ...current,
        [selectedConversation]: [...(current[selectedConversation] || []), botReply],
      }));
    }, 600);
  };

  const handleSelectConversation = (id: string) => {
    setSelectedConversation(id);
    setConversations((current) =>
      current.map((conv) => (conv.id === id ? { ...conv, unread: false } : conv)),
    );
  };

  const handleSetSuggestion = (suggestion: string) => {
    setNewMessage(suggestion);
  };

  return (
    <div className="h-screen flex bg-gray-50">
      <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-orange-600" />
            Conversations
          </h2>
          <div className="text-sm text-gray-500 mt-1">
            {conversations.filter((conv) => conv.unread).length} unread
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => handleSelectConversation(conv.id)}
              className={`w-full p-4 border-b border-gray-100 text-left hover:bg-gray-50 transition ${
                selectedConversation === conv.id ? 'bg-orange-50 border-l-4 border-l-orange-600' : ''
              }`}
            >
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  {conv.avatar ? (
                    <img src={conv.avatar} alt={conv.customerName} className="w-10 h-10 rounded-full" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-xl">
                      {sourceIcons[conv.source]}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`font-semibold truncate ${conv.unread ? 'text-gray-900' : 'text-gray-700'}`}>
                      {conv.customerName}
                    </p>
                    {conv.unread && <div className="w-2 h-2 bg-orange-600 rounded-full flex-shrink-0" />}
                  </div>
                  <p className={`text-sm truncate ${conv.unread ? 'text-gray-600 font-medium' : 'text-gray-500'}`}>
                    {conv.lastMessage}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${sourceColors[conv.source]}`}>
                      {sourceIcons[conv.source]} {conv.source}
                    </span>
                    <span className="text-xs text-gray-500">{conv.timestamp}</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col border-r border-gray-200 bg-white">
        {selectedConv ? (
          <>
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-yellow-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {selectedConv.avatar ? (
                    <img src={selectedConv.avatar} alt={selectedConv.customerName} className="w-10 h-10 rounded-full" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-xl">
                      {sourceIcons[selectedConv.source]}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">{selectedConv.customerName}</p>
                    <p className="text-xs text-gray-600">
                      {sourceIcons[selectedConv.source]} {selectedConv.source} • {selectedConv.timestamp}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <Phone className="w-5 h-5 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <Mail className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'customer' ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      msg.sender === 'customer'
                        ? 'bg-gray-100 text-gray-900'
                        : 'bg-orange-600 text-white'
                    }`}
                  >
                    <p>{msg.content}</p>
                    <p className={`text-xs mt-1 ${msg.sender === 'customer' ? 'text-gray-600' : 'text-orange-100'}`}>
                      {msg.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p>Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {selectedConv && (
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
          {selectedConv.activeOrder && (
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" /> Active Order
              </h3>
              <div className="bg-orange-50 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Order ID</p>
                  <p className="font-semibold text-gray-900">{selectedConv.activeOrder.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <div className="flex items-center gap-2 mt-1">
                    <CheckCircle2 className="w-4 h-4 text-orange-600" />
                    <p className="font-semibold text-gray-900 capitalize">{selectedConv.activeOrder.status}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-orange-600">{selectedConv.activeOrder.total}</p>
                </div>
                <button className="w-full bg-orange-600 text-white py-2 rounded hover:bg-orange-700 text-sm font-medium">
                  View Details
                </button>
              </div>
            </div>
          )}

          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-orange-600" />
              Customer Details
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-gray-600">Name</p>
                <p className="font-medium text-gray-900">{selectedConv.customerName}</p>
              </div>
              <div>
                <p className="text-gray-600">Channel</p>
                <p className="font-medium text-gray-900 capitalize">{sourceIcons[selectedConv.source]} {selectedConv.source}</p>
              </div>
              {selectedConv.status && (
                <div>
                  <p className="text-gray-600">Status</p>
                  <p className="font-medium text-green-600 capitalize">{selectedConv.status}</p>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 flex-1 overflow-y-auto">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              Quick Actions
            </h3>
            <div className="space-y-2">
              {aiSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleSetSuggestion(suggestion)}
                  className="w-full text-left px-4 py-2 bg-gray-50 hover:bg-orange-50 rounded-lg text-sm font-medium text-gray-700 hover:text-orange-700 transition"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
