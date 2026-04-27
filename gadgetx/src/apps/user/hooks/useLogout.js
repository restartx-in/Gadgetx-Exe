import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

export default function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const logout = () => {
    localStorage.clear();
    navigate("/login");
    queryClient.clear();
  };
  return { logout };
}
