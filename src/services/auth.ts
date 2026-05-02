import { api } from "../lib/firebase";

export async function register(email: string, password: string, displayName: string, username: string, referralCode?: string) {
  const data = await api.fetch("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, displayName, username, referralCode })
  });
  await api.login(data.token, data.user);
  return data;
}

export async function login(loginStr: string, password: string) {
  const data = await api.fetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ login: loginStr, password })
  });
  await api.login(data.token, data.user);
  return data;
}
