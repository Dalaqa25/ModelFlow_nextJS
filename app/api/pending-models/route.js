import { NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import connect from "@/lib/db/connect";
import PendingModel from "@/lib/db/PendingModel";
import Model from "@/lib/db/Model";
import User from "@/lib/db/User";

// Get all pending models (admin only)
export async function GET(req) {
    try {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user || user.email !== 'modelflow01@gmail.com') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connect();
        const pendingModels = await PendingModel.find({ status: 'pending' })
            .sort({ createdAt: -1 })
            .populate('author', 'name email')
            .select('+aiAnalysis +validationStatus');

        return NextResponse.json(pendingModels);
    } catch (error) {
        console.error('Error fetching pending models:', error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// Create a new pending model
export async function POST(req) {
    try {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connect();

        // Find the user document
        const userDoc = await User.findOne({ email: user.email });
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

        const modelData = {
            name: data.name,
            description: data.description,
            useCases: data.useCases,
            features: data.features,
            tags: tags,
            setup: data.setup,
            price: parseFloat(data.price) || 0,
            author: userDoc._id,
            authorEmail: user.email,
            status: 'pending'
        };

        // Handle file storage information
        const uploadType = data.uploadType;
        const fileStorage = data.fileStorage ? (typeof data.fileStorage === 'string' ? JSON.parse(data.fileStorage) : data.fileStorage) : null;
        const driveLink = data.driveLink;

        if (uploadType === 'zip' && fileStorage) {
            modelData.fileStorage = {
                ...fileStorage,
                type: 'zip',
                uploadedAt: fileStorage.uploadedAt || new Date()
            };
            // Skipping FastAPI validation for now since we don't have the file
        } else if (uploadType === 'drive' && driveLink) {
            modelData.fileStorage = {
                type: 'drive',
                url: driveLink,
                fileName: driveLink.split('/').pop() || 'drive-file',
                folderPath: `pending-models/drive-links/${user.email}`,
                uploadedAt: new Date()
            };
        } else {
            return NextResponse.json(
                { error: 'No file or drive link provided' },
                { status: 400 }
            );
        }

        const pendingModel = await PendingModel.create(modelData);
        return NextResponse.json(pendingModel, { status: 201 });
    } catch (error) {
        console.error('Error creating pending model:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create pending model' },
            { status: 500 }
        );
    }
} 