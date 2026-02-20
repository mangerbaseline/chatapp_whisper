import { GoogleLogin } from "@react-oauth/google";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/redux/hooks";
import { googleLogin, setUser } from "@/redux/features/auth/authSlice";

export default function GoogleLoginBtn() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  return (
    <GoogleLogin
      onSuccess={async (res) => {
        if (!res.credential) {
          toast.error("Google login failed");
          return;
        }

        try {
          const response = await dispatch(
            googleLogin({ token: res.credential }),
          ).unwrap();

          const userData = response.data || response;

          dispatch(setUser(userData));

          toast.success("Logged in successfully");
          setTimeout(() => {
            router.push("/");
            router.refresh();
          }, 100);
        } catch {
          toast.error("Google login failed");
        }
      }}
      onError={() => toast.error("Google login failed")}
    />
  );
}
