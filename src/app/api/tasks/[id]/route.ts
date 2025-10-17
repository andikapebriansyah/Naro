import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Task from '@/lib/models/Task';
import User from '@/lib/models/User';
import { uploadToCloudinary } from '@/lib/cloudinary';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const task = await Task.findById(params.id)
      .populate('posterId', 'name email image rating isVerified')
      .populate('applicants.userId', 'name email image rating isVerified')
      .populate('assignedTo', 'name email image rating isVerified');

    if (!task) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    // Auto-update status based on schedule
    let updatedTask = task;
    if (task.status === 'accepted' && task.assignedTo) {
      const currentDateTime = new Date();
      const taskStartDate = new Date(task.startDate || task.scheduledDate);
      const [hours, minutes] = (task.startTime || task.scheduledTime).split(':');
      taskStartDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      // If current time is past the scheduled start time, automatically set to active
      if (currentDateTime >= taskStartDate) {
        task.status = 'active';
        await task.save();
        updatedTask = task;
        console.log(`Task ${task._id} automatically set to active at ${currentDateTime}`);
      }
    }

    // Format applicants data to include user info
    const formattedTask = {
      ...updatedTask.toObject(),
      applicants: updatedTask.applicants?.map((app: any) => ({
        ...app.toObject(),
        user: app.userId
      }))
    };

    return NextResponse.json({
      success: true,
      data: formattedTask,
    });
  } catch (error) {
    console.error('Get task error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const contentType = request.headers.get('content-type');
    
    let updateData: any = {};

    if (contentType?.includes('multipart/form-data')) {
      // Handle form data (from edit form)
      const formData = await request.formData();

      // Extract form fields
      const title = formData.get('title') as string;
      const description = formData.get('description') as string;
      const category = formData.get('category') as string;
      const location = formData.get('location') as string;
      const scheduledDate = formData.get('scheduledDate') as string;
      const scheduledTime = formData.get('scheduledTime') as string;
      const estimatedDuration = formData.get('estimatedDuration') as string;
      const budget = formData.get('budget') as string;
      const pricingType = formData.get('pricingType') as string;
      const searchMethod = formData.get('searchMethod') as string;

      updateData = {
        title,
        description,
        category,
        location,
        scheduledDate: new Date(scheduledDate),
        scheduledTime,
        estimatedDuration,
        budget: parseFloat(budget),
        pricingType: pricingType || 'fixed',
        searchMethod: searchMethod || 'publish',
      };

      // Handle photo uploads if any
      const existingPhotos = formData.getAll('existingPhotos') as string[];
      const newPhotoFiles = formData.getAll('photos') as File[];
      
      let photos = [...existingPhotos]; // Keep existing photos
      
      if (newPhotoFiles && newPhotoFiles.length > 0) {
        for (const file of newPhotoFiles) {
          if (file && file.size > 0) {
            try {
              const photoUrl = await uploadToCloudinary(file, 'naro-app/tasks');
              photos.push(photoUrl);
            } catch (error) {
              console.error('Error uploading photo:', error);
              // Continue with other photos even if one fails
            }
          }
        }
      }
      
      updateData.photos = photos;
    } else {
      // Handle JSON data (from worker assignment, payment, status updates)
      const body = await request.json();
      updateData = body;
      
      // Convert string dates to Date objects if needed
      if (updateData.scheduledDate && typeof updateData.scheduledDate === 'string') {
        updateData.scheduledDate = new Date(updateData.scheduledDate);
      }
      if (updateData.paymentDate && typeof updateData.paymentDate === 'string') {
        updateData.paymentDate = new Date(updateData.paymentDate);
      }
    }

    // Find the task and verify ownership
    const task = await Task.findById(params.id);

    if (!task) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    // Verify that the current user is the poster
    if (task.posterId.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to update this task' },
        { status: 403 }
      );
    }

    // Update the task
    const updatedTask = await Task.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true }
    ).populate('posterId', 'name email image rating isVerified')
     .populate('assignedTo', 'name email image rating isVerified');

    return NextResponse.json({
      success: true,
      data: updatedTask,
      message: updateData.assignedTo ? 'Pekerja berhasil ditugaskan' : 
               updateData.status === 'open' ? 'Tugas berhasil dipublikasikan' :
               'Tugas berhasil diperbarui'
    });
  } catch (error) {
    console.error('Update task error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Find the task and verify ownership
    const task = await Task.findById(params.id);

    if (!task) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    // Verify that the current user is the poster
    if (task.posterId.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to delete this task' },
        { status: 403 }
      );
    }

    // Delete the task
    await Task.findByIdAndDelete(params.id);

    return NextResponse.json({
      success: true,
      message: 'Task berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete task error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
