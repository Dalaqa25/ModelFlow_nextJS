import connect from "@/lib/db/connect";
import Model from "@/lib/db/Model";
import { NextResponse } from "next/server";

export async function GET() {
  await connect();
  const models = await Model.find({}, {
    name: 1,
    author: 1,
    imgUrl: 1,
    tags: 1,
    createdAt: 1,
    likes: 1,
    downloads: 1,
    price: 1
  }).populate("author", "name profileImage");
  return NextResponse.json(models);
}

export async function POST(req) {
  await connect();
  const data = await req.json();
  const model = await Model.create(data);
  return NextResponse.json(model, { status: 201 });
}