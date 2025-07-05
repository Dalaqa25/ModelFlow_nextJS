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
            tags = tags.map(tag => tag.trim().toUpperCase()).filter(tag => tag.length > 0);
        } catch (error) {
            return NextResponse.json(
                { error: 'Invalid tags format' },
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
            author: userDoc._id,
            authorEmail: user.email,
            status: 'pending'
        };

        // Handle file storage information
        const uploadType = formData.get('uploadType');
        const modelFile = formData.get('modelFile');
        const driveLink = formData.get('driveLink');

        if (uploadType === 'zip' && modelFile) {
            // First, validate with FastAPI
            const fastApiFormData = new FormData();
            fastApiFormData.append('file', modelFile);
            fastApiFormData.append('description', formData.get('description'));
            fastApiFormData.append('setup', formData.get('setup'));

            const apiUrl = process.env.MODEL_VALIDATOR_API_URL || 'http://127.0.0.1:8000';
            const fastApiResponse = await fetch(`${apiUrl}/process-zip`, {
                method: 'POST',
                body: fastApiFormData,
            });

            if (!fastApiResponse.ok) {
                return NextResponse.json(
                    { error: 'Failed to validate model with FastAPI' },
                    { status: 400 }
                );
            }

            const validationResult = await fastApiResponse.json();
            
            modelData.fileStorage = {
                type: 'zip',
                url: modelFile.name,
                fileName: modelFile.name,
                fileSize: modelFile.size,
                mimeType: modelFile.type,
                folderPath: `pending-models/${user.email}/${Date.now()}`,
                uploadedAt: new Date()
            };

            // Add validation and AI analysis results
            modelData.validationStatus = {
                isValid: validationResult.isValid,
                message: validationResult.message,
                has_requirements: validationResult.has_requirements
            };
            modelData.aiAnalysis = validationResult.ai_analysis;
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