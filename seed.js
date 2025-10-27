// seed.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Import Models
const Role = require('./Models/RoleModel');
const User = require('./Models/UserModel');
const Profile = require('./Models/ProfileModel');
const Category = require('./Models/CategoryModel');
const Course = require('./Models/CourseModel');
const Section = require('./Models/SectionModel'); // ✅ Added Section model
const Video = require('./Models/VideoModel');
const VideoReview = require('./Models/VideoReviewModel');
const CourseRating = require('./Models/CourseRatingModel');
const Order = require('./Models/OrderModel');
const Payment = require('./Models/PaymentModel');
const Enrollment = require('./Models/EnrollmentModel');
const Notification = require('./Models/NotificationModel');

// Debug dotenv
console.log('MONGO_URL:', process.env.MONGO_URL);
console.log('SECRET:', process.env.SECRET);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1);
  });

const seedDatabase = async () => {
  try {
    console.log('🌱 Seeding database...');

    // 1. Clear all collections
    await Promise.all([
      Role.deleteMany(),
      User.deleteMany(),
      Profile.deleteMany(),
      Category.deleteMany(),
      Course.deleteMany(),
      Section.deleteMany(),
      Video.deleteMany(),
      VideoReview.deleteMany(),
      CourseRating.deleteMany(),
      Order.deleteMany(),
      Payment.deleteMany(),
      Enrollment.deleteMany(),
      Notification.deleteMany()
    ]);

    // 2. Create Roles
    const roles = await Role.insertMany([
      { name: 'Admin' },
      { name: 'Instructor' },
      { name: 'User' }
    ]);
    const [adminRole, instructorRole, userRole] = roles;

    // 3. Hash password
    const hashedPassword = await bcrypt.hash('Password123!', 10);

    // 4. Create Users
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: hashedPassword,
      roleId: adminRole._id
    });

    const instructor = await User.create({
      name: 'John Instructor',
      email: 'instructor@example.com',
      password: hashedPassword,
      roleId: instructorRole._id
    });

    const student = await User.create({
      name: 'Sarang User',
      email: 'user@example.com',
      password: hashedPassword,
      roleId: userRole._id
    });

    // 5. Generate admin token for testing
    const adminToken = jwt.sign(
      { _id: admin._id, role: 'Admin' },
      process.env.SECRET,
      { expiresIn: '7d' }
    );
    console.log('JWT Token for Admin:', adminToken);

    // 6. Create Profiles
    await Profile.create({
      userId: instructor._id,
      fullName: 'John Instructor',
      phone: '9876543210',
      gitHubUsername: 'johnGit',
      bio: 'Instructor specializing in full-stack development',
      image: 'https://randomuser.me/api/portraits/men/32.jpg'
    });

    await Profile.create({
      userId: student._id,
      fullName: 'Sarang User',
      phone: '9123456780',
      bio: 'Aspiring full-stack developer',
      image: 'https://randomuser.me/api/portraits/men/33.jpg'
    });

    // 7. Create Category
    const category = await Category.create({
      name: 'Web Development',
      description: 'Full-stack web development courses',
      image: 'https://res.cloudinary.com/demo/image/upload/sample.jpg'
    });

    // 8. Create Course
    const course = await Course.create({
      title: 'MERN Stack Mastery',
      description: 'Learn full-stack web development with MERN',
      categoryId: category._id,
      price: 1999,
      estimatedPrice: 2499,
      thumbnail: 'https://res.cloudinary.com/demo/video/upload/sample.jpg',
      tags: ['MERN', 'React', 'Node'],
      level: 'Intermediate',
      benefits: ['Job ready', 'Hands-on projects'],
      instructorId: instructor._id,
      isPublished: true
    });

    // 9. Create Sections (NEW)
    const introSection = await Section.create({
      title: 'Introduction',
      order: 1,
      courseId: course._id
    });

    const htmlSection = await Section.create({
      title: 'HTML Basics',
      order: 2,
      courseId: course._id
    });

    // 10. Create Videos for each section
    const introVideo = await Video.create({
      title: 'Welcome to the MERN Course',
      description: 'Course overview and setup instructions',
      videoUrl: 'https://res.cloudinary.com/demo/video/upload/mern_intro.mp4',
      duration: 8,
      courseId: course._id,
      sectionId: introSection._id,
      order: 1,
      isPreview: true
    });

    const htmlVideo1 = await Video.create({
      title: 'HTML Structure',
      description: 'Learn the basic HTML structure',
      videoUrl: 'https://res.cloudinary.com/demo/video/upload/html_structure.mp4',
      duration: 12,
      courseId: course._id,
      sectionId: htmlSection._id,
      order: 1
    });

    const htmlVideo2 = await Video.create({
      title: 'HTML Elements and Tags',
      description: 'Understand HTML elements and commonly used tags',
      videoUrl: 'https://res.cloudinary.com/demo/video/upload/html_tags.mp4',
      duration: 15,
      courseId: course._id,
      sectionId: htmlSection._id,
      order: 2
    });

    // 11. Create Video Review
    await VideoReview.create({
      videoId: introVideo._id,
      userId: student._id,
      comment: 'Amazing intro lesson!',
      resolved: false
    });

    // 12. Create Course Rating
    await CourseRating.create({
      courseId: course._id,
      userId: student._id,
      rating: 5,
      review: 'Excellent course!'
    });

    // 13. Create Order
    const order = await Order.create({
      courseId: course._id,
      userId: student._id,
      status: 'Pending',
      paymentIntentId: 'pi_123456789',
      paymentStatus: 'succeeded',
      amountPaid: 1999,
      currency: 'INR',
      accessGranted: true
    });

    // 14. Create Payment
    await Payment.create({
      orderId: order._id,
      userId: student._id,
      courseId: course._id,
      paymentMethod: 'Stripe',
      amount: 1999,
      currency: 'INR',
      status: 'succeeded',
      transactionId: 'txn_987654321',
      receiptUrl: 'https://stripe.com/receipt/example'
    });

    // 15. Create Enrollment
    await Enrollment.create({
      courseId: course._id,
      userId: student._id,
      progress: 25,
      isComplete: false
    });

    // 16. Create Notification
    await Notification.create({
      userId: instructor._id,
      type: 'Course Purchase',
      message: 'Your course was purchased by a student',
      forRole: 'Instructor',
      isRead: false
    });

    console.log('✅ Database seeded successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run seed
seedDatabase();
