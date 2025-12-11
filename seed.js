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
const Section = require('./Models/SectionModel');
const Video = require('./Models/VideoModel');
const VideoReview = require('./Models/VideoReviewModel');
const CourseRating = require('./Models/CourseRatingModel');
const Order = require('./Models/OrderModel');
const Payment = require('./Models/PaymentModel');
const Enrollment = require('./Models/EnrollmentModel');
const Notification = require('./Models/NotificationModel');

// Debug dotenv
console.log("MONGO_URL:", process.env.MONGO_URL);
console.log("SECRET:", process.env.SECRET);

// Connect
mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("MongoDB Connected"))
.catch(err => { console.error(err); process.exit(1); });

const seedDatabase = async () => {
    try {

        console.log("Clearing old data...");
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

        console.log("Creating roles...");
        const roles = await Role.insertMany([
            { name: "Admin" },
            { name: "Instructor" },
            { name: "User" }
        ]);

        const [adminRole, instructorRole, userRole] = roles;

        const hashedPassword = await bcrypt.hash("1234", 10);

        console.log("Creating users...");
        const admin = await User.create({
            name: "Admin User",
            email: "admin@gmail.com",
            password: hashedPassword,
            roleId: adminRole._id
        });

        const instructor1 = await User.create({
            name: "Instructor One",
            email: "inst1@gmail.com",
            password: hashedPassword,
            roleId: instructorRole._id
        });

        const instructor2 = await User.create({
            name: "Instructor Two",
            email: "inst2@gmail.com",
            password: hashedPassword,
            roleId: instructorRole._id
        });

        const user1 = await User.create({
            name: "User One",
            email: "user1@gmail.com",
            password: hashedPassword,
            roleId: userRole._id
        });

        const user2 = await User.create({
            name: "User Two",
            email: "user2@gmail.com",
            password: hashedPassword,
            roleId: userRole._id
        });

        console.log("Creating profiles...");
        await Profile.create({
            userId: instructor1._id,
            fullName: "Instructor One",
            image: "https://randomuser.me/api/portraits/men/45.jpg",
            bio: "Expert in Web Dev"
        });

        await Profile.create({
            userId: instructor2._id,
            fullName: "Instructor Two",
            image: "https://randomuser.me/api/portraits/men/46.jpg",
            bio: "Expert in MERN"
        });

        await Profile.create({
            userId: user1._id,
            fullName: "User One"
        });

        await Profile.create({
            userId: user2._id,
            fullName: "User Two"
        });

        console.log("Creating 5 categories...");
        const categories = await Category.insertMany([
            { name: "Web Development", image: "https://picsum.photos/200" },
            { name: "Data Science", image: "https://picsum.photos/201" },
            { name: "Mobile Development", image: "https://picsum.photos/202" },
            { name: "Machine Learning", image: "https://picsum.photos/203" },
            { name: "Cloud Computing", image: "https://picsum.photos/204" }
        ]);

        console.log("Creating courses for each instructor...");

        const course1 = await Course.create({
            title: "Full MERN Bootcamp",
            description: "Learn MERN from zero.",
            categoryId: categories[0]._id,
            price: 999,
            estimatedPrice: 1499,
            thumbnail: "https://picsum.photos/250",
            tags: ["MERN", "React"],
            level: "Beginner",
            benefits: ["Real projects"],
            instructorId: instructor1._id,
            isPublished: true
        });

        const course2 = await Course.create({
            title: "Modern JavaScript Mastery",
            description: "Everything about JS.",
            categoryId: categories[1]._id,
            price: 1299,
            estimatedPrice: 1999,
            thumbnail: "https://picsum.photos/251",
            tags: ["JS", "ES6"],
            level: "Intermediate",
            benefits: ["Industry Ready"],
            instructorId: instructor2._id,
            isPublished: true
        });

        console.log("Creating sections + videos for Course 1...");
        const sec1 = await Section.create({
            title: "Introduction",
            order: 1,
            courseId: course1._id
        });

        const sec2 = await Section.create({
            title: "React Basics",
            order: 2,
            courseId: course1._id
        });

        await Video.create({
            title: "Welcome to MERN",
            description: "Course intro",
            videoUrl: "https://samplelib.com/lib/preview/mp4/sample-5s.mp4",
            duration: "05:00",
            courseId: course1._id,
            sectionId: sec1._id,
            order: 1,
            isPreview: true
        });

        await Video.create({
            title: "React Intro",
            description: "Learn React",
            videoUrl: "https://samplelib.com/lib/preview/mp4/sample-5s.mp4",
            duration: "08:00",
            courseId: course1._id,
            sectionId: sec2._id,
            order: 1
        });

        console.log("Creating sections + videos for Course 2...");
        const sec3 = await Section.create({
            title: "JS Intro",
            order: 1,
            courseId: course2._id
        });

        const sec4 = await Section.create({
            title: "Advanced JS",
            order: 2,
            courseId: course2._id
        });

        await Video.create({
            title: "What is JavaScript?",
            videoUrl: "https://samplelib.com/lib/preview/mp4/sample-5s.mp4",
            duration: "06:00",
            courseId: course2._id,
            sectionId: sec3._id,
            isPreview: true
        });

        await Video.create({
            title: "Closures",
            videoUrl: "https://samplelib.com/lib/preview/mp4/sample-5s.mp4",
            duration: "10:00",
            courseId: course2._id,
            sectionId: sec4._id
        });

        console.log("Seeding done successfully!");
        process.exit(0);

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedDatabase();
