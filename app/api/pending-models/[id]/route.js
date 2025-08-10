import { NextResponse } from "next/server";
import { getSupabaseUser } from "@/lib/auth-utils";
import { prisma } from "@/lib/db/prisma";

export async function PATCH(req, { params }) {
    try {
        const user = await getSupabaseUser();

        if (!user || user.email !== 'g.dalaqishvili01@gmail.com') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = params;
        const { action, rejectionReason } = await req.json();

        const pendingModel = await prisma.pendingModel.findUnique({
            where: { id }
        });
        if (!pendingModel) {
            return NextResponse.json({ error: "Pending model not found" }, { status: 404 });
        }

        if (action === 'approve') {
            // Create a new model from the pending model
            const modelData = {
                name: pendingModel.name,
                authorId: pendingModel.authorId,
                authorEmail: pendingModel.authorEmail,
                tags: pendingModel.tags,
                description: pendingModel.description,
                features: pendingModel.features,
                useCases: pendingModel.useCases,
                setup: pendingModel.setup,
                imgUrl: pendingModel.imgUrl,
                fileStorage: pendingModel.fileStorage,
                price: parseInt(pendingModel.price) || 500, // Ensure price is an integer (cents)
                likes: 0,
                likedBy: [],
                downloads: 0
            };

            const newModel = await prisma.model.create({
                data: modelData
            });
            
            // Create approval notification
            await prisma.notification.create({
                data: {
                    userId: pendingModel.authorId,
                    userEmail: pendingModel.authorEmail,
                    type: 'model_approval',
                    title: 'Model Approved',
                    message: `Your model "${pendingModel.name}" has been approved and is now live on the platform.`,
                    relatedModelId: newModel.id
                }
            });

            // Delete the pending model after successful approval
            await prisma.pendingModel.delete({
                where: { id }
            });

            return NextResponse.json({ 
                message: "Model approved successfully",
                model: newModel
            });
        } else if (action === 'reject') {
            if (!rejectionReason) {
                return NextResponse.json(
                    { error: "Rejection reason is required" },
                    { status: 400 }
                );
            }

            // Create rejection notification
            await prisma.notification.create({
                data: {
                    userId: pendingModel.authorId,
                    userEmail: pendingModel.authorEmail,
                    type: 'model_rejection',
                    title: 'Model Rejected',
                    message: `Your model "${pendingModel.name}" has been rejected. Reason: ${rejectionReason}`,
                    relatedModelId: pendingModel.id
                }
            });

            // Delete the pending model after creating notification
            await prisma.pendingModel.delete({
                where: { id }
            });

            return NextResponse.json({ 
                message: "Model rejected successfully"
            });
        } else {
            return NextResponse.json(
                { error: "Invalid action" },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error('Error processing pending model:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to process pending model' },
            { status: 500 }
        );
    }
} 