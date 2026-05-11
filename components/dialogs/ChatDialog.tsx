import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Phone, CheckCheck } from "lucide-react";

export interface ChatMessage {
  id: string;
  fromMe: boolean;
  text: string;
  time: string;
  read?: boolean;
}

interface ChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  peerName: string;
  peerSubtitle?: string;
  peerInitial?: string;
  peerPhone?: string;
  initialMessages?: ChatMessage[];
  onSend?: (text: string) => Promise<Partial<ChatMessage> | void>;
  quickReplies?: string[];
  autoReply?: string;
}

const defaultQuickReplies = [
  "Bạn đang ở đâu rồi?",
  "Mình đến trễ 5 phút nhé",
  "Cảm ơn bạn!",
];

const ChatDialog = ({
  open,
  onOpenChange,
  peerName,
  peerSubtitle,
  peerInitial,
  peerPhone,
  initialMessages,
  onSend,
  quickReplies = defaultQuickReplies,
  autoReply = "Mình đã nhận được tin nhắn, sẽ phản hồi ngay nhé!",
}: ChatDialogProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>(
    initialMessages ?? [
      {
        id: "m1",
        fromMe: false,
        text: `Xin chào, mình là ${peerName}.`,
        time: getTime(-15),
        read: true,
      },
    ],
  );
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    if (initialMessages && initialMessages.length > 0) {
      setMessages(initialMessages);
      return;
    }

    setMessages([
      {
        id: "m1",
        fromMe: false,
        text: `Xin chào, mình là ${peerName}.`,
        time: getTime(-15),
        read: true,
      },
    ]);
  }, [open, initialMessages, peerName]);

  useEffect(() => {
    // auto-scroll to bottom on new message
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
  }, [messages, isTyping]);

  const send = (text: string) => {
    const t = text.trim();
    if (!t) return;
    const msg: ChatMessage = {
      id: `m-${Date.now()}`,
      fromMe: true,
      text: t,
      time: getTime(0),
      read: false,
    };
    setMessages((prev) => [...prev, msg]);
    setInput("");

    if (onSend) {
      setIsTyping(true);
      onSend(t)
        .then((res: Partial<ChatMessage> | void) => {
          setIsTyping(false);
          if (res && (res as Partial<ChatMessage>).text) {
            // append server message if any (server echo)
            setMessages((prev) => [
              ...prev.map((m) => (m.fromMe ? { ...m, read: true } : m)),
              {
                id: String((res as any)._id ?? `s-${Date.now()}`),
                fromMe: false,
                text: String((res as any).text ?? autoReply),
                time: getTime(0),
                read: true,
              },
            ]);
          }
        })
        .catch(() => setIsTyping(false));
    } else {
      // mock peer reply when no onSend provided (demo)
      setIsTyping(true);
      window.setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev.map((m) => (m.fromMe ? { ...m, read: true } : m)),
          {
            id: `r-${Date.now()}`,
            fromMe: false,
            text: autoReply,
            time: getTime(0),
            read: true,
          },
        ]);
      }, 1400);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 border-b border-border bg-card">
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
              {peerInitial ?? peerName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-semibold truncate">{peerName}</p>
              <p className="text-xs text-muted-foreground font-normal truncate">
                {peerSubtitle ?? "Đang hoạt động"}
              </p>
            </div>
            {peerPhone && (
              <a
                href={`tel:${peerPhone}`}
                className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                aria-label="Gọi điện"
              >
                <Phone size={16} />
              </a>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Messages */}
        <div ref={scrollRef} className="h-[420px] overflow-y-auto bg-muted/30 px-4 py-4 space-y-3">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.fromMe ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${
                  m.fromMe
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-card text-foreground rounded-bl-sm border border-border"
                }`}
              >
                <p className="whitespace-pre-wrap break-words leading-relaxed">{m.text}</p>
                <div
                  className={`flex items-center gap-1 mt-1 text-[10px] ${
                    m.fromMe ? "text-primary-foreground/70 justify-end" : "text-muted-foreground"
                  }`}
                >
                  <span>{m.time}</span>
                  {m.fromMe && (
                    <CheckCheck size={12} className={m.read ? "text-blue-200" : "opacity-60"} />
                  )}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-3.5 py-2.5 shadow-sm">
                <div className="flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick replies */}
        {quickReplies.length > 0 && (
          <div className="px-3 pt-2 pb-1 flex gap-2 overflow-x-auto bg-card border-t border-border">
            {quickReplies.map((q) => (
              <button
                key={q}
                onClick={() => send(q)}
                className="shrink-0 text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/70 text-foreground transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-center gap-2 p-3 bg-card border-t border-border"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Nhập tin nhắn..."
            className="flex-1"
            autoFocus
          />
          <Button type="submit" size="icon" disabled={!input.trim()}>
            <Send size={16} />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

function getTime(offsetMinutes: number) {
  const d = new Date(Date.now() + offsetMinutes * 60_000);
  return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

export default ChatDialog;
