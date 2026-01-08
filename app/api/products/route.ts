import { getDodoPayments } from "@/lib/dodo-payments"
import { NextResponse } from "next/server"

export const GET = async () => {
    const products = await getDodoPayments().products.list()
    return NextResponse.json(products.items)
}