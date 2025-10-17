import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Task from '@/lib/models/Task';
import { uploadToCloudinary } from '@/lib/cloudinary';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const formData = await req.formData();

    // Extract form fields
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const location = formData.get('location') as string;
    const locationCoordinates = formData.get('locationCoordinates') as string;
    const workerCount = formData.get('workerCount') as string;
    const startDate = formData.get('startDate') as string;
    const startTime = formData.get('startTime') as string;
    const endDate = formData.get('endDate') as string;
    const endTime = formData.get('endTime') as string;
    const estimatedDuration = formData.get('estimatedDuration') as string;
    const budget = formData.get('budget') as string;
    const pricingType = formData.get('pricingType') as string;
    const searchMethod = formData.get('searchMethod') as string;

    // Validate required fields
    if (
      !title ||
      !description ||
      !category ||
      !location ||
      !startDate ||
      !startTime ||
      !endDate ||
      !endTime ||
      !budget
    ) {
      return NextResponse.json(
        { success: false, error: 'Field wajib tidak lengkap' },
        { status: 400 }
      );
    }

    // Handle photo uploads (if any)
    const photos: string[] = [];
    const failedPhotos: string[] = [];
    const photoFiles = formData.getAll('photos') as File[];

    console.log(`📸 Photo upload started: ${photoFiles.length} files`);

    if (photoFiles && photoFiles.length > 0) {
      for (let i = 0; i < photoFiles.length; i++) {
        const file = photoFiles[i];

        if (!file || file.size === 0) {
          console.warn(`⚠️  Skipping empty file at index ${i}`);
          continue;
        }

        // Validasi ukuran file
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
          console.warn(
            `⚠️  File ${file.name} terlalu besar (${file.size} bytes), skipping`
          );
          failedPhotos.push(file.name);
          continue;
        }

        try {
          console.log(`📤 Uploading photo ${i + 1}/${photoFiles.length}: ${file.name} (${file.size} bytes)`);
          
          const photoUrl = await uploadToCloudinary(file, 'naro-app/tasks');
          console.log(`✅ Photo ${i + 1} uploaded: ${photoUrl}`);
          photos.push(photoUrl);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          console.error(`❌ Failed to upload photo ${i + 1} (${file.name}): ${errorMsg}`);
          failedPhotos.push(file.name);
          // Continue with other photos
        }
      }
    }

    console.log(`📊 Upload summary - Success: ${photos.length}, Failed: ${failedPhotos.length}`);

    // Jika semua foto gagal upload, return error
    if (photoFiles.length > 0 && photos.length === 0 && failedPhotos.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Gagal upload semua foto. Details: ${failedPhotos.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Create task
    const initialStatus = 'open';

    const task = await Task.create({
      title,
      description,
      category,
      location,
      locationCoordinates: locationCoordinates
        ? JSON.parse(locationCoordinates)
        : null,
      startDate: new Date(startDate),
      startTime,
      endDate: new Date(endDate),
      endTime,
      scheduledDate: new Date(startDate),
      scheduledTime: startTime,
      budget: parseFloat(budget),
      pricingType: pricingType || 'fixed',
      searchMethod: searchMethod || 'publication',
      status: initialStatus,
      photos,
      posterId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Tugas berhasil dibuat',
      data: task,
      uploadSummary: {
        successCount: photos.length,
        failedCount: failedPhotos.length,
        failedFiles: failedPhotos,
      },
    });
  } catch (error) {
    console.error('❌ Error creating task:', error);
    const errorMsg = error instanceof Error ? error.message : 'Terjadi kesalahan server';
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}