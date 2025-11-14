import { MessageInput } from "../MessageInput";

export default function MessageInputExample() {
  return (
    <div className="w-full max-w-2xl">
      <MessageInput
        onSend={(message) => console.log("Send message:", message)}
        recipientUsername="alice"
      />
    </div>
  );
}
