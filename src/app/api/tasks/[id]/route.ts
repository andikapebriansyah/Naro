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
    const taskObject = updatedTask.toObject();
    
    // FIX: Add consistent field naming for poster
    const formattedTask = {
      ...taskObject,
      // Keep original field
      posterId: taskObject.posterId,
      // Add alias fields for consistency across frontend
      poster: taskObject.posterId,
      postedBy: taskObject.posterId,
      // Format applicants
      applicants: updatedTask.applicants?.map((app: any) => ({
        ...app.toObject(),
        user: app.userId
      }))
    };

    console.log('=== TASK DETAIL API ===');
    console.log('Task ID:', params.id);
    console.log('Poster Info:', {
      posterId: formattedTask.posterId,
      poster: formattedTask.poster,
      postedBy: formattedTask.postedBy,
      name: formattedTask.posterId?.name
    });

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
      const locationCoordinates = formData.get('locationCoordinates') as string;
      const scheduledDate = formData.get('scheduledDate') as string;
      const scheduledTime = formData.get('scheduledTime') as string;
      const startDate = formData.get('startDate') as string;
      const startTime = formData.get('startTime') as string;
      const endDate = formData.get('endDate') as string;
      const endTime = formData.get('endTime') as string;
      const estimatedDuration = formData.get('estimatedDuration') as string;
      const budget = formData.get('budget') as string;
      const pricingType = formData.get('pricingType') as string;
      const searchMethod = formData.get('searchMethod') as string;

      updateData = {
        title,
        description,
        category,
        location,
        budget: budget ? parseFloat(budget) : undefined,
        pricingType: pricingType || 'fixed',
        searchMethod: searchMethod || 'publication',
      };

      // Handle locationCoordinates if present
      if (locationCoordinates) {
        try {
          updateData.locationCoordinates = JSON.parse(locationCoordinates);
        } catch (e) {
          console.error('Error parsing locationCoordinates:', e);
        }
      }

      // FIXED: Handle all date and time fields properly
      // Priority: startDate/startTime/endDate/endTime (from edit form)
      // Fallback: scheduledDate/scheduledTime (legacy field names)
      
      if (startDate) {
        updateData.startDate = new Date(startDate);
        updateData.scheduledDate = new Date(startDate); // Keep sync with legacy field
      } else if (scheduledDate) {
        updateData.startDate = new Date(scheduledDate);
        updateData.scheduledDate = new Date(scheduledDate);
      }

      if (startTime) {
        updateData.startTime = startTime;
        updateData.scheduledTime = startTime; // Keep sync with legacy field
      } else if (scheduledTime) {
        updateData.startTime = scheduledTime;
        updateData.scheduledTime = scheduledTime;
      }

      if (endDate) {
        updateData.endDate = new Date(endDate);
      }

      if (endTime) {
        updateData.endTime = endTime;
      }

      if (estimatedDuration) {
        updateData.estimatedDuration = estimatedDuration;
      }

      // Handle photo uploads if any
      const existingPhotos = formData.getAll('existingPhotos') as string[];
      const newPhotoFiles = formData.getAll('photos') as File[];
      
      let photos = [...existingPhotos.filter(p => p && p.trim() !== '')]; // Keep existing photos, filter empty strings
      
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

      console.log('=== UPDATE TASK (FORM DATA) ===');
      console.log('Received startDate:', startDate);
      console.log('Received startTime:', startTime);
      console.log('Received endDate:', endDate);
      console.log('Received endTime:', endTime);
      console.log('Update data:', updateData);
    } else {
      // Handle JSON data (from worker assignment, payment, status updates)
      const body = await request.json();
      updateData = body;
      
      // FIXED: Sync all date/time fields properly
      if (updateData.startDate) {
        updateData.scheduledDate = updateData.startDate;
        if (typeof updateData.startDate === 'string') {
          updateData.startDate = new Date(updateData.startDate);
          updateData.scheduledDate = new Date(updateData.startDate);
        }
      }
      
      if (updateData.startTime) {
        updateData.scheduledTime = updateData.startTime;
      }

      if (updateData.endDate && typeof updateData.endDate === 'string') {
        updateData.endDate = new Date(updateData.endDate);
      }

      // Convert other string dates to Date objects if needed
      if (updateData.scheduledDate && typeof updateData.scheduledDate === 'string') {
        updateData.scheduledDate = new Date(updateData.scheduledDate);
      }
      if (updateData.paymentDate && typeof updateData.paymentDate === 'string') {
        updateData.paymentDate = new Date(updateData.paymentDate);
      }

      console.log('=== UPDATE TASK (JSON) ===');
      console.log('Update data:', updateData);
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

    // FIXED: Remove undefined values to prevent overwriting with undefined
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    // Update the task
    const updatedTask = await Task.findByIdAndUpdate(
      params.id,
      { $set: updateData }, // Use $set to only update provided fields
      { new: true, runValidators: true }
    ).populate('posterId', 'name email image rating isVerified')
     .populate('assignedTo', 'name email image rating isVerified');

    console.log('=== TASK UPDATED ===');
    console.log('Updated task dates:', {
      startDate: updatedTask?.startDate,
      startTime: updatedTask?.startTime,
      endDate: updatedTask?.endDate,
      endTime: updatedTask?.endTime,
    });

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
