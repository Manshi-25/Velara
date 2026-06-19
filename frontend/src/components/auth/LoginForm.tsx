import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Props = {
  email: string
  password: string
  setEmail: (v: string) => void
  setPassword: (v: string) => void
  loading: boolean
  handleLogin: any
  setMode: any
}

export default function LoginForm({
  email,
  password,
  setEmail,
  setPassword,
  loading,
  handleLogin,
  setMode
}: Props) {
  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <Input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <Input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <Button className="w-full" disabled={loading}>
        {loading ? "Loading..." : "Log In"}
      </Button>

      <div className="space-y-2">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => setMode("otpLogin")}
        >
          Sign In with OTP
        </Button>

        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={() => setMode("forgot")}
        >
          Forgot Password?
        </Button>
      </div>

      <p className="text-center text-sm">
        Don't have account?
        <button
          type="button"
          className="underline ml-2"
          onClick={() => setMode("signup")}
        >
          Sign Up
        </button>
      </p>
    </form>
  )
}