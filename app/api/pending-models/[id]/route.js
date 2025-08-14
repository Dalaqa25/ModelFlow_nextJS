import { NextResponse } from "next/server";
import { getSupabaseUser } from "@/lib/auth-utils";
import { pendingModelDB, modelDB, notificationDB, userDB } from "@/lib/db/supabase-db";
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for storage operations
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Helper function to delete file from Supabase storage
async function deleteFileFromStorage(fileStorage) {
    if (!fileStorage || fileStorage.type !== 'zip' || !fileStorage.supabasePath) {
        console.log('🔍 No file to delete or not a zip file:', fileStorage);
        return;
    }

    try {
        console.log('🗑️ Deleting file from storage:', fileStorage.supabasePath);
        const { error } = await supabase.storage
            .from('models')
            .remove([fileStorage.supabasePath]);

        if (error) {
            console.error('❌ Error deleting file from storage:', error);
        } else {
            console.log('✅ File deleted from storage successfully');
        }
    } catch (error) {
        console.error('❌ Exception deleting file from storage:', error);
    }
}

export async function PATCH(req, { params }) {
    try {
        const user = await getSupabaseUser();

        if (!user || user.email !== 'g.dalaqishvili01@gmail.com') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params; // Await params in Next.js 15
        const { action, rejectionReason } = await req.json();

        const pendingModel = await pendingModelDB.getPendingModelById(id);

        if (!pendingModel) {
            return NextResponse.json({ error: "Pending model not found" }, { status: 404 });
        }

        if (action === 'approve') {
            console.log('🔄 APPROVE: Starting approval process for model:', pendingModel.name);

            // Parse file storage from img_url (where we temporarily stored it)
            let fileStorage = null;
            try {
                fileStorage = pendingModel.img_url ? JSON.parse(pendingModel.img_url) : null;
                console.log('📁 APPROVE: Parsed file storage:', fileStorage);
            } catch (e) {
                console.error('❌ APPROVE: Error parsing file storage:', e);
            }

            // Create a new model from the pending model
            const modelData = {
                name: pendingModel.name,
                author_id: pendingModel.author_id, // Required field
                author_email: pendingModel.author_email,
                tags: pendingModel.tags,
                description: pendingModel.description,
                features: pendingModel.features,
                use_cases: pendingModel.use_cases,
                setup: pendingModel.setup,
                img_url: JSON.stringify(fileStorage), // Store file storage as JSON string in img_url
                price: parseInt(pendingModel.price) || 500,
                likes: 0,
                downloads: 0
            };

            console.log('🔄 APPROVE: Creating new model with data:', JSON.stringify(modelData, null, 2));
            const newModel = await modelDB.createModel(modelData);
            console.log('✅ APPROVE: New model created successfully with ID:', newModel.id);

            // Get the user to get their ID for notification
            const authorUser = await userDB.getUserByEmail(pendingModel.author_email);
            console.log('📧 APPROVE: Creating notification for user:', authorUser.id);

            // Create approval notification
            const notificationData = {
                user_id: authorUser.id,
                user_email: pendingModel.author_email,
                notification_type: 'model_approval',
                title: 'Model Approved',
                message: `Your model "${pendingModel.name}" has been approved and is now live on the platform.`
            };
            await notificationDB.createNotification(notificationData);
            console.log('✅ APPROVE: Notification created successfully');

            // Delete the pending model after successful approval
            await pendingModelDB.deletePendingModel(id);
            console.log('✅ APPROVE: Pending model deleted successfully');

            console.log('🎉 APPROVE: Process completed successfully');
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

            // Get the user to get their ID for notification
            const authorUser = await userDB.getUserByEmail(pendingModel.author_email);

            // Create rejection notification
            const notificationData = {
                user_id: authorUser.id,
                user_email: pendingModel.author_email,
                notification_type: 'model_rejection',
                title: 'Model Rejected',
                message: `Your model "${pendingModel.name}" has been rejected. Reason: ${rejectionReason}`
            };
            await notificationDB.createNotification(notificationData);

            // Parse and delete file from storage if it exists
            let fileStorage = null;
            try {
                fileStorage = pendingModel.img_url ? JSON.parse(pendingModel.img_url) : null;
                await deleteFileFromStorage(fileStorage);
            } catch (e) {
                console.error('Error deleting file storage:', e);
            }

            // Delete the pending model after creating notification
            await pendingModelDB.deletePendingModel(id);

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