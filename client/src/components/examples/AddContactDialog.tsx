import { AddContactDialog } from "../AddContactDialog";

export default function AddContactDialogExample() {
  return (
    <div className="p-6">
      <AddContactDialog
        onAddContact={(userId, nickname) => 
          console.log("Add contact:", { userId, nickname })
        }
      />
    </div>
  );
}
