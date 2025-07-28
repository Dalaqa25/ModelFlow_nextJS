import { getSupabaseUser } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import RequestsClient from "./RequestsClient";

export default async function Requests() {
    const user = await getSupabaseUser();
    if (!user) {
        redirect("https://25eb-2a0b-6204-6ef-7b00-fcbf-a992-6695-d3c7.ngrok-free.app");
    }

    return <RequestsClient />;
}