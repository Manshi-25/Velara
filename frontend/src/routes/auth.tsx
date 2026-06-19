import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, FormEvent, ChangeEvent } from "react";

import { supabase } from "@/integrations/supabase/client";
import { verifyCaptcha } from "@/lib/captcha.functions";
import { checkUsername } from "@/lib/checkUN";
import { getSuggestions } from "@/lib/nameSuggestions";

import validator from "validator";
import zxcvbn from "zxcvbn";
import { toast } from "sonner";

import LoginForm from "@/components/auth/LoginForm";
import SignupForm from "@/components/auth/SignupForm";
import OtpForm from "@/components/auth/OtpForm";
import OtpLoginForm from "@/components/auth/OtpLoginForm";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

type Mode = "login" | "signup" | "otp" | "otpLogin" | "otpVerify" | "forgot";

export const Route = createFileRoute("/auth")({
  component: AuthPage
});

function AuthPage() {
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [otp, setOtp] = useState("");

  const [captchaToken, setCaptchaToken] = useState("");

  const [loading, setLoading] = useState(false);

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [nameAvailable, setNameAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    setSuggestions(getSuggestions(""));

    async function checkSession() {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (session) {
        navigate({
          to: "/"
        });
      }
    }

    checkSession();
  }, []);


  useEffect(() => {
    console.log("Current Mode:", mode);
  }, [mode]);

  // Listen for login/logout changes
  useEffect(() => {
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth event:", event);

      // user logged out
      if (event === "SIGNED_OUT") {
        toast.success("Logged out successfully");
        navigate({
          to: "/"
        });
      }

      // user logged in
      if (event === "SIGNED_IN" && session) {
        toast.success("Logged in");
        navigate({
          to: "/"
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function askForLocation(userId: string) {
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
          const geoData = await response.json();
          const state = geoData.address?.state || geoData.address?.city || null;
          await supabase.from("profiles").update({ state, show_location: true, location_permission_asked: true }).eq("id", userId);
        } catch (error) {
          console.error(error);
        }
      },
      async () => {
        await supabase.from("profiles").update({ show_location: false, location_permission_asked: true }).eq("id", userId);
      }
    );
  }

//login
  async function handleLogin(e: FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      
      toast.loading("Signing in...",{id:"login"});
      const { error } =
        await supabase.auth.signInWithPassword({
          email,
          password
        });

      if (error) {
        toast.dismiss("login");
        toast.error("Wrong email or password");
        return;
      }
      toast.dismiss("login");
      toast.success("Welcome back");
      
      const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase.from("profiles").select("location_permission_asked").eq("id", user.id).single();
          if (!profile?.location_permission_asked) {
            await askForLocation(user.id);
          }
        }
      navigate({
        to: "/"
      });
    } catch {
      toast.dismiss("login");
      toast.error("Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpLogin() {
    if (!email) {
      toast.error("Enter email");
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false
      }
    });

    if (error) {
      toast.error("Account not found");
      return;
    }

    toast.success("OTP sent");
    setMode("otpVerify");
  }

  async function handleOtpVerify() {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "email"
    });

    if (error) {
      toast.error("Invalid OTP");
      return;
    }

    toast.success("Logged in");
    navigate({
      to: "/"
    });
  }

  async function handleForgotPassword() {
    if (!email) {
      toast.error("Enter email");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: window.location.origin + "/reset-password"
      }
    );

    if (error) {
      toast.error("Unable to send reset mail");
      return;
    }

    toast.success("Mail sent. Check your inbox 📩");
  }

  async function handleSignup(e: FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      console.log("1");
      if (!validator.isEmail(email)) {
        toast.error("Enter valid email");
        return;
      }

      console.log("2");
      if (password !== confirm) {
        toast.error("Passwords do not match");
        return;
      }

      console.log("3");
      if (password.length < 8) {
        toast.error("Password must contain at least 8 characters");
        return;
      }

      console.log("4");
      if (nameAvailable === false) {
        toast.error("Username taken");
        return;
      }

      console.log("5");
      if (!captchaToken) {
        toast.error("Captcha missing");
        return;
      }

      console.log("TOKEN:", captchaToken);
      console.log("6");
      const strength = zxcvbn(password);
      console.log("Strength:", strength);

      console.log("7");
      const captchaResult = await verifyCaptcha(captchaToken);
      console.log("CAPTCHA RESULT:", captchaResult);

      if (!captchaResult.success) {
        toast.error("Captcha verification failed");
        return;
      }

      console.log("8");
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName
          }
        }
      });

      console.log("9", error);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.dismiss("signup");
      toast.success("OTP sent to your email 📩");

      setMode("otp");
    } catch (error) {
      toast.dismiss("signup");
      toast.error("Signup failed");
      console.log("FULL ERROR:", error);
      toast.error("Signup failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: FormEvent) {
    e.preventDefault();

    if (otp.length !== 6) {
      toast.error("Enter valid OTP");
      return;
    }

    try {
      setLoading(true);
      toast.loading("Verifying OTP...",{id:"verify"});
      const { error } =
        await supabase.auth.verifyOtp({
          email,
          token: otp,
          type: "email"
        });

      if (error) {
        toast.dismiss("verify");
        toast.error("Invalid OTP");
        return;
      }

      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        toast.dismiss("verify");
        toast.error("User not found");
        return;
      }

      await supabase
      .from("profiles")
      .upsert({

      id:user.id,

      email: user.email,

      anonymous_name:displayName,

      bio:"",

      followers_count:0,

      following_count:0,

      posts_count:0,
      avatar:null

      });
      toast.dismiss("verify");
      toast.success("Account verified");
      await askForLocation(user.id);
      navigate({
        to: "/"
      });
    } catch (error) {
      console.log(error);

      toast.dismiss("verify");
      toast.error("Verification failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleNameChange(
    e: ChangeEvent<HTMLInputElement>
  ) {
    const value = e.target.value;

    setDisplayName(value);

    setSuggestions(
      getSuggestions(value)
    );

    if (value.length < 3) {
      setNameAvailable(null);
      return;
    }

    const available =
      await checkUsername(value);

    setNameAvailable(available);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl p-8 border shadow-lg">

          <h1 className="text-3xl font-bold text-center mb-2">
            {mode==="login" && "Welcome Back"}
            {mode==="signup" && "Create Account"}
            {mode==="otp" && "Verify Email"}
          </h1>

          <p className="text-center text-muted-foreground mb-6">
            Anonymous dream sharing
          </p>

          {mode==="login" && (
            <LoginForm
              email={email}
              password={password}
              setEmail={setEmail}
              setPassword={setPassword}
              loading={loading}
              handleLogin={handleLogin}
              setMode={setMode}
            />
          )}

          {mode==="signup" && (
            <SignupForm
              displayName={displayName}
              email={email}
              password={password}
              confirm={confirm}
              setDisplayName={setDisplayName}
              setEmail={setEmail}
              setPassword={setPassword}
              setConfirm={setConfirm}
              loading={loading}
              suggestions={suggestions}
              nameAvailable={nameAvailable}
              setCaptchaToken={setCaptchaToken}
              handleSignup={handleSignup}
              handleNameChange={handleNameChange}
            />
          )}

          
          
          {mode === "otp" && (
          <OtpForm
            otp={otp}
            setOtp={setOtp}
            handleVerifyOtp={handleVerifyOtp}
          />
        )}

        {mode === "otpLogin" && (
          <OtpLoginForm
            email={email}
            setEmail={setEmail}
            handleAction={handleOtpLogin}
            title="Login using OTP"
            buttonText="Send OTP"
          />
        )}

        {mode === "otpVerify" && (
          <OtpLoginForm
            email={email}
            setEmail={setEmail}
            otp={otp}
            setOtp={setOtp}
            handleAction={handleOtpVerify}
            title="Verify OTP"
            buttonText="Log In"
          />
        )}

        {mode === "forgot" && (
          <ForgotPasswordForm
            email={email}
            setEmail={setEmail}
            handleForgot={handleForgotPassword}
          />
        )}

        </div>
      </div>
    </div>
  );
}