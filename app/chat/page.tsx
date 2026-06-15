import { redirect } from "next/navigation";
import ChatApp from "@/components/chat/chat-app";
import { fetchChatUsers, getChatUser } from "@/lib/users";

type ChatPageProps = {
  searchParams: Promise<{
    user?: string | string[];
  }>;
};

export default async function ChatPage({ searchParams }: ChatPageProps) {
  const params = await searchParams;
  const users = await fetchChatUsers();
  const user = getChatUser(users, params.user);

  if (!user) {
    redirect("/");
  }

  return <ChatApp selectedUserId={user.id} selectedUserLabel={user.label} />;
}
