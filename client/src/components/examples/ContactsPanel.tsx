import { ContactsPanel } from "../ContactsPanel";

export default function ContactsPanelExample() {
  const mockContacts = [
    { id: "1", username: "alice", nickname: "Alice W.", publicKey: "AbCdEf1234567890", isOnline: true, unreadCount: 3 },
    { id: "2", username: "bob", publicKey: "1234567890AbCdEf", isOnline: true },
    { id: "3", username: "charlie", nickname: "Chuck", publicKey: "XyZ1234567890Ab", isOnline: false },
  ];

  const mockAllUsers = [
    ...mockContacts,
    { id: "4", username: "david", publicKey: "Abc123XyZ456", isOnline: true },
    { id: "5", username: "eve", publicKey: "XyZ456Abc123", isOnline: false },
  ];

  return (
    <div className="h-screen w-80 border-r">
      <ContactsPanel
        contacts={mockContacts}
        allUsers={mockAllUsers}
        onSelectContact={(contact) => console.log("Selected:", contact)}
        onAddContact={(userId, nickname) => console.log("Add:", { userId, nickname })}
      />
    </div>
  );
}
