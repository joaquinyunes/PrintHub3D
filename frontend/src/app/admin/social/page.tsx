"use client";

import React, { useEffect, useState, useRef } from 'react';
import { Search, Send, ShoppingCart, User, MessageCircle, Instagram, Facebook } from 'lucide-react';
import { apiUrl } from '@/lib/api';

// Tipos de datos
interface ChatPreview {
  _id: string; // El ID del cliente
  lastMessage: string;
  senderName: string;
  platform: 'whatsapp' | 'instagram' | 'facebook';
  timestamp: string;
}

interface Message {
  _id: string;
  body: string;
  isMine: boolean;
  timestamp: string;
}

export default function SocialHubPage() {
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatPreview | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Cargar la lista de contactos
  const fetchChats = async () => {
    try {
        const stored = localStorage.getItem("user");
        const token = stored ? JSON.parse(stored).token : null;
        const res = await fetch(apiUrl('/api/chats'), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        setChats(data);
    } catch (err) { console.error(err); }
  };

  // Cargar al inicio y cada 5 segs (polling simple)
  useEffect(() => {
    fetchChats();
    const interval = setInterval(fetchChats, 5000);
    return () => clearInterval(interval);
  }, []);

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  // 2. Cargar mensajes cuando seleccionas a alguien
  useEffect(() => {
    if (selectedChat) {
        const stored = localStorage.getItem("user");
        const token = stored ? JSON.parse(stored).token : null;
        fetch(apiUrl(`/api/chats/${selectedChat._id}`), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
          .then(res => res.json())
          .then(data => {
              setMessages(data);
              scrollToBottom();
          });
    }
  }, [selectedChat]);

  // 3. ENVIAR MENSAJE
  const handleSendMessage = async () => {
    if (!inputText.trim() || !selectedChat) return;

    try {
        const stored = localStorage.getItem("user");
        const token = stored ? JSON.parse(stored).token : null;
        const res = await fetch(apiUrl('/api/chats/send'), {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
                to: selectedChat._id,
                message: inputText,
                platform: selectedChat.platform // Enviamos por la misma red que nos habló
            })
        });

        if (res.ok) {
            const newMsg = await res.json();
            setMessages([...messages, newMsg]); // Agregamos visualmente
            setInputText("");
            scrollToBottom();
            fetchChats(); // Actualizar lista lateral
        }
    } catch (error) {
        alert("Error al enviar mensaje");
    }
  };

  // HELPER: Icono según red social
  const getPlatformIcon = (platform: string) => {
    switch (platform) {
        case 'whatsapp': return <MessageCircle className="h-4 w-4 text-green-400" />;
        case 'instagram': return <Instagram className="h-4 w-4 text-pink-500" />;
        case 'facebook': return <Facebook className="h-4 w-4 text-blue-500" />;
        default: return <User className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex h-[calc(100vh-140px)] bg-card border border-white/10 rounded-xl overflow-hidden shadow-2xl">
      
      {/* 👈 BARRA LATERAL (LISTA DE CONTACTOS) */}
      <div className="w-80 border-r border-white/10 flex flex-col bg-black/20">
        <div className="p-4 border-b border-white/10">
          <h2 className="font-bold text-lg mb-4">Mensajería</h2>
          <div className="relative">
             <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
             <input placeholder="Buscar chat..." className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm outline-none" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {chats.map((chat) => (
            <div 
              key={chat._id}
              onClick={() => setSelectedChat(chat)}
              className={`p-4 border-b border-white/5 cursor-pointer hover:bg-white/5 flex gap-3 transition ${selectedChat?._id === chat._id ? 'bg-white/10 border-l-2 border-l-primary' : ''}`}
            >
              <div className="relative">
                <div className="h-10 w-10 rounded-full bg-gray-800 flex items-center justify-center font-bold text-sm text-white">
                  {chat.senderName.charAt(0).toUpperCase()}
                </div>
                {/* Icono flotante de la red social */}
                <div className="absolute -bottom-1 -right-1 bg-black rounded-full p-0.5 border border-white/20">
                    {getPlatformIcon(chat.platform)}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm text-white truncate">{chat.senderName}</span>
                  <span className="text-[10px] text-muted-foreground">{new Date(chat.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-1">{chat.lastMessage}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 👉 ZONA DE CHAT */}
      <div className="flex-1 flex flex-col bg-black/40 relative">
        {selectedChat ? (
          <>
            {/* Header */}
            <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-card/50 backdrop-blur-md">
              <div className="flex items-center gap-3">
                 <div className="h-9 w-9 rounded-full bg-gray-700 flex items-center justify-center font-bold">
                    {selectedChat.senderName.charAt(0)}
                 </div>
                 <div>
                    <h3 className="font-bold text-sm flex items-center gap-2">
                        {selectedChat.senderName}
                        {getPlatformIcon(selectedChat.platform)}
                    </h3>
                    <span className="text-xs text-green-400">En línea</span>
                 </div>
              </div>
              
              <button 
                onClick={() => window.location.href = '/admin/orders'} 
                className="bg-primary text-black px-4 py-2 rounded-lg font-bold text-sm hover:bg-primary/90 flex items-center gap-2"
              >
                <ShoppingCart className="h-4 w-4" /> Crear Pedido
              </button>
            </div>

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm shadow-md ${
                    msg.isMine 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-white/10 text-white rounded-tl-none border border-white/10'
                  }`}>
                    <p>{msg.body}</p>
                    <span className="text-[10px] opacity-50 block text-right mt-1">
                       {new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10 bg-card/50">
               <div className="flex gap-2 bg-black/50 border border-white/10 rounded-xl p-2 focus-within:border-primary/50 transition">
                 <input 
                    className="flex-1 bg-transparent border-none outline-none text-sm px-2 text-white"
                    placeholder={`Escribe un mensaje en ${selectedChat.platform}...`}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                 />
                 <button onClick={handleSendMessage} className="p-2 bg-primary text-black rounded-lg hover:bg-primary/90">
                    <Send className="h-4 w-4" />
                 </button>
               </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground opacity-50">
             <MessageCircle className="h-20 w-20 mb-4 stroke-1" />
             <p>Selecciona un chat para comenzar</p>
          </div>
        )}
      </div>
    </div>
  );
}