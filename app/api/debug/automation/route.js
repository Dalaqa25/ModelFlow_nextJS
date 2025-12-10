import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID parameter required' }, { status: 400 });
    }

    // Get automation by ID
    const { data, error } = await supabase
      .from('automations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 });
    }

    console.log('🔍 DEBUG - Raw automation from database:');
    console.log('   ID:', data.id);
    console.log('   Name:', data.name);
    console.log('   required_inputs (raw):', data.required_inputs);
    console.log('   required_inputs type:', typeof data.required_inputs);
    console.log('   required_inputs is array:', Array.isArray(data.required_inputs));
    
    if (Array.isArray(data.required_inputs) && data.required_inputs.length > 0) {
      console.log('   First element:', data.required_inputs[0]);
      console.log('   First element type:', typeof data.required_inputs[0]);
    }

    return NextResponse.json({
      id: data.id,
      name: data.name,
      required_inputs_raw: data.required_inputs,
      required_inputs_type: typeof data.required_inputs,
      required_inputs_is_array: Array.isArray(data.required_inputs),
      required_inputs_length: data.required_inputs?.length || 0,
      first_element: data.required_inputs?.[0],
      first_element_type: typeof data.required_inputs?.[0]
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}