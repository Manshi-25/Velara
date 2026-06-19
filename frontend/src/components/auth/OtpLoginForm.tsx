import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  email: string;
  setEmail: (v: string) => void;
  otp?: string;
  setOtp?: (v: string) => void;
  handleAction: any;
  title: string;
  buttonText: string;
};

export default function OtpLoginForm({
  email,
  setEmail,
  otp,
  setOtp,
  handleAction,
  title,
  buttonText
}: Props) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleAction();
      }}
      className="space-y-4"
    >
      <h2 className="text-center text-xl font-semibold">
        {title}
      </h2>

      <Input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      {setOtp && (
        <Input
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
        />
      )}

      <Button className="w-full">
        {buttonText}
      </Button>
    </form>
  );
}