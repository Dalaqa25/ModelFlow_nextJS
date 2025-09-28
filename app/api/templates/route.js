import { supabase } from "@/lib/db/supabase-db";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

// GET /api/templates?id=template_id
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('id');

    if (!templateId) {
      return NextResponse.json(
        { error: "Template ID is required" },
        { status: 400 }
      );
    }

    // Fetch template data from the templates table
    const { data, error } = await supabase
      .from('templates')
      .select('task_type, framework, schema')
      .eq('id', templateId)
      .single();

    if (error) {
      console.error('Error fetching template:', error);
      return NextResponse.json(
        { error: "Failed to fetch template data" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in template API:', error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}