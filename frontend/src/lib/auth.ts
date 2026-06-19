import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

type AuthState = {
  loggedIn: boolean;
  user: User | null;
  session: Session | null;
  loading: boolean;
};

export function useAuth() {

  const [state,setState] =
  useState<AuthState>({
    loggedIn:false,
    user:null,
    session:null,
    loading:true
  });

  useEffect(()=>{

    const initialize = async()=>{

      const {
        data:{session}
      } =
      await supabase.auth.getSession();

      setState({
        loggedIn:!!session,
        user:session?.user ?? null,
        session,
        loading:false
      });

    };

    initialize();

    const {
      data:{subscription}
    }=
    supabase.auth.onAuthStateChange(
      (_event,session)=>{

        setState({
          loggedIn:!!session,
          user:session?.user ?? null,
          session,
          loading:false
        });
        // redirect after logout
        if (_event === "SIGNED_OUT") {
          window.location.href = "/";
        }

      }
    );

    return ()=>{

      subscription.unsubscribe();

    };

  },[]);

  return {

    loggedIn:state.loggedIn,
    user:state.user,
    session:state.session,
    loading:state.loading,

    login:()=>{

      window.location.href="/auth";

    },

    logout: async () => {

      await supabase.auth.signOut();

      // redirect user to home page
      window.location.href = "/";

    }

  };

}