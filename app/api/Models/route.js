import { modelDB } from "@/lib/db/supabase-db";
import { NextResponse } from "next/server";

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
    const userDoc = await withDatabaseRetry(async () => {
      return await prisma.user.findFirst({
        where: { email: user.email }
      });
    });
    if (!userDoc) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    const formData = await req.formData();
    
    // Validate required fields
    const requiredFields = ['name', 'description', 'useCases', 'features', 'tags', 'uploadType', 'setup', 'price'];
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

    // Handle file storage information
    const uploadType = formData.get('uploadType');
    const modelFile = formData.get('modelFile');
    const driveLink = formData.get('driveLink');

    let fileStorage = {};
    if (uploadType === 'zip' && modelFile) {
      // For ZIP file upload
      fileStorage = {
        type: 'zip',
        url: modelFile.name, // This will be replaced with actual storage URL
        fileName: modelFile.name,
        fileSize: modelFile.size,
        mimeType: modelFile.type,
        folderPath: `models/${user.email}/${Date.now()}`,
        uploadedAt: new Date()
      };
    } else if (uploadType === 'drive' && driveLink) {
      // For Google Drive link
      fileStorage = {
        type: 'drive',
        url: driveLink,
        fileName: driveLink.split('/').pop() || 'drive-file',
        folderPath: `drive-links/${user.email}`,
        uploadedAt: new Date()
      };
    } else {
      return NextResponse.json(
        { error: 'No file or drive link provided' },
        { status: 400 }
      );
    }

    const modelData = {
      name: formData.get('name'),
      description: formData.get('description'),
      useCases: formData.get('useCases'),
      features: formData.get('features'),
      tags: tags,
      setup: formData.get('setup'),
      price: parseFloat(formData.get('price')) || 0,
      authorId: userDoc.id, // Use the user's Prisma ID
      authorEmail: user.email,
      fileStorage: fileStorage
    };

    console.log('Creating model with data:', {
      ...modelData,
      fileStorage: {
        ...modelData.fileStorage,
        url: modelData.fileStorage.url.substring(0, 50) + '...' // Truncate long URLs in logs
      }
    });

    const model = await withDatabaseRetry(async () => {
      return await prisma.model.create({
        data: modelData,
        include: {
          author: {
            select: {
              name: true,
              email: true
            }
          }
        }
      });
    });
    return NextResponse.json(model, { status: 201 });
  } catch (error) {
    console.error('Error creating model:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create model' },
      { status: 500 }
    );
  }
}