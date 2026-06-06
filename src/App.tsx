/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  Calendar, 
  CheckSquare, 
  MessageSquare, 
  FileText, 
  IndianRupee, 
  Timer, 
  User as UserIcon, 
  LogOut, 
  Plus, 
  Trash2, 
  Send, 
  Mic, 
  Download, 
  Camera,
  Menu,
  X,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  Save
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { analyzeTimetable, processTodoVoice, chatWithAI, generateNotes } from "./services/gemini.ts";
import { jsPDF } from "jspdf";
import { format } from "date-fns";

// --- Types ---
interface User {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
}
interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: any;
}

interface FinanceRecord {
  id: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  description: string;
  date: any;
}

interface TimetableSlot {
  time: string;
  subject: string;
  location?: string;
}

interface TimetableData {
  [day: string]: TimetableSlot[];
}

// --- Components ---

const Sidebar = ({ activeTab, setActiveTab, user, onLogout }: { activeTab: string, setActiveTab: (tab: string) => void, user: User, onLogout: () => void }) => {
  const tabs = [
    { id: "timetable", icon: Calendar, label: "Timetable" },
    { id: "todo", icon: CheckSquare, label: "To-Do List" },
    { id: "chat", icon: MessageSquare, label: "AI Chat" },
    { id: "notes", icon: FileText, label: "AI Notes" },
    { id: "finance", icon: IndianRupee, label: "Finance" },
    { id: "focus", icon: Timer, label: "Focus Timer" },
    { id: "profile", icon: UserIcon, label: "Profile" },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      <div className="p-6 border-b border-gray-100">
        <h1 className="text-xl font-bold text-indigo-600 flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">S</div>
          Student AI Hub
        </h1>
      </div>
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === tab.id 
                ? "bg-indigo-50 text-indigo-600 font-medium" 
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <tab.icon size={20} />
            {tab.label}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
          <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} alt="Profile" className="w-10 h-10 rounded-full border border-white shadow-sm" />
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium text-gray-900 truncate">{user.displayName}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
          <button onClick={onLogout} className="text-gray-400 hover:text-red-500 transition-colors">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main App Component ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("timetable");

  useEffect(() => {
    const savedUser = localStorage.getItem("student_hub_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = () => {
    const mockUser = {
      uid: "mock-user-123",
      displayName: "Student User",
      email: "student@example.com",
      photoURL: null
    };
    setUser(mockUser);
    localStorage.setItem("student_hub_user", JSON.stringify(mockUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("student_hub_user");
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50 p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl text-center"
        >
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white text-4xl font-bold mx-auto mb-6 shadow-lg shadow-indigo-200">S</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-500 mb-8">Your all-in-one AI student companion. Sign in to get started.</p>
          <button 
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 py-4 rounded-2xl font-medium text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
          >
            <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white text-[10px]">S</div>
            Get Started
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex bg-gray-50 overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} user={user} onLogout={handleLogout} />
      <main className="flex-1 overflow-y-auto relative">
        <div className="p-8 max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === "timetable" && <TimetableTab user={user} />}
            {activeTab === "todo" && <TodoTab user={user} />}
            {activeTab === "chat" && <ChatTab user={user} />}
            {activeTab === "notes" && <NotesTab user={user} />}
            {activeTab === "finance" && <FinanceTab user={user} />}
            {activeTab === "focus" && <FocusTab />}
            {activeTab === "profile" && <ProfileTab user={user} />}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// --- Tab Components ---

const TimetableTab = ({ user }: { user: User }) => {
  const [timetable, setTimetable] = useState<TimetableData | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(`timetable_${user.uid}`);
    if (saved) {
      setTimetable(JSON.parse(saved));
    }
  }, [user.uid]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAnalyzing(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(",")[1];
      try {
        const result = await analyzeTimetable(base64);
        setTimetable(result.days);
        localStorage.setItem(`timetable_${user.uid}`, JSON.stringify(result.days));
      } catch (error) {
        console.error("Analysis failed:", error);
      } finally {
        setAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Your Timetable</h2>
          <p className="text-gray-500">Upload an image of your schedule to digitize it.</p>
        </div>
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={analyzing}
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
        >
          {analyzing ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div> : <Camera size={20} />}
          {analyzing ? "Analyzing..." : "Upload Image"}
        </button>
        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
      </div>

      {!timetable ? (
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-20 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="text-gray-400" size={32} />
          </div>
          <p className="text-gray-500">No timetable found. Upload an image to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {days.map(day => timetable[day] && (
            <div key={day} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-indigo-600 mb-4">{day}</h3>
              <div className="space-y-4">
                {timetable[day].map((slot, i) => (
                  <div key={i} className="flex gap-4 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="text-xs font-bold text-gray-400 w-16 pt-1">{slot.time}</div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{slot.subject}</p>
                      {slot.location && <p className="text-xs text-gray-500">{slot.location}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

const TodoTab = ({ user }: { user: User }) => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(`todos_${user.uid}`);
    if (saved) {
      setTodos(JSON.parse(saved));
    }
  }, [user.uid]);

  const saveTodos = (newTodos: Todo[]) => {
    setTodos(newTodos);
    localStorage.setItem(`todos_${user.uid}`, JSON.stringify(newTodos));
  };

  const addTodo = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newTodo.trim()) return;
    const todo: Todo = {
      id: Date.now().toString(),
      text: newTodo,
      completed: false,
      createdAt: { seconds: Math.floor(Date.now() / 1000) }
    };
    saveTodos([todo, ...todos]);
    setNewTodo("");
  };

  const toggleTodo = (id: string, completed: boolean) => {
    const newTodos = todos.map(t => t.id === id ? { ...t, completed: !completed } : t);
    saveTodos(newTodos);
  };

  const deleteTodo = (id: string) => {
    const newTodos = todos.filter(t => t.id !== id);
    saveTodos(newTodos);
  };

  const handleVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Speech recognition not supported in this browser.");
    
    const recognition = new SpeechRecognition();
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      const processed = await processTodoVoice(transcript);
      setNewTodo(processed);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.start();
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <h2 className="text-2xl font-bold text-gray-900 mb-8">To-Do List</h2>
      
      <form onSubmit={addTodo} className="flex gap-3 mb-8">
        <div className="flex-1 relative">
          <input 
            type="text" 
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="What needs to be done?"
            className="w-full bg-white border border-gray-200 px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          />
          <button 
            type="button"
            onClick={handleVoice}
            className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-colors ${isListening ? "bg-red-50 text-red-500" : "text-gray-400 hover:bg-gray-50"}`}
          >
            <Mic size={20} className={isListening ? "animate-pulse" : ""} />
          </button>
        </div>
        <button type="submit" className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">
          Add Task
        </button>
      </form>

      <div className="space-y-3">
        {todos.map(todo => (
          <div key={todo.id} className="group flex items-center gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <button 
              onClick={() => toggleTodo(todo.id, todo.completed)}
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${todo.completed ? "bg-green-500 border-green-500 text-white" : "border-gray-200"}`}
            >
              {todo.completed && <CheckSquare size={14} />}
            </button>
            <p className={`flex-1 text-gray-700 ${todo.completed ? "line-through text-gray-400" : ""}`}>{todo.text}</p>
            <button onClick={() => deleteTodo(todo.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
              <Trash2 size={18} />
            </button>
          </div>
        ))}
        {todos.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <CheckSquare size={48} className="mx-auto mb-4 opacity-20" />
            <p>Your list is empty. Add a task to get started!</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const ChatTab = ({ user }: { user: User }) => {
  const [messages, setMessages] = useState<{ role: "user" | "ai", text: string, image?: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(scrollToBottom, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !selectedImage) return;

    const userMsg = { role: "user" as const, text: input, image: selectedImage || undefined };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setSelectedImage(null);
    setLoading(true);

    try {
      const aiResponse = await chatWithAI(input, userMsg.image?.split(",")[1]);
      setMessages(prev => [...prev, { role: "ai", text: aiResponse }]);
    } catch (error) {
      console.error("Chat failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setSelectedImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-[calc(100vh-160px)] flex flex-col">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">AI Study Assistant</h2>
      
      <div className="flex-1 overflow-y-auto space-y-6 mb-6 pr-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${msg.role === "user" ? "bg-indigo-600 text-white rounded-tr-none" : "bg-white text-gray-800 border border-gray-100 rounded-tl-none"}`}>
              {msg.image && <img src={msg.image} alt="User upload" className="max-w-full rounded-lg mb-2" />}
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 rounded-tl-none flex gap-2">
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleSend} className="bg-white p-4 rounded-3xl border border-gray-200 shadow-lg">
        {selectedImage && (
          <div className="relative inline-block mb-4">
            <img src={selectedImage} alt="Preview" className="h-20 rounded-xl" />
            <button onClick={() => setSelectedImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md">
              <X size={12} />
            </button>
          </div>
        )}
        <div className="flex gap-3">
          <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 text-gray-400 hover:bg-gray-50 rounded-xl transition-colors">
            <Camera size={24} />
          </button>
          <input type="file" ref={fileInputRef} onChange={handleImageSelect} className="hidden" accept="image/*" />
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything..."
            className="flex-1 focus:outline-none text-gray-700"
          />
          <button type="submit" disabled={loading} className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-md disabled:opacity-50">
            <Send size={20} />
          </button>
        </div>
      </form>
    </motion.div>
  );
};

const NotesTab = ({ user }: { user: User }) => {
  const [content, setContent] = useState("");
  const [notes, setNotes] = useState<{ summary: string, questions: string[] } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!content.trim()) return;
    setLoading(true);
    try {
      const result = await generateNotes(content);
      setNotes(result);
    } catch (error) {
      console.error("Notes generation failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    if (!notes) return;
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Study Notes", 20, 20);
    doc.setFontSize(12);
    doc.text("Summary:", 20, 40);
    const splitSummary = doc.splitTextToSize(notes.summary, 170);
    doc.text(splitSummary, 20, 50);
    
    let y = 50 + (splitSummary.length * 7);
    doc.text("Important Questions:", 20, y + 10);
    notes.questions.forEach((q, i) => {
      const splitQ = doc.splitTextToSize(`${i + 1}. ${q}`, 170);
      doc.text(splitQ, 20, y + 20 + (i * 10));
    });
    
    doc.save("study-notes.pdf");
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <h2 className="text-2xl font-bold text-gray-900 mb-8">AI Notes Generator</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <textarea 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste your lecture content or textbook text here..."
            className="w-full h-96 bg-white border border-gray-200 p-6 rounded-3xl focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm resize-none"
          />
          <button 
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div> : <FileText size={20} />}
            {loading ? "Generating..." : "Generate Notes"}
          </button>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm min-h-[400px] flex flex-col">
          {notes ? (
            <div className="flex-1 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900">Generated Notes</h3>
                <button onClick={downloadPDF} className="text-indigo-600 flex items-center gap-1 text-sm font-medium hover:underline">
                  <Download size={16} /> Download PDF
                </button>
              </div>
              <div>
                <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-2">Summary</h4>
                <p className="text-gray-600 text-sm leading-relaxed">{notes.summary}</p>
              </div>
              <div>
                <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-2">Key Questions</h4>
                <ul className="space-y-2">
                  {notes.questions.map((q, i) => (
                    <li key={i} className="flex gap-3 text-sm text-gray-600">
                      <span className="text-indigo-400 font-bold">{i + 1}.</span>
                      {q}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <FileText size={48} className="mb-4 opacity-20" />
              <p>Your generated notes will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const FinanceTab = ({ user }: { user: User }) => {
  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(`finances_${user.uid}`);
    if (saved) {
      setRecords(JSON.parse(saved));
    }
  }, [user.uid]);

  const saveRecords = (newRecords: FinanceRecord[]) => {
    setRecords(newRecords);
    localStorage.setItem(`finances_${user.uid}`, JSON.stringify(newRecords));
  };

  const addRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    const record: FinanceRecord = {
      id: Date.now().toString(),
      amount: parseFloat(amount),
      type,
      category,
      description,
      date: { seconds: Math.floor(Date.now() / 1000) }
    };
    saveRecords([record, ...records]);
    setAmount("");
    setCategory("");
    setDescription("");
  };

  const totalBalance = records.reduce((acc, rec) => rec.type === "income" ? acc + rec.amount : acc - rec.amount, 0);

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Finance Manager</h2>
        <div className="bg-indigo-600 text-white px-6 py-3 rounded-2xl shadow-lg shadow-indigo-100">
          <p className="text-xs opacity-80">Total Balance</p>
          <p className="text-xl font-bold">₹{totalBalance.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <form onSubmit={addRecord} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 mb-2">Add Transaction</h3>
            <div className="flex bg-gray-50 p-1 rounded-xl">
              <button 
                type="button" 
                onClick={() => setType("expense")}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${type === "expense" ? "bg-white text-red-500 shadow-sm" : "text-gray-400"}`}
              >
                Expense
              </button>
              <button 
                type="button" 
                onClick={() => setType("income")}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${type === "income" ? "bg-white text-green-500 shadow-sm" : "text-gray-400"}`}
              >
                Income
              </button>
            </div>
            <input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount (₹)"
              className="w-full bg-gray-50 border-none px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500"
            />
            <input 
              type="text" 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Category (e.g. Food, Books)"
              className="w-full bg-gray-50 border-none px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500"
            />
            <input 
              type="text" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
              className="w-full bg-gray-50 border-none px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500"
            />
            <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all">
              Save Transaction
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-3">
          {records.map(rec => (
            <div key={rec.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${rec.type === "income" ? "bg-green-50 text-green-500" : "bg-red-50 text-red-500"}`}>
                  {rec.type === "income" ? <Plus size={20} /> : <ChevronRight size={20} className="rotate-90" />}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{rec.category || "General"}</p>
                  <p className="text-xs text-gray-500">{rec.description}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-bold ${rec.type === "income" ? "text-green-500" : "text-red-500"}`}>
                  {rec.type === "income" ? "+" : "-"} ₹{rec.amount.toLocaleString()}
                </p>
                <p className="text-[10px] text-gray-400">{rec.date ? format(new Date(rec.date.seconds * 1000), "MMM d, h:mm a") : ""}</p>
              </div>
            </div>
          ))}
          {records.length === 0 && (
            <div className="text-center py-20 text-gray-400">
              <IndianRupee size={48} className="mx-auto mb-4 opacity-20" />
              <p>No transactions yet. Start managing your money!</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const FocusTab = () => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<"work" | "break">("work");

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      const nextMode = mode === "work" ? "break" : "work";
      setMode(nextMode);
      setTimeLeft(nextMode === "work" ? 25 * 60 : 5 * 60);
      setIsActive(false);
      alert(nextMode === "work" ? "Break finished! Time to work." : "Work session finished! Take a break.");
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === "work" ? 25 * 60 : 5 * 60);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col items-center justify-center py-20">
      <h2 className="text-2xl font-bold text-gray-900 mb-12">Focus Timer</h2>
      
      <div className="relative w-80 h-80 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90">
          <circle cx="160" cy="160" r="150" fill="none" stroke="#EEF2FF" strokeWidth="12" />
          <circle 
            cx="160" cy="160" r="150" fill="none" stroke="#4F46E5" strokeWidth="12" 
            strokeDasharray={2 * Math.PI * 150}
            strokeDashoffset={2 * Math.PI * 150 * (1 - timeLeft / (mode === "work" ? 25 * 60 : 5 * 60))}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute text-center">
          <p className="text-sm font-bold text-indigo-600 uppercase tracking-widest mb-2">{mode === "work" ? "Focus" : "Break"}</p>
          <p className="text-6xl font-bold text-gray-900 tabular-nums">
            {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
          </p>
        </div>
      </div>

      <div className="flex gap-6 mt-12">
        <button onClick={resetTimer} className="p-4 bg-white text-gray-400 rounded-2xl border border-gray-100 shadow-sm hover:text-indigo-600 transition-all">
          <RotateCcw size={24} />
        </button>
        <button 
          onClick={toggleTimer} 
          className={`w-20 h-20 rounded-3xl flex items-center justify-center text-white shadow-xl transition-all ${isActive ? "bg-red-500 shadow-red-100" : "bg-indigo-600 shadow-indigo-100"}`}
        >
          {isActive ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
        </button>
        <div className="w-14" /> {/* Spacer */}
      </div>

      <div className="mt-12 flex gap-4">
        <button 
          onClick={() => { setMode("work"); setTimeLeft(25 * 60); setIsActive(false); }}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${mode === "work" ? "bg-indigo-600 text-white" : "bg-white text-gray-500 border border-gray-100"}`}
        >
          Work (25m)
        </button>
        <button 
          onClick={() => { setMode("break"); setTimeLeft(5 * 60); setIsActive(false); }}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${mode === "break" ? "bg-indigo-600 text-white" : "bg-white text-gray-500 border border-gray-100"}`}
        >
          Break (5m)
        </button>
      </div>
    </motion.div>
  );
};

const ProfileTab = ({ user }: { user: User }) => {
  const [displayName, setDisplayName] = useState(user.displayName || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    try {
      const updatedUser = { ...user, displayName };
      localStorage.setItem("student_hub_user", JSON.stringify(updatedUser));
      alert("Profile updated!");
      window.location.reload(); // Refresh to update all references
    } catch (error) {
      console.error("Update failed:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-8">Your Profile</h2>
      
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-8">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} alt="Profile" className="w-32 h-32 rounded-3xl border-4 border-white shadow-xl" />
            <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-2 rounded-xl shadow-lg">
              <Camera size={20} />
            </div>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-gray-900">{user.displayName}</p>
            <p className="text-gray-500">{user.email}</p>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-gray-50">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Display Name</label>
            <input 
              type="text" 
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-gray-50 border-none px-6 py-4 rounded-2xl focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
            <input 
              type="text" 
              value={user.email || ""} 
              disabled 
              className="w-full bg-gray-100 border-none px-6 py-4 rounded-2xl text-gray-500 cursor-not-allowed"
            />
          </div>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
          >
            {isSaving ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div> : <Save size={20} />}
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </motion.div>
  );
};
