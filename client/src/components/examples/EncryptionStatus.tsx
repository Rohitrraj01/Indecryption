import { EncryptionStatus } from "../EncryptionStatus";

export default function EncryptionStatusExample() {
  return (
    <div className="w-80 p-4">
      <EncryptionStatus
        yourPublicKey="AbCdEf1234567890XyZAbCdEf1234567890XyZ"
        recipientPublicKey="1234567890AbCdEfXyZ1234567890AbCdEf"
        recipientUsername="alice"
      />
    </div>
  );
}
