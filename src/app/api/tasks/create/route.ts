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
    if (!title || !description || !category || !location || !startDate || !startTime || !endDate || !endTime || !budget) {
      return NextResponse.json(
        { success: false, error: 'Field wajib tidak lengkap' },
        { status: 400 }
      );
    }

    // Handle photo uploads (if any)
    const photos: string[] = [];
    const photoFiles = formData.getAll('photos') as File[];
    
    console.log('Photo files received:', photoFiles.length);
    console.log('Photo files details:', photoFiles.map(f => ({ name: f.name, size: f.size, type: f.type })));
    
    if (photoFiles && photoFiles.length > 0) {
      for (const file of photoFiles) {
        if (file && file.size > 0) {
          try {
            console.log(`Uploading photo: ${file.name}`);
            const photoUrl = await uploadToCloudinary(file, 'naro-app/tasks');
            console.log(`Photo uploaded successfully: ${photoUrl}`);
            photos.push(photoUrl);
          } catch (error) {
            console.error('Error uploading photo:', error);
            // Continue with other photos even if one fails
          }
        }
      }
    }
    
    console.log('Final photos array:', photos);

    // Create task
    const initialStatus = 'open'; // Semua task langsung open agar muncul di /pekerjaan
    
    const task = await Task.create({
      title,
      description,
      category,
      location,
      locationCoordinates: locationCoordinates ? JSON.parse(locationCoordinates) : null,
      startDate: new Date(startDate),
      startTime,
      endDate: new Date(endDate),
      endTime,
      scheduledDate: new Date(startDate), // Keep for backward compatibility
      scheduledTime: startTime, // Keep for backward compatibility
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
    });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}