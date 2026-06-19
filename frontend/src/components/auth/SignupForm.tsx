import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import PasswordStrength from "./PasswordStrength";
import UsernameSuggestions from "./UsernameSuggestions";

import { Turnstile } from "@/components/Turnstile";

export default function SignupForm(props: any) {
  const [showPassword,setShowPassword]=useState(false);
  const [showConfirm,setShowConfirm]=useState(false);

  const passwordsMatch=
    props.password &&
    props.confirm &&
    props.password===props.confirm;

  const passwordsDifferent=
    props.confirm &&
    props.password!==props.confirm;

  return(
    <form
      onSubmit={props.handleSignup}
      className="space-y-4"
    >

      <Input
        placeholder="Anonymous Name"
        value={props.displayName}
        onChange={props.handleNameChange}
      />

      {props.nameAvailable!==null && (
        <p className="text-sm">
          {props.nameAvailable
            ? "✓ Available"
            : "✗ Username taken"}
        </p>
      )}

      <UsernameSuggestions
        suggestions={props.suggestions}
        setDisplayName={props.setDisplayName}
      />

      <Input
        type="email"
        placeholder="Email"
        value={props.email}
        onChange={(e)=>props.setEmail(e.target.value)}
      />

      <div className="relative">

        <Input
          type={showPassword?"text":"password"}
          placeholder="Password"
          value={props.password}
          onChange={(e)=>props.setPassword(e.target.value)}
        />

        <button
          type="button"
          className="absolute right-3 top-2"
          onClick={()=>setShowPassword(!showPassword)}
        >
          {showPassword
            ? <EyeOff size={18}/>
            : <Eye size={18}/>}
        </button>

      </div>

      <PasswordStrength
        password={props.password}
      />

      <div className="relative">

        <Input
          type={showConfirm?"text":"password"}
          placeholder="Confirm Password"
          value={props.confirm}
          onChange={(e)=>props.setConfirm(e.target.value)}
        />

        <button
          type="button"
          className="absolute right-3 top-2"
          onClick={()=>setShowConfirm(!showConfirm)}
        >
          {showConfirm
            ? <EyeOff size={18}/>
            : <Eye size={18}/>}
        </button>

      </div>

      {passwordsMatch&&(
        <p className="text-green-500 text-sm">
          ✓ Passwords match
        </p>
      )}

      {passwordsDifferent&&(
        <p className="text-red-500 text-sm">
          ✗ Passwords do not match
        </p>
      )}

      <Turnstile
        onToken={(token:string)=>{
          console.log("TURNSTILE TOKEN:",token);
          props.setCaptchaToken(token);
        }}
      />

      <Button
        type="submit"
        className="w-full"
        disabled={props.loading}
      >
        {props.loading
          ? "Loading..."
          : "Create Account"}
      </Button>

    </form>
  );
}