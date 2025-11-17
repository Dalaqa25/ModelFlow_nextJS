import { modelDB, userDB } from "@/lib/db/supabase-db";
import { NextResponse } from "next/server";
import { getSupabaseUser } from '@/lib/auth-utils';
import { getVariantIdForPrice } from "@/lib/lemon/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const models = await modelDB.getAllModels();
    // Transform the data to include camelCase field names for frontend compatibility
    const transformedModels = models.map(model => ({
      ...model,
      authorEmail: model.author_email, // Add camelCase version
      createdAt: model.created_at // Add camelCase version for consistency
    }));
    return NextResponse.json(transformedModels);
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

    const userDoc = await userDB.getUserByEmail(user.email);
    if (!userDoc) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    const formData = await req.formData();
    
    const requiredFields = ['name', 'description', 'use_cases', 'features', 'tags', 'setup', 'price', 'fileStorage'];
    const missingFields = requiredFields.filter(field => !formData.get(field));
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Price handling
    const priceInCents = parseInt(formData.get('price'));
    if (isNaN(priceInCents) || priceInCents < 0) {
        return NextResponse.json({ error: 'Invalid price' }, { status: 400 });
    }

    // Get variant ID from Lemon Squeezy
    const variantId = await getVariantIdForPrice(priceInCents);
    if (!variantId) {
        return NextResponse.json({ error: `No variant ID found for price: ${priceInCents / 100}` }, { status: 400 });
    }

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

    // Get specific validation fields
    const framework = formData.get('framework');
    const taskType = formData.get('task_type');
    const validationReason = formData.get('validation_reason');

    const modelData = {
        name: formData.get('name'),
        description: formData.get('description'),
        use_cases: useCases,
        features: features,
        tags: tags,
        setup: formData.get('setup'),
        price: priceInCents, // Save price in cents
        pricing_data: { // Save Lemon Squeezy data
            variantId: variantId,
            price: priceInCents,
            displayPrice: `${(priceInCents / 100).toFixed(2)}`
        },
        author_email: user.email,
        file_storage: fileStorage,
        framework: framework, // New column
        task_type: taskType, // New column
        validation_reason: validationReason // New column
    };

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
