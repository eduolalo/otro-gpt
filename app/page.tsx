"use client";

import { useState, useRef, useEffect, FormEvent, KeyboardEvent } from "react";
import { Send, Trash2, Bot } from "lucide-react";
import ReactMarkdown from "react-markdown";

// --- Future feature imports (uncomment when ready) ---
// import { Image as ImageIcon, Volume2, Mic } from "lucide-react";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // --- Future feature state (uncomment when ready) ---
  // const [imagePrompt, setImagePrompt] = useState("");
  // const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  // const [isRecording, setIsRecording] = useState(false);
  // const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const sendMessage = async (e?: FormEvent) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = { role: "user", content: trimmed };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      const data = await res.json();

      if (data.error) {
        setMessages([
          ...updatedMessages,
          { role: "assistant", content: `Error: ${data.error}` },
        ]);
      } else {
        setMessages([...updatedMessages, data.message]);
      }
    } catch {
      setMessages([
        ...updatedMessages,
        {
          role: "assistant",
          content: "Error: No se pudo conectar con el servidor.",
        },
      ]);
    } finally {
      setIsLoading(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setInput("");
    textareaRef.current?.focus();
  };

  // --- Future: Image Generation (uncomment when ready) ---
  // const generateImage = async () => {
  //   if (!imagePrompt.trim()) return;
  //   setIsLoading(true);
  //   try {
  //     const res = await fetch("/api/image", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ prompt: imagePrompt }),
  //     });
  //     const data = await res.json();
  //     if (data.images?.[0]?.url) {
  //       setGeneratedImage(data.images[0].url);
  //     }
  //   } catch (err) {
  //     console.error("Image generation failed:", err);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  // --- Future: Text-to-Speech (uncomment when ready) ---
  // const speakText = async (text: string) => {
  //   try {
  //     const res = await fetch("/api/tts", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ text }),
  //     });
  //     const blob = await res.blob();
  //     const url = URL.createObjectURL(blob);
  //     setAudioUrl(url);
  //     const audio = new Audio(url);
  //     audio.play();
  //   } catch (err) {
  //     console.error("TTS failed:", err);
  //   }
  // };

  // --- Future: Speech-to-Text (uncomment when ready) ---
  // const startRecording = async () => {
  //   try {
  //     const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  //     const mediaRecorder = new MediaRecorder(stream);
  //     const chunks: Blob[] = [];
  //     mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
  //     mediaRecorder.onstop = async () => {
  //       const blob = new Blob(chunks, { type: "audio/webm" });
  //       const formData = new FormData();
  //       formData.append("audio", blob, "recording.webm");
  //       const res = await fetch("/api/stt", { method: "POST", body: formData });
  //       const data = await res.json();
  //       if (data.text) setInput(data.text);
  //       stream.getTracks().forEach((t) => t.stop());
  //     };
  //     mediaRecorder.start();
  //     setIsRecording(true);
  //     setTimeout(() => {
  //       mediaRecorder.stop();
  //       setIsRecording(false);
  //     }, 10000);
  //   } catch (err) {
  //     console.error("Recording failed:", err);
  //   }
  // };

  return (
    <div className="flex h-dvh flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground">
            <Bot className="h-4.5 w-4.5 text-background" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight">otro-GPT</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* --- Future feature buttons (uncomment when ready) --- */}
          {/* <button
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Generar imagen"
          >
            <ImageIcon className="h-4.5 w-4.5" />
          </button> */}
          {/* <button
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Text to Speech"
          >
            <Volume2 className="h-4.5 w-4.5" />
          </button> */}
          {/* <button
            className={`rounded-lg p-2 transition-colors ${isRecording ? "bg-red-500/10 text-red-500" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            title="Speech to Text"
            onClick={startRecording}
          >
            <Mic className="h-4.5 w-4.5" />
          </button> */}
          <button
            onClick={clearChat}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Limpiar chat"
          >
            <Trash2 className="h-4.5 w-4.5" />
          </button>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
          {messages.length === 0 && !isLoading && (
            <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                <Bot className="h-7 w-7 text-muted-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-semibold tracking-tight">
                  Hola, soy otro-GPT
                </h2>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Escribe un mensaje para comenzar la conversación.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] ${
                    msg.role === "user"
                      ? "rounded-2xl rounded-br-md bg-user-bubble px-4 py-2.5 text-user-bubble-text"
                      : "prose-chat text-foreground"
                  }`}
                >
                  {msg.role === "user" ? (
                    <p className="whitespace-pre-wrap text-[0.9375rem] leading-relaxed">
                      {msg.content}
                    </p>
                  ) : (
                    <div className="text-[0.9375rem] leading-relaxed">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 px-1 py-2">
                  <span className="typing-dot h-2 w-2 rounded-full bg-muted-foreground" />
                  <span className="typing-dot h-2 w-2 rounded-full bg-muted-foreground" />
                  <span className="typing-dot h-2 w-2 rounded-full bg-muted-foreground" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </main>

      {/* Input */}
      <footer className="border-t border-border bg-background">
        <form
          onSubmit={sendMessage}
          className="mx-auto flex max-w-2xl items-end gap-3 px-4 py-4 sm:px-6"
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje..."
            rows={1}
            className="flex-1 resize-none rounded-xl border border-border bg-muted px-4 py-3 text-[0.9375rem] leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-foreground/20 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-foreground text-background transition-opacity hover:opacity-80 disabled:opacity-30"
          >
            <Send className="h-4.5 w-4.5" />
          </button>
        </form>
      </footer>
    </div>
  );
}
