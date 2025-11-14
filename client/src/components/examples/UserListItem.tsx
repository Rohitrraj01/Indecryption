import { UserListItem } from "../UserListItem";

export default function UserListItemExample() {
  return (
    <div className="w-80 p-4 space-y-2">
      <UserListItem
        username="alice"
        publicKey="AbCdEf1234567890XyZ"
        isOnline={true}
        isSelected={false}
        onClick={() => console.log("User clicked")}
      />
      <UserListItem
        username="bob"
        publicKey="1234567890AbCdEfXyZ"
        isOnline={true}
        isSelected={true}
        onClick={() => console.log("User clicked")}
      />
      <UserListItem
        username="charlie"
        publicKey="XyZ1234567890AbCdEf"
        isOnline={false}
        onClick={() => console.log("User clicked")}
      />
    </div>
  );
}
