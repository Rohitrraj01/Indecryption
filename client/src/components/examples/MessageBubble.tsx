import { MessageBubble } from "../MessageBubble";

export default function MessageBubbleExample() {
  return (
    <div className="w-full max-w-2xl p-6 space-y-4">
      <MessageBubble
        content="Hey! How are you doing today?"
        timestamp={new Date()}
        isSent={false}
        isEncrypted={true}
        senderUsername="alice"
      />
      <MessageBubble
        content="I'm doing great, thanks for asking! Just working on this encrypted chat app."
        timestamp={new Date()}
        isSent={true}
        isEncrypted={true}
      />
      <MessageBubble
        content="That sounds interesting! Tell me more about it."
        timestamp={new Date()}
        isSent={false}
        isEncrypted={true}
        senderUsername="alice"
      />
    </div>
  );
}
