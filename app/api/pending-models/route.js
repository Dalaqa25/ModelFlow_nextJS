import { NextResponse } from "next/server";
import { getSupabaseUser } from "@/lib/auth-utils";
import { pendingModelDB, userDB } from "@/lib/db/supabase-db";

// Get all pending models (admin only)
export async function GET(_req) {
    try {
        const user = await getSupabaseUser();

        if (!user || user.email !== 'g.dalaqishvili01@gmail.com') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const pendingModels = await pendingModelDB.getAllPendingModels();

        return NextResponse.json(pendingModels);
    } catch (error) {
        console.error('Error fetching pending models:', error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// Create a new pending model
export async function POST(req) {
    try {
        const user = await getSupabaseUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Find the user document
        const userDoc = await userDB.getUserByEmail(user.email);
        if (!userDoc) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Accept JSON or form data
        let data;
        if (req.headers.get('content-type')?.includes('application/json')) {
            data = await req.json();
        } else {
            data = Object.fromEntries(await req.formData());
        }

        // Validate required fields
        const requiredFields = ['name', 'description', 'useCases', 'features', 'tags', 'uploadType', 'setup', 'price'];
        const missingFields = requiredFields.filter(field => !data[field]);

        if (missingFields.length > 0) {
            return NextResponse.json(
                { error: `Missing required fields: ${missingFields.join(', ')}` },
                { status: 400 }
            );
        }

        // Parse and validate tags
        let tags;
        try {
            tags = typeof data.tags === 'string' ? JSON.parse(data.tags) : data.tags;
            if (!Array.isArray(tags) || tags.length === 0) {
                return NextResponse.json(
                    { error: 'At least one tag is required' },
                    { status: 400 }
                );
            }
            tags = tags.map(tag => tag.trim().toUpperCase()).filter(tag => tag.length > 0);
        } catch (error) {
            return NextResponse.json(
                { error: 'Invalid tags format' },
                { status: 400 }
            );
        }

        // First, let's try with just the basic fields to see what works
        const modelData = {
            name: data.name,
            description: data.description,
            setup: data.setup,
            price: parseFloat(data.price) || 0,
            author_id: userDoc.id,  // This is required in the actual database
            author_email: user.email,
            status: 'pending'
        };

        // Add optional fields if they exist in the schema
        if (data.useCases) {
            modelData.use_cases = data.useCases;
        }
        if (data.features) {
            modelData.features = data.features;
        }
        if (tags && tags.length > 0) {
            modelData.tags = tags;
        }

        // Handle file storage information
        const uploadType = data.uploadType;
        const fileStorage = data.fileStorage ? (typeof data.fileStorage === 'string' ? JSON.parse(data.fileStorage) : data.fileStorage) : null;
        const driveLink = data.driveLink;

        // Store file storage info in img_url as JSON string since file_storage column doesn't exist
        if (uploadType === 'zip' && fileStorage) {
            modelData.img_url = JSON.stringify({
                ...fileStorage,
                type: 'zip',
                uploadedAt: fileStorage.uploadedAt || new Date().toISOString()
            });
        } else if (uploadType === 'drive' && driveLink) {
            modelData.img_url = JSON.stringify({
                type: 'drive',
                url: driveLink,
                fileName: driveLink.split('/').pop() || 'drive-file',
                folderPath: `pending-models/drive-links/${user.email}`,
                uploadedAt: new Date().toISOString()
            });
        } else {
            return NextResponse.json(
                { error: 'No file or drive link provided' },
                { status: 400 }
            );
        }

        console.log('Attempting to create pending model with data:', modelData);
        const pendingModel = await pendingModelDB.createPendingModel(modelData);
        return NextResponse.json(pendingModel, { status: 201 });
    } catch (error) {
        console.error('Error creating pending model:', error);
        console.error('Full error details:', JSON.stringify(error, null, 2));
        return NextResponse.json(
            { error: error.message || 'Failed to create pending model' },
            { status: 500 }
        );
    }
} 