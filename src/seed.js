// Create Courses

require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const Course = require("./models/Course");
const Result = require("./models/Result");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("DB connection failed", err);
    process.exit(1);
  }
};

const seedData = async () => {
  await connectDB();

  // 🧹 Clear previous data
  await Promise.all([
    User.deleteMany({}),
    Course.deleteMany({}),
    Result.deleteMany({}),
  ]);

  // 👩‍🏫 Create Lecturers
  const lecturers = await User.insertMany([
    {
      name: "Prof. Enikuomehin",
      identifier: "enikuomehin@example.com",
      password: "123456",
      role: "lecturer",
    },
    {
      name: "Prof. Aribisala",
      identifier: "aribisala@example.com",
      password: "123456",
      role: "lecturer",
    },
    {
      name: "Prof. Rahman",
      identifier: "rahman@example.com",
      password: "123456",
      role: "lecturer",
    },
    {
      name: "Dr. Sotonwa",
      identifier: "sotonwa@example.com",
      password: "123456",
      role: "lecturer",
    },
    {
      name: "Mr. Ajagbe",
      identifier: "ajagbe@example.com",
      password: "123456",
      role: "lecturer",
    },
    {
      name: "Mr. Asokere",
      identifier: "asokere@example.com",
      password: "123456",
      role: "lecturer",
    },
    {
      name: "Dr. Aiyenko",
      identifier: "aiyenko@example.com",
      password: "123456",
      role: "lecturer",
    },
    {
      name: "Dr. Raji",
      identifier: "raji@example.com",
      password: "123456",
      role: "lecturer",
    },
    {
      name: "Dr. Oloyede",
      identifier: "oloyede@example.com",
      password: "123456",
      role: "lecturer",
    },
    {
      name: "Mr. Shanu",
      identifier: "shanu@example.com",
      password: "123456",
      role: "lecturer",
    },
    {
      name: "Mrs. Orioke",
      identifier: "orioke@example.com",
      password: "123456",
      role: "lecturer",
    },
    {
      name: "Dr. Adenowo",
      identifier: "adenowo@example.com",
      password: "123456",
      role: "lecturer",
    },
    {
      name: "Dr. Adam",
      identifier: "adam@example.com",
      password: "123456",
      role: "lecturer",
    },
    {
      name: "Mr. Mayowa",
      identifier: "mayowa@example.com",
      password: "123456",
      role: "lecturer",
    },
    {
      name: "Mr. Bamiro",
      identifier: "bamiro@example.com",
      password: "123456",
      role: "lecturer",
    },
  ]);

  const lecturerMap = {};
  lecturers.forEach((lec) => (lecturerMap[lec.name] = lec._id));

  const coursesData = [
    // Year 1
    {
      code: "DSD010",
      title: "Introduction to Python Programming",
      creditUnit: 3,
      semester: "First",
      level: 100,
      department: "Computer Science",
      session: "2023/2024",
      lecturer: lecturerMap["Prof. Enikuomehin"],
    },
    {
      code: "CSD010",
      title: "Introduction to the Internet",
      creditUnit: 2,
      semester: "First",
      level: 100,
      department: "Computer Science",
      session: "2023/2024",
      lecturer: lecturerMap["Prof. Aribisala"],
    },
    {
      code: "CSD012",
      title: "Introduction to Systems Analysis",
      creditUnit: 3,
      semester: "First",
      level: 100,
      department: "Computer Science",
      session: "2023/2024",
      lecturer: lecturerMap["Prof. Rahman"],
    },
    {
      code: "CSD014",
      title: "Computer Application Packages",
      creditUnit: 3,
      semester: "First",
      level: 100,
      department: "Computer Science",
      session: "2023/2024",
      lecturer: lecturerMap["Dr. Sotonwa"],
    },
    {
      code: "CSD016",
      title: "Data Structure and Algorithms",
      creditUnit: 3,
      semester: "First",
      level: 100,
      department: "Computer Science",
      session: "2023/2024",
      lecturer: lecturerMap["Dr. Aiyenko"],
    },
    {
      code: "CSD018",
      title: "PC Upgrade & Maintenance",
      creditUnit: 3,
      semester: "First",
      level: 100,
      department: "Computer Science",
      session: "2023/2024",
      lecturer: lecturerMap["Dr. Raji"],
    },
    {
      code: "SWS012",
      title: "SIWES",
      creditUnit: 2,
      semester: "Second",
      level: 100,
      department: "Computer Science",
      session: "2023/2024",
      lecturer: lecturerMap["Dr. Aiyenko"],
    },

    // Year 2
    {
      code: "DSD020",
      title: "Supervised Machine Learning",
      creditUnit: 3,
      semester: "First",
      level: 200,
      department: "Computer Science",
      session: "2024/2025",
      lecturer: lecturerMap["Prof. Aribisala"],
    },
    {
      code: "DSD022",
      title: "Tableau",
      creditUnit: 2,
      semester: "First",
      level: 200,
      department: "Computer Science",
      session: "2024/2025",
      lecturer: lecturerMap["Prof. Enikuomehin"],
    },
    {
      code: "DSD024",
      title: "SQL for Data Science",
      creditUnit: 3,
      semester: "First",
      level: 200,
      department: "Computer Science",
      session: "2024/2025",
      lecturer: lecturerMap["Prof. Rahman"],
    },
    {
      code: "CSD022",
      title: "OOP FORTRAN",
      creditUnit: 3,
      semester: "First",
      level: 200,
      department: "Computer Science",
      session: "2024/2025",
      lecturer: lecturerMap["Dr. Oloyede"],
    },
    {
      code: "CSD020",
      title: "Basic Hardware Maintenance",
      creditUnit: 2,
      semester: "First",
      level: 200,
      department: "Computer Science",
      session: "2024/2025",
      lecturer: lecturerMap["Mr. Mayowa"],
    },
    {
      code: "DSD026",
      title: "Management Information System",
      creditUnit: 2,
      semester: "Second",
      level: 200,
      department: "Computer Science",
      session: "2024/2025",
      lecturer: lecturerMap["Dr. Aiyenko"],
    },
    {
      code: "CSD024",
      title: "Web Technology",
      creditUnit: 2,
      semester: "Second",
      level: 200,
      department: "Computer Science",
      session: "2024/2025",
      lecturer: lecturerMap["Dr. Adam"],
    },
    {
      code: "CSD026",
      title: "Small Business Start Up",
      creditUnit: 2,
      semester: "Second",
      level: 200,
      department: "Computer Science",
      session: "2024/2025",
      lecturer: lecturerMap["Dr. Adenowo"],
    },
    {
      code: "CSD028",
      title: "Computer Systems Troubleshooting II",
      creditUnit: 2,
      semester: "Second",
      level: 200,
      department: "Computer Science",
      session: "2024/2025",
      lecturer: lecturerMap["Dr. Raji"],
    },
    {
      code: "CPD022",
      title: "Project",
      creditUnit: 4,
      semester: "Second",
      level: 200,
      department: "Computer Science",
      session: "2024/2025",
      lecturer: lecturerMap["Dr. Aiyenko"],
    },
  ];

  const courses = await Course.insertMany(coursesData);
  console.log("✅ Courses created");

  const firstNames = [
    "Adewale",
    "Chioma",
    "Babatunde",
    "Ngozi",
    "Oluwaseun",
    "Amara",
    "Chukwuemeka",
    "Funmilayo",
    "Ibrahim",
    "Zainab",
    "Kehinde",
    "Aisha",
    "Oluwatobi",
    "Blessing",
    "Emeka",
    "Fatima",
    "Tunde",
    "Chiamaka",
    "Yusuf",
    "Nneka",
    "Segun",
    "Hauwa",
    "Femi",
    "Abiola",
    "Musa",
    "Chidinma",
    "Tayo",
    "Kemi",
    "Uche",
    "Aminat",
    "Ade",
    "Ifeoma",
    "Sola",
    "Zara",
    "Bola",
    "Hadiza",
    "Kunle",
    "Obiageli",
    "Ahmed",
    "Folake",
    "Chidi",
    "Mariam",
    "Damilola",
    "Patience",
    "Biodun",
    "Halima",
    "Tosin",
    "Ezinne",
    "Rasheed",
    "Ogechi",
    "Wale",
    "Safiya",
  ];

  const lastNames = [
    "Adeyemi",
    "Okafor",
    "Bello",
    "Eze",
    "Williams",
    "Okonkwo",
    "Mohammed",
    "Nwosu",
    "Ajayi",
    "Okeke",
    "Ibrahim",
    "Uzoma",
    "Olaniyan",
    "Chukwu",
    "Hassan",
    "Onyeka",
    "Oladipo",
    "Nmadu",
    "Yusuf",
    "Ogbonna",
    "Taiwo",
    "Echezona",
    "Abdullahi",
    "Nnamdi",
    "Adeniran",
    "Ikechukwu",
    "Musa",
    "Chibueze",
    "Akinyemi",
    "Ibekwe",
    "Suleiman",
    "Uchenna",
    "Oyebanji",
    "Chinedu",
    "Lawal",
    "Obiora",
    "Bakare",
    "Kalu",
    "Usman",
    "Emeka",
    "Oni",
    "Nnaji",
    "Garba",
    "Azubuike",
    "Fashola",
    "Agu",
    "Aliyu",
    "Nwafor",
    "Ogunleye",
    "Udoka",
  ];

  // 👨‍🎓 Create Students and Assign Courses
  const students = [];
  for (let i = 1; i <= 50; i++) {
    try {
      const firstName =
        firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const fullName = `${firstName} ${lastName}`;

      const matric = `230${String(i).padStart(8, "0")}`;
      console.log(`Creating student ${i}/50: ${matric}`);

      const student = await User.create({
        name: fullName,
        identifier: matric,
        password: "123456",
        role: "student",
        courses: courses.map((c) => c._id),
      });

      // Generate results for each assigned course
      for (const course of courses) {
        const ca = Math.floor(Math.random() * 30) + 10; // 10 - 40
        const exam = Math.floor(Math.random() * 50) + 10; // 10 - 60
        await Result.create({
          student: student._id,
          course: course._id,
          semester: course.semester,
          session: course.session,
          ca,
          exam,
        });
      }

      students.push(student);
      console.log(`✅ Student ${i} created with ${courses.length} results`);
    } catch (error) {
      console.error(`❌ Error creating student ${i}:`, error.message);
    }
  }

  console.log(`\n✅ Total students created: ${students.length}/50`);
  console.log(
    "✅ Lecturers, courses, students, and results seeded successfully"
  );
  process.exit(0);
};

seedData();
