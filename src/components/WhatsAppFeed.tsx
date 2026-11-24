import { useEffect, useRef, useState } from 'react';
import { CheckCheck, ChevronDown, ChevronUp, MessageCircle } from 'lucide-react';

export interface ChatMessage {
  id: string;
  sender: 'owner' | 'rebeca';
  text: string;
  time: string;
}

interface WhatsAppFeedProps {
  messages: ChatMessage[];
  isTyping: boolean;
}

export function WhatsAppFeed({ messages, isTyping }: WhatsAppFeedProps) {
  const [avatarError, setAvatarError] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const latestMessage = messages[messages.length - 1];

  return (
    <>
      {/* Mobile Compact Live Notification Strip (<= 15% viewport height cap) */}
      <div className="lg:hidden w-full">
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          className="w-full px-3.5 py-2.5 rounded-2xl bg-[#E7F8ED] border-2 border-[#241F31] shadow-[0_3px_0_#241F31] flex items-center justify-between gap-3 text-left cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <MessageCircle className="w-5 h-5 text-[#059669] shrink-0" />
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-[#065F46]">
                {isTyping ? 'Dono do Ovo está digitando...' : 'WhatsApp · Dono do Ovo'}
              </div>
              <div className="text-sm font-semibold text-[#241F31] truncate">
                {latestMessage ? `${latestMessage.sender === 'owner' ? 'Dono' : 'Rebeca'}: ${latestMessage.text}` : 'Fica de olho no ovo, Rebeca!'}
              </div>
            </div>
          </div>
          {mobileOpen ? <ChevronUp className="w-5 h-5 shrink-0" /> : <ChevronDown className="w-5 h-5 shrink-0" />}
        </button>

        {mobileOpen && (
          <div className="mt-2 p-3 rounded-2xl bg-[#EFEAE2] border-2 border-[#241F31] max-h-56 overflow-y-auto space-y-2">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col max-w-[85%] px-3 py-2 rounded-xl text-sm border border-[#241F31]/15 ${
                  msg.sender === 'rebeca'
                    ? 'ml-auto bg-[#D9FDD3] text-[#111B21]'
                    : 'mr-auto bg-white text-[#111B21]'
                }`}
              >
                <span className="text-[10px] font-bold text-[#54656F] mb-0.5">
                  {msg.sender === 'owner' ? 'Dono do Ovo' : 'Rebeca (Você)'}
                </span>
                <span>{msg.text}</span>
                <span className="text-[10px] text-[#667781] self-end mt-0.5 flex items-center gap-1">
                  {msg.time}
                  {msg.sender === 'rebeca' && <CheckCheck className="w-3 h-3 text-[#53BDEB]" />}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Desktop Full WhatsApp Chat Column */}
      <aside className="hidden lg:flex flex-col h-[580px] indie-card rounded-3xl overflow-hidden bg-[#EFEAE2]">
        {/* WhatsApp Top Bar */}
        <div className="px-4 py-3 bg-[#075E54] text-white flex items-center gap-3 border-b-2 border-[#241F31]">
          {!avatarError ? (
            <img
              src="/src/assets/images/rebeca_owner_avatar_1795480737013.jpg"
              alt="Dono do Ovo"
              referrerPolicy="no-referrer"
              onError={() => setAvatarError(true)}
              className="w-10 h-10 rounded-full object-cover border-2 border-white shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#FFE4E8] text-[#241F31] flex items-center justify-center font-bold border-2 border-white shrink-0">
              😰
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="font-display font-bold text-base truncate">Dono do Ovo 🥚</div>
            <div className="text-xs text-emerald-100 truncate">
              {isTyping ? 'digitando...' : 'online · vigiando a Rebeca'}
            </div>
          </div>
        </div>

        {/* Messages Feed */}
        <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-2.5">
          <div className="text-center text-[11px] font-semibold text-[#54656F] py-1">
            Conversa exclusiva com Rebeca
          </div>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col max-w-[86%] px-3.5 py-2.5 rounded-2xl text-sm shadow-xs border border-[#241F31]/10 ${
                msg.sender === 'rebeca'
                  ? 'ml-auto bg-[#D9FDD3] rounded-tr-xs text-[#111B21]'
                  : 'mr-auto bg-white rounded-tl-xs text-[#111B21]'
              }`}
            >
              <span className="text-[11px] font-bold text-[#075E54] mb-0.5">
                {msg.sender === 'owner' ? 'Dono do Ovo' : 'Rebeca'}
              </span>
              <span className="leading-snug">{msg.text}</span>
              <span className="text-[10px] text-[#667781] self-end mt-1 flex items-center gap-1 font-mono-nums">
                {msg.time}
                {msg.sender === 'rebeca' && <CheckCheck className="w-3.5 h-3.5 text-[#53BDEB]" />}
              </span>
            </div>
          ))}

          {isTyping && (
            <div className="mr-auto bg-white px-3.5 py-2 rounded-2xl rounded-tl-xs text-xs font-semibold text-[#54656F] border border-[#241F31]/10">
              Dono do Ovo está digitando...
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
