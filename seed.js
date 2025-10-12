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

        // 1. Clear all old data
        await Promise.all([
            Role.deleteMany(),
            User.deleteMany(),
            Profile.deleteMany(),
            Category.deleteMany(),
            Course.deleteMany(),
            Video.deleteMany(),
            VideoReview.deleteMany(),
            CourseRating.deleteMany(),
            Order.deleteMany(),
            Payment.deleteMany(),
            Enrollment.deleteMany(),
            Notification.deleteMany()
        ]);

        // 2. Insert Roles
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

        // 5. Generate JWT token for admin (for testing purposes)
        const adminToken = jwt.sign({ _id: admin._id, role: 'Admin' }, process.env.SECRET, { expiresIn: '7d' });
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

        // 9. Create Video
        const video = await Video.create({
            title: 'Introduction to MERN',
            description: 'Overview of the MERN stack components',
            videoUrl: 'https://res.cloudinary.com/demo/video/upload/mern_intro.mp4',
            duration: 10,
            courseId: course._id,
            order: 1,
            isPreview: true
        });

        // 10. Create Video Review
        await VideoReview.create({
            videoId: video._id,
            userId: student._id,
            comment: 'Amazing intro lesson!',
            resolved: false
        });

        // 11. Create Course Rating
        await CourseRating.create({
            courseId: course._id,
            userId: student._id,
            rating: 5,
            review: 'Excellent course!'
        });

        // 12. Create Order
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

        // 13. Create Payment
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

        // 14. Create Enrollment
        await Enrollment.create({
            courseId: course._id,
            userId: student._id,
            progress: 25,
            isComplete: false
        });

        // 15. Create Notification
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
