import { redirect } from "next/navigation";
import ChatApp from "@/components/chat/chat-app";
import { getChatUser } from "@/lib/users";

type ChatPageProps = {
  searchParams: Promise<{
    user?: string | string[];
  }>;
};

export default async function ChatPage({ searchParams }: ChatPageProps) {
  const params = await searchParams;
  const user = getChatUser(params.user);

  if (!user) {
    redirect("/");
  }

  return <ChatApp selectedUser={user.label} />;
}
