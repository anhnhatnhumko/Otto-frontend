import { useRouter } from "next/navigation";
import { logoutApi } from "@/lib/auth";
import { useUserStore } from "@/app/store/useUserStore";

export function useLogout() {
  const router = useRouter();
  const setUser = useUserStore((state) => state.setUser);

  return async function logout() {
    try {
      await logoutApi();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setUser(null); 
      router.push("/login");
    }
  };  
}