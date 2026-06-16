"use client";

import { useEffect, useRef, useState } from "react";
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
  conversationKey?: string;
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

const buildIntroMessage = (peerName: string): ChatMessage => ({
  id: "m1",
  fromMe: false,
  text: `Xin chào, mình là ${peerName}.`,
  time: getTime(-15),
  read: true,
});

const ChatDialog = ({
  open,
  onOpenChange,
  conversationKey,
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
    initialMessages?.length ? initialMessages : [buildIntroMessage(peerName)],
  );
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastConversationKeyRef = useRef("");

  useEffect(() => {
    if (!open) {
      return;
    }

    const nextConversationKey = String(conversationKey ?? peerName).trim();
    if (lastConversationKeyRef.current === nextConversationKey) {
      return;
    }

    lastConversationKeyRef.current = nextConversationKey;
    setMessages(
      initialMessages?.length ? initialMessages : [buildIntroMessage(peerName)],
    );
  }, [conversationKey, initialMessages, open, peerName]);

  useEffect(() => {
    if (!open || !initialMessages?.length) {
      return;
    }

    setMessages((prev) => {
      const byId = new Map(prev.map((message) => [message.id, message]));

      for (const message of initialMessages) {
        byId.set(message.id, {
          ...byId.get(message.id),
          ...message,
        });
      }

      const next = Array.from(byId.values());
      const isSame =
        next.length === prev.length &&
        next.every((message, index) => {
          const current = prev[index];
          return (
            current &&
            current.id === message.id &&
            current.text === message.text &&
            current.time === message.time &&
            current.read === message.read &&
            current.fromMe === message.fromMe
          );
        });

      return isSame ? prev : next;
    });
  }, [initialMessages, open]);

  useEffect(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    });
  }, [messages, isTyping]);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }

    const optimisticMessage: ChatMessage = {
      id: `m-${Date.now()}`,
      fromMe: true,
      text: trimmed,
      time: getTime(0),
      read: false,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setInput("");

    if (onSend) {
      setIsTyping(true);
      onSend(trimmed)
        .then((response: Partial<ChatMessage> | void) => {
          setIsTyping(false);

          if (!response || !(response as Partial<ChatMessage>).text) {
            return;
          }

          setMessages((prev) => [
            ...prev.map((message) =>
              message.fromMe ? { ...message, read: true } : message,
            ),
            {
              id: String((response as { _id?: string })._id ?? `s-${Date.now()}`),
              fromMe: false,
              text: String((response as { text?: string }).text ?? autoReply),
              time: getTime(0),
              read: true,
            },
          ]);
        })
        .catch(() => setIsTyping(false));
      return;
    }

    setIsTyping(true);
    window.setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev.map((message) =>
          message.fromMe ? { ...message, read: true } : message,
        ),
        {
          id: `r-${Date.now()}`,
          fromMe: false,
          text: autoReply,
          time: getTime(0),
          read: true,
        },
      ]);
    }, 1400);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-border bg-card p-4">
          <DialogTitle className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              {peerInitial ?? peerName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-sm font-semibold">{peerName}</p>
              <p className="truncate text-xs font-normal text-muted-foreground">
                {peerSubtitle ?? "Đang hoạt động"}
              </p>
            </div>
            {peerPhone && (
              <a
                href={`tel:${peerPhone}`}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary/20"
                aria-label="Gọi điện"
              >
                <Phone size={16} />
              </a>
            )}
          </DialogTitle>
        </DialogHeader>

        <div
          ref={scrollRef}
          className="h-[420px] space-y-3 overflow-y-auto bg-muted/30 px-4 py-4"
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.fromMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${
                  message.fromMe
                    ? "rounded-br-sm bg-primary text-primary-foreground"
                    : "rounded-bl-sm border border-border bg-card text-foreground"
                }`}
              >
                <p className="whitespace-pre-wrap break-words leading-relaxed">
                  {message.text}
                </p>
                <div
                  className={`mt-1 flex items-center gap-1 text-[10px] ${
                    message.fromMe
                      ? "justify-end text-primary-foreground/70"
                      : "text-muted-foreground"
                  }`}
                >
                  <span>{message.time}</span>
                  {message.fromMe && (
                    <CheckCheck
                      size={12}
                      className={message.read ? "text-blue-200" : "opacity-60"}
                    />
                  )}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-sm border border-border bg-card px-3.5 py-2.5 shadow-sm">
                <div className="flex items-center gap-1">
                  <span
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {quickReplies.length > 0 && (
          <div className="flex gap-2 overflow-x-auto border-t border-border bg-card px-3 pb-1 pt-2">
            {quickReplies.map((reply) => (
              <button
                key={reply}
                onClick={() => send(reply)}
                className="shrink-0 rounded-full bg-muted px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-muted/70"
              >
                {reply}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={(event) => {
            event.preventDefault();
            send(input);
          }}
          className="flex items-center gap-2 border-t border-border bg-card p-3"
        >
          <Input
            value={input}
            onChange={(event) => setInput(event.target.value)}
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
  const date = new Date(Date.now() + offsetMinutes * 60_000);
  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default ChatDialog;
