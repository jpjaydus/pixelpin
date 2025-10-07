import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// DELETE /api/assets/[id] - Delete an asset
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id: assetId } = await params;
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Find asset and verify ownership through project
    const asset = await prisma.asset.findFirst({
      where: {
        id: assetId,
        project: {
          ownerId: session.user.id,
        },
      },
      include: {
        project: true,
      },
    });

    if (!asset) {
      return NextResponse.json(
        { error: "Asset not found" },
        { status: 404 }
      );
    }

    // Delete asset (this will also delete related annotations due to cascade)
    await prisma.asset.delete({
      where: { id: assetId },
    });

    return NextResponse.json(
      { message: "Asset deleted successfully" }
    );
  } catch (error) {
    console.error("Error deleting asset:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}