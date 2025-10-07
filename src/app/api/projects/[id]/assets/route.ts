import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const createAssetSchema = z.object({
  name: z.string().min(1, "Asset name is required").max(100, "Asset name must be less than 100 characters"),
  type: z.enum(["IMAGE", "PDF", "URL"]),
  url: z.string().url("Invalid URL").optional(),
});

// GET /api/projects/[id]/assets - Get all assets for a project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id: projectId } = await params;
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const assets = await prisma.asset.findMany({
      where: {
        projectId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ assets });
  } catch (error) {
    console.error("Error fetching assets:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/assets - Create a new asset (file upload or URL)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id: projectId } = await params;
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const contentType = request.headers.get('content-type');

    if (contentType?.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await request.formData();
      const file = formData.get('file') as File;
      
      if (!file) {
        return NextResponse.json(
          { error: "No file provided" },
          { status: 400 }
        );
      }

      // Validate file type and size
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
      const maxSize = 10 * 1024 * 1024; // 10MB

      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: "Invalid file type. Only images and PDFs are allowed." },
          { status: 400 }
        );
      }

      if (file.size > maxSize) {
        return NextResponse.json(
          { error: "File too large. Maximum size is 10MB." },
          { status: 400 }
        );
      }

      // Upload to Vercel Blob
      const blob = await put(file.name, file, {
        access: 'public',
        addRandomSuffix: true,
      });

      // Determine asset type
      const assetType = file.type === 'application/pdf' ? 'PDF' : 'IMAGE';

      // Create asset record
      const asset = await prisma.asset.create({
        data: {
          name: file.name,
          type: assetType,
          url: blob.url,
          projectId,
        },
      });

      return NextResponse.json(
        { asset, message: "Asset uploaded successfully" },
        { status: 201 }
      );
    } else {
      // Handle URL asset
      const body = await request.json();
      const { name, url } = createAssetSchema.parse({
        ...body,
        type: 'URL',
      });

      if (!url) {
        return NextResponse.json(
          { error: "URL is required for URL assets" },
          { status: 400 }
        );
      }

      const asset = await prisma.asset.create({
        data: {
          name,
          type: 'URL',
          url,
          projectId,
        },
      });

      return NextResponse.json(
        { asset, message: "URL asset created successfully" },
        { status: 201 }
      );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating asset:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}