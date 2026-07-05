// src/app/api/uploadthing/core.ts
import { createUploadthing, type FileRouter } from "uploadthing/next";
// FIXED: Imported from the /server path!
import { currentUser } from "@clerk/nextjs/server";

const f = createUploadthing();

export const ourFileRouter = {
  // Define the route for property images
  // UPDATED: maxFileCount bumped to 10 to allow batch uploads for the property gallery!
  propertyImage: f({ image: { maxFileSize: "4MB", maxFileCount: 10 } })
    // Middleware runs on your server BEFORE the upload starts
    .middleware(async () => {
      // 1. Verify the user is logged in via Clerk
      const user = await currentUser();
      
      // If no user, throw an error (prevents random people from spamming your storage)
      if (!user) throw new Error("Unauthorized");
 
      // Whatever is returned here is accessible in onUploadComplete
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after the file is securely uploaded
      console.log("Upload complete for userId:", metadata.userId);
      console.log("File URL:", file.url);
 
      // Returns to the client UI
      return { uploadedBy: metadata.userId, url: file.url };
    }),
} satisfies FileRouter;
 
export type OurFileRouter = typeof ourFileRouter;