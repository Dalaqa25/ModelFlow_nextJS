import { modelDB, userDB } from "@/lib/db/supabase-db";
import { NextResponse } from "next/server";
import { getSupabaseUser } from '@/lib/auth-utils';

export async function GET() {
  try {
    const models = await modelDB.getAllModels();
    return NextResponse.json(models);
  } catch (error) {
    console.error('Error fetching models:', error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await getSupabaseUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'You must be logged in to upload a model' },
        { status: 401 }
      );
    }

    // Find the user document first
    const userDoc = await userDB.getUserByEmail(user.email);
    if (!userDoc) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    const formData = await req.formData();
    
    // Validate required fields
    const requiredFields = ['name', 'description', 'use_cases', 'features', 'tags', 'setup', 'price', 'fileStorage'];
    const missingFields = requiredFields.filter(field => !formData.get(field));
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Parse and validate tags
    let tags;
    try {
      const tagsData = formData.get('tags');
      tags = JSON.parse(tagsData);
      if (!Array.isArray(tags) || tags.length === 0) {
        return NextResponse.json(
          { error: 'At least one tag is required' },
          { status: 400 }
        );
      }
      // Ensure all tags are strings and not empty
      tags = tags.map(tag => tag.trim().toUpperCase()).filter(tag => tag.length > 0);
      if (tags.length === 0) {
        return NextResponse.json(
          { error: 'Valid tags are required' },
          { status: 400 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid tags format' },
        { status: 400 }
      );
    }

    // Handle file storage information (only ZIP files supported)
    let fileStorage = {};
    try {
      const fileStorageData = formData.get('fileStorage');
      if (!fileStorageData) {
        return NextResponse.json(
          { error: 'File storage information is required' },
          { status: 400 }
        );
      }
      fileStorage = JSON.parse(fileStorageData);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid file storage format' },
        { status: 400 }
      );
    }

    
    const useCases = formData.get('use_cases').split('\n').map(s => s.trim()).filter(s => s);
    const features = formData.get('features').split('\n').map(s => s.trim()).filter(s => s);

    const modelData = {
      name: formData.get('name'),
      description: formData.get('description'),
      use_cases: useCases,
      features: features,
      tags: tags,
      setup: formData.get('setup'),
      price: parseInt(formData.get('price') * 100) || 50000, // Convert to cents, default $500
      author_email: user.email, // Use author_email as per new schema
      file_storage: fileStorage // Use file_storage as per new schema
    };

    console.log('Creating model with data:', {
      ...modelData,
      file_storage: {
        ...modelData.file_storage,
        fileName: modelData.file_storage.fileName || 'unknown'
      }
    });

    const model = await modelDB.createModel(modelData);
    return NextResponse.json(model, { status: 201 });
  } catch (error) {
    console.error('Error creating model:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create model' },
      { status: 500 }
    );
  }
}
