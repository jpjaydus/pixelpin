import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const updateProjectSchema = z.object({
    name: z.string().min(1, "Project name is required").max(100, "Project name must be less than 100 characters").optional(),
    description: z.string().max(500, "Description must be less than 500 characters").optional(),
});

// GET /api/projects/[id] - Get a specific project
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        const { id } = await params;

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const project = await prisma.project.findFirst({
            where: {
                id,
                ownerId: session.user.id,
            },
            include: {
                assets: {
                    orderBy: {
                        createdAt: 'desc',
                    },
                },
                _count: {
                    select: {
                        assets: true,
                    },
                },
            },
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ project });
    } catch (error) {
        console.error("Error fetching project:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// PUT /api/projects/[id] - Update a project
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        const { id } = await params;

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const updateData = updateProjectSchema.parse(body);

        // Check if project exists and user owns it
        const existingProject = await prisma.project.findFirst({
            where: {
                id,
                ownerId: session.user.id,
            },
        });

        if (!existingProject) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404 }
            );
        }

        const project = await prisma.project.update({
            where: { id },
            data: updateData,
            include: {
                _count: {
                    select: {
                        assets: true,
                    },
                },
            },
        });

        return NextResponse.json(
            { project, message: "Project updated successfully" }
        );
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Invalid input", details: error.issues },
                { status: 400 }
            );
        }

        console.error("Error updating project:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// DELETE /api/projects/[id] - Delete a project
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        const { id } = await params;

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Check if project exists and user owns it
        const existingProject = await prisma.project.findFirst({
            where: {
                id,
                ownerId: session.user.id,
            },
        });

        if (!existingProject) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404 }
            );
        }

        await prisma.project.delete({
            where: { id },
        });

        return NextResponse.json(
            { message: "Project deleted successfully" }
        );
    } catch (error) {
        console.error("Error deleting project:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}