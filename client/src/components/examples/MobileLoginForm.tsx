import { MobileLoginForm } from "../MobileLoginForm";

export default function MobileLoginFormExample() {
  return (
    <MobileLoginForm
      onSubmit={(username, mobile) => console.log("Login:", { username, mobile })}
    />
  );
}
