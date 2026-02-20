"use client";

import { useEffect, useState } from "react";
import { useAppDispatch } from "@/redux/hooks";
import { setUser, clearUser, me } from "@/redux/features/auth/authSlice";

export default function AuthInitializer() {
  const dispatch = useAppDispatch();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      dispatch(me())
        .unwrap()
        .then((response) => {
          const userData = response.data || response;
          dispatch(setUser(userData));
        })
        .catch(() => {
          dispatch(clearUser());
        });
    }
  }, [mounted, dispatch]);

  return null;
}
