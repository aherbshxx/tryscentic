"use server";

import { createClient } from "@/lib/utils/supabase/server";
import { v4 as uuidv4 } from "uuid";
import { verifyAdmin } from "@/data-access/admin/auth";

/**
 * Upload an image to Supabase Storage
 * @param fileData - File content
 * @param fileName - Original filename
 * @param bucket - Storage bucket name
 * @param folder - Folder path within bucket
 * @returns Public URL of uploaded image
 */
export async function uploadImage(
  fileData: string | Buffer,
  fileName: string,
  bucket: string = "products",
  folder: string = "inventory"
): Promise<string> {
  // 1. Verify admin status (this ensures the user is logged in and has the admin role)
  const { supabase } = await verifyAdmin();

  // Generate unique filename
  const fileExtension = fileName.split(".").pop();
  const uniqueFileName = `${folder}/${uuidv4()}.${fileExtension}`;

  // Convert base64 to buffer if needed
  let fileBuffer: Buffer;
  if (typeof fileData === "string") {
    // Remove data URL prefix if present
    const base64Data = fileData.replace(/^data:image\/\w+;base64,/, "");
    fileBuffer = Buffer.from(base64Data, "base64");
  } else {
    fileBuffer = fileData;
  }

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(uniqueFileName, fileBuffer, {
      contentType: `image/${fileExtension}`,
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(data.path);

  return publicUrl;
}

/**
 * Upload multiple images
 */
export async function uploadImages(
  files: Array<{ data: string | Buffer; name: string }>,
  bucket: string = "products",
  folder: string = "inventory"
): Promise<string[]> {
  const uploadPromises = files.map((file) =>
    uploadImage(file.data, file.name, bucket, folder)
  );
  return Promise.all(uploadPromises);
}

/**
 * Delete an image from Supabase Storage
 */
export async function deleteImage(
  imageUrl: string,
  bucket: string = "products"
): Promise<void> {
  const supabase = await createClient();

  // Extract path from public URL
  const path = imageUrl.split(`${bucket}/`)[1];

  if (!path) {
    throw new Error("Invalid image URL");
  }

  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    throw new Error(`Failed to delete image: ${error.message}`);
  }
}
