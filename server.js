const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// MOCK DATABASE & CAMPUS DATA
// ==========================================
const db = {
  student: {
    id: "STU-2023-8492",
    name: "Aryan Sharma",
    rollNo: "23BCSE1042",
    email: "aryan.sharma@campus.univ.edu",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    program: "B.Tech Computer Science & Engineering",
    semester: 5,
    academicYear: "2026-2027",
    cgpa: 8.74,
    hostel: {
      block: "Mandovi Boys Hostel (Block B)",
      room: "B-312",
      warden: "Dr. R.K. Verma",
      contact: "+91 98765 43210"
    },
    messCard: "NM-8492 (Central Mess - Meal Plan A)"
  },

  attendance: [
    { code: "CS-301", name: "Database Management Systems", faculty: "Dr. Ananya Sen", attended: 28, total: 32, credits: 4 },
    { code: "CS-302", name: "Computer Networks & Security", faculty: "Prof. Vikram Malhotra", attended: 23, total: 32, credits: 4 },
    { code: "CS-303", name: "Software Engineering & Agile", faculty: "Dr. Neha Gupta", attended: 27, total: 30, credits: 3 },
    { code: "CS-304", name: "Artificial Intelligence & ML", faculty: "Dr. Rajesh Kulkarni", attended: 31, total: 34, credits: 4 },
    { code: "MA-301", name: "Discrete Mathematical Structures", faculty: "Prof. S. Ramanathan", attended: 21, total: 28, credits: 3 },
    { code: "CS-305", name: "Full-Stack Web Technologies Lab", faculty: "Er. Kunal Roy", attended: 14, total: 15, credits: 2 }
  ],

  timetable: {
    Monday: [
      { id: 1, time: "09:00 - 10:00 AM", code: "CS-301", name: "Database Management Systems", block: "Aryabhatta Block", room: "Room 304 (3rd Floor)", faculty: "Dr. Ananya Sen", type: "Lecture" },
      { id: 2, time: "10:00 - 11:00 AM", code: "CS-304", name: "Artificial Intelligence & ML", block: "Aryabhatta Block", room: "Smart Hall 102", faculty: "Dr. Rajesh Kulkarni", type: "Lecture" },
      { id: 3, time: "11:15 - 01:15 PM", code: "CS-305", name: "Full-Stack Web Tech Lab", block: "Aryabhatta Block", room: "Lab 4 (Ground Floor)", faculty: "Er. Kunal Roy", type: "Practical" },
      { id: 4, time: "01:15 - 02:00 PM", code: "LUNCH", name: "Lunch Break & Rest", block: "Central Mess", room: "Dining Hall 1", faculty: "-", type: "Break" },
      { id: 5, time: "02:00 - 03:00 PM", code: "CS-302", name: "Computer Networks & Security", block: "Ramanujan Block", room: "LH-2 (2nd Floor)", faculty: "Prof. Vikram Malhotra", type: "Lecture" }
    ],
    Tuesday: [
      { id: 6, time: "09:00 - 10:00 AM", code: "MA-301", name: "Discrete Mathematical Structures", block: "Ramanujan Block", room: "Room 201", faculty: "Prof. S. Ramanathan", type: "Lecture" },
      { id: 7, time: "10:00 - 11:00 AM", code: "CS-303", name: "Software Engineering & Agile", block: "Aryabhatta Block", room: "Room 304", faculty: "Dr. Neha Gupta", type: "Lecture" },
      { id: 8, time: "11:15 - 12:15 PM", code: "CS-301", name: "Database Management Systems", block: "Aryabhatta Block", room: "Room 304", faculty: "Dr. Ananya Sen", type: "Tutorial" },
      { id: 9, time: "02:00 - 04:00 PM", code: "CS-304", name: "AI/ML Project Mentorship", block: "C.V. Raman Block", room: "Research Lab 2", faculty: "Dr. Rajesh Kulkarni", type: "Project" }
    ],
    Wednesday: [
      { id: 10, time: "09:00 - 10:00 AM", code: "CS-302", name: "Computer Networks & Security", block: "Ramanujan Block", room: "LH-2", faculty: "Prof. Vikram Malhotra", type: "Lecture" },
      { id: 11, time: "10:00 - 11:00 AM", code: "MA-301", name: "Discrete Mathematical Structures", block: "Ramanujan Block", room: "Room 201", faculty: "Prof. S. Ramanathan", type: "Lecture" },
      { id: 12, time: "11:15 - 01:15 PM", code: "CS-301", name: "DBMS Query Tuning Lab", block: "Aryabhatta Block", room: "Lab 2", faculty: "Dr. Ananya Sen", type: "Practical" },
      { id: 13, time: "02:30 - 04:30 PM", code: "SPORTS", name: "Physical Education & Club Activities", block: "Sports Complex", room: "Indoor Arena", faculty: "Coach Rawat", type: "Activity" }
    ],
    Thursday: [
      { id: 14, time: "09:00 - 10:00 AM", code: "CS-304", name: "Artificial Intelligence & ML", block: "Aryabhatta Block", room: "Smart Hall 102", faculty: "Dr. Rajesh Kulkarni", type: "Lecture" },
      { id: 15, time: "10:00 - 11:00 AM", code: "CS-303", name: "Software Engineering & Agile", block: "Aryabhatta Block", room: "Room 304", faculty: "Dr. Neha Gupta", type: "Lecture" },
      { id: 16, time: "11:15 - 12:15 PM", code: "CS-302", name: "Computer Networks Tutorial", block: "Ramanujan Block", room: "Room 105", faculty: "Prof. Vikram Malhotra", type: "Tutorial" },
      { id: 17, time: "02:00 - 03:00 PM", code: "MA-301", name: "Discrete Math Problem Solving", block: "Ramanujan Block", room: "Room 201", faculty: "Prof. S. Ramanathan", type: "Tutorial" }
    ],
    Friday: [
      { id: 18, time: "09:00 - 11:00 AM", code: "CS-305", name: "Full-Stack Project Sprint", block: "Aryabhatta Block", room: "Lab 4", faculty: "Er. Kunal Roy", type: "Practical" },
      { id: 19, time: "11:15 - 12:15 PM", code: "CS-303", name: "Software Testing & CI/CD", block: "Aryabhatta Block", room: "Room 304", faculty: "Dr. Neha Gupta", type: "Lecture" },
      { id: 20, time: "02:00 - 03:30 PM", code: "SEMINAR", name: "Industry Expert Talk / Tech Talk", block: "Tagore Auditorium", room: "Main Hall", faculty: "Guest Speaker", type: "Seminar" }
    ]
  },

  campusBlocks: [
    {
      id: "aryabhatta",
      name: "Aryabhatta Block",
      category: "Academic",
      departments: ["Computer Science", "Information Tech", "Data Science & AI"],
      floors: 4,
      totalRooms: 48,
      keyHighlights: ["Supercomputing Lab", "Smart Lecture Halls 101-104", "Robotics Club (Ground Floor)"],
      coords: { x: 320, y: 160 },
      distanceFromHostel: "280 meters (approx 3.5 mins walk)"
    },
    {
      id: "ramanujan",
      name: "Ramanujan Block",
      category: "Academic",
      departments: ["Mathematics", "Electronics & Comm", "Electrical Engg"],
      floors: 4,
      totalRooms: 40,
      keyHighlights: ["Lecture Halls LH-1 to LH-6", "Semiconductor Lab", "Digital Signal Processing Center"],
      coords: { x: 500, y: 180 },
      distanceFromHostel: "420 meters (approx 5.5 mins walk)"
    },
    {
      id: "cv-raman",
      name: "C.V. Raman Science Block",
      category: "Academic / Labs",
      departments: ["Physics", "Chemistry", "Nanotechnology Labs"],
      floors: 3,
      totalRooms: 30,
      keyHighlights: ["Central Instrumentation Lab", "Clean Room 1", "Optics Darkroom"],
      coords: { x: 680, y: 220 },
      distanceFromHostel: "580 meters (approx 7.5 mins walk)"
    },
    {
      id: "mandovi-hostel",
      name: "Mandovi Boys Hostel",
      category: "Hostel",
      departments: ["Blocks A, B, C", "Warden Residence", "Guest Rooms"],
      floors: 4,
      totalRooms: 180,
      keyHighlights: ["Student B-312 (Aryan Sharma)", "Badminton Court", "Night Canteen & Reading Lounge"],
      coords: { x: 180, y: 440 },
      distanceFromHostel: "You are here (Block B, Room 312)"
    },
    {
      id: "shivalik-hostel",
      name: "Shivalik Girls Hostel",
      category: "Hostel",
      departments: ["Blocks 1, 2, 3", "Security Desk"],
      floors: 4,
      totalRooms: 190,
      keyHighlights: ["Gymnasium Annex", "Garden Courtyard", "24/7 Security Command"],
      coords: { x: 800, y: 440 },
      distanceFromHostel: "650 meters"
    },
    {
      id: "central-mess",
      name: "Central Mess & Dining Hub",
      category: "Dining",
      departments: ["Dining Hall 1 (Veg/Non-Veg)", "Dining Hall 2 (Jain/Diet)", "Cafeteria Express"],
      floors: 2,
      totalRooms: 6,
      keyHighlights: ["Breakfast: 7:30 - 9:30 AM", "Lunch: 12:30 - 2:30 PM", "Dinner: 7:30 - 9:45 PM"],
      coords: { x: 380, y: 380 },
      distanceFromHostel: "150 meters (approx 2 mins walk)"
    },
    {
      id: "central-library",
      name: "Tagore Central Library",
      category: "Facility",
      departments: ["Digital Resource Center", "Silent Reading Floors", "Journal Archive"],
      floors: 3,
      totalRooms: 18,
      keyHighlights: ["24/7 Air-Conditioned Reading Hall", "RFID Book Self-Checkout", "150,000+ Books & IEEE Access"],
      coords: { x: 500, y: 320 },
      distanceFromHostel: "310 meters (approx 4 mins walk)"
    },
    {
      id: "admin-block",
      name: "Administrative & Accounts Block",
      category: "Administration",
      departments: ["Registrar", "Student Accounts & Fee Desk", "Dean Academic Office"],
      floors: 3,
      totalRooms: 24,
      keyHighlights: ["Fee Counter & Scholarship Desk", "Exam Cell & Transcript Counter", "Placement Cell (3rd Floor)"],
      coords: { x: 680, y: 350 },
      distanceFromHostel: "490 meters (approx 6 mins walk)"
    },
    {
      id: "health-center",
      name: "Campus Health & Medical Center",
      category: "Medical / SOS",
      departments: ["Doctor OPD", "Emergency 24/7 Ward", "Pharmacy"],
      floors: 1,
      totalRooms: 8,
      keyHighlights: ["24x7 Ambulance Available", "Free Doctor Consultation & First Aid", "Emergency Helpline: Ext. 108"],
      coords: { x: 260, y: 280 },
      distanceFromHostel: "200 meters (approx 2.5 mins walk)"
    },
    {
      id: "sports-complex",
      name: "Olympic Sports Complex",
      category: "Sports",
      departments: ["Gymnasium", "Indoor Basketball & Badminton", "Athletics Track"],
      floors: 2,
      totalRooms: 12,
      keyHighlights: ["Olympic Standard Swimming Pool", "Fitness & Weightlifting Gym", "Floodlit Football Ground"],
      coords: { x: 820, y: 240 },
      distanceFromHostel: "700 meters (approx 9 mins walk)"
    }
  ],

  messMenu: {
    Today: "Wednesday",
    schedule: {
      Monday: {
        breakfast: { items: "Aloo Paratha, Curd, Pickle, Boiled Egg / Banana, Tea / Coffee", calories: 480, tag: "Energy Rich" },
        lunch: { items: "Rajma Masala, Steamed Basmati Rice, Chapati, Boondi Raita, Seasonal Salad, Gulab Jamun", calories: 720, tag: "Chef's Special" },
        snacks: { items: "Samosa with Mint Chutney, Masala Chai, Biscuits", calories: 310, tag: "Crispy" },
        dinner: { items: "Paneer Butter Masala / Chicken Curry, Dal Tadka, Tandoori Roti, Jeera Rice, Kheer", calories: 780, tag: "High Protein" }
      },
      Tuesday: {
        breakfast: { items: "Idli, Vada, Coconut Chutney, Hot Sambar, Fresh Fruit Juice", calories: 420, tag: "South Indian" },
        lunch: { items: "Kadhi Pakora, Jeera Rice, Aloo Gobi Dry, Roti, Cucumber Salad", calories: 650, tag: "Homestyle" },
        snacks: { items: "Veg Cutlet, Tomato Sauce, Ginger Tea", calories: 290, tag: "Light" },
        dinner: { items: "Mix Veg Handi, Dal Makhani, Butter Naan / Phulka, Peas Pulao, Fruit Custard", calories: 740, tag: "Royal" }
      },
      Wednesday: {
        breakfast: { items: "Poha with Roasted Peanuts, Sev, Jalebi, Boiled Sprouts, Tea / Milk", calories: 450, tag: "Indori Classic" },
        lunch: { items: "Chole Bhature, Pulao Rice, Boondi Raita, Onion Pickle, Moong Dal Halwa", calories: 820, tag: "Student Favorite" },
        snacks: { items: "Pav Bhaji, Filter Coffee, Lemon Tea", calories: 340, tag: "Spicy" },
        dinner: { items: "Shahi Paneer / Egg Masala, Yellow Dal Fry, Missi Roti, Steam Rice, Ice Cream", calories: 760, tag: "High Protein" }
      },
      Thursday: {
        breakfast: { items: "Masala Dosa, Tomato Chutney, Sambar, Scrambled Eggs / Papaya", calories: 460, tag: "South Indian" },
        lunch: { items: "Dal Palak, Dum Aloo Kashmiri, Roti, Steamed Rice, Green Salad, Rasgulla", calories: 680, tag: "Nutritious" },
        snacks: { items: "Bread Pakora, Green Chutney, Adrak Chai", calories: 320, tag: "Hot & Crispy" },
        dinner: { items: "Malai Kofta / Mutton Rogan Josh (Optional), Dal Tadka, Roomali Roti, Biryani Rice", calories: 800, tag: "Feast Night" }
      },
      Friday: {
        breakfast: { items: "Methi Thepla, Chundo, Butter, Boiled Egg, Coffee / Bournvita", calories: 410, tag: "Gujarati" },
        lunch: { items: "Veg Pulao, Paneer Bhurji, Dal Panchmel, Roti, Mint Raita, Sweet Lassi", calories: 710, tag: "Balanced" },
        snacks: { items: "Dhokla with Green Chilli, Masala Chai", calories: 240, tag: "Low Calorie" },
        dinner: { items: "Matar Mushroom / Kadai Chicken, Dal Fry, Tandoori Roti, Ghee Rice, Jalebi", calories: 770, tag: "Weekend Special" }
      },
      Saturday: {
        breakfast: { items: "Poori Bhaji, Halwa, Pickle, Banana, Tea / Coffee", calories: 510, tag: "Traditional" },
        lunch: { items: "South Indian Thali: Lemon Rice, Rasam, Avial, Poriyal, Appalam, Curd", calories: 640, tag: "Traditional Thali" },
        snacks: { items: "Aloo Bonda, Coconut Chutney, Tea", calories: 300, tag: "Evening Snacks" },
        dinner: { items: "Hyderabadi Veg Biryani / Chicken Dum Biryani, Mirchi Ka Salan, Raita, Shahi Tukda", calories: 850, tag: "Biryani Night" }
      },
      Sunday: {
        breakfast: { items: "Club Sandwich / French Toast, French Fries, Milkshake, Seasonal Fruits", calories: 490, tag: "Continental Brunch" },
        lunch: { items: "Special Sunday Feast: Paneer Tikka Masala, Dal Makhani, Lachha Paratha, Jeera Rice, Rasmalai", calories: 860, tag: "Sunday Special" },
        snacks: { items: "Veg Momos with Spicy Dip, Cold Coffee", calories: 280, tag: "Youth Special" },
        dinner: { items: "Khichdi & Kadhi / Light Dinner, Papad, Chokha, Roasted Papad, Sweet Dalia", calories: 520, tag: "Light & Easy" }
      }
    },
    ratings: [
      { student: "Karan V.", rating: 5, comment: "Chole Bhature today were top notch! Halwa was fresh.", time: "1:45 PM" },
      { student: "Megha P.", rating: 4, comment: "Spicy Pav Bhaji in snacks was great. Chai quantity good.", time: "5:30 PM" },
      { student: "Rohit D.", rating: 5, comment: "Paneer quality has improved a lot this semester.", time: "Yesterday" }
    ]
  },

  fees: {
    status: "Due Pending",
    totalAmount: 114500,
    paidAmount: 100000,
    pendingAmount: 14500,
    dueDate: "November 25, 2026",
    breakdown: [
      { id: "FEE-1", head: "Academic Tuition Fee (Sem V)", amount: 75000, status: "Paid", paidOn: "12 Aug 2026", txId: "TXN-849201" },
      { id: "FEE-2", head: "Hostel Room Rent & Amenities", amount: 25000, status: "Paid", paidOn: "12 Aug 2026", txId: "TXN-849202" },
      { id: "FEE-3", head: "Central Mess Advance (Sem V)", amount: 10000, status: "Pending", paidOn: "-", txId: "-" },
      { id: "FEE-4", head: "University Exam & Lab Tech Fee", amount: 4500, status: "Pending", paidOn: "-", txId: "-" }
    ],
    receipts: [
      {
        receiptNo: "REC-2026-AUG-1142",
        date: "12-08-2026 14:22:10",
        amountPaid: 100000,
        txRef: "UPI/321876540982/HDFC",
        mode: "UPI (Google Pay)",
        status: "Success",
        itemsCovered: "Tuition Fee + Hostel Fee"
      }
    ]
  }
};

// ==========================================
// REST API ENDPOINTS
// ==========================================

// 1. Student Profile & Dashboard Overview
app.get('/api/student', (req, res) => {
  const totalAttended = db.attendance.reduce((sum, item) => sum + item.attended, 0);
  const totalClasses = db.attendance.reduce((sum, item) => sum + item.total, 0);
  const overallPercentage = Math.round((totalAttended / totalClasses) * 1000) / 10;

  res.json({
    ...db.student,
    stats: {
      overallAttendance: overallPercentage,
      totalCredits: db.attendance.reduce((sum, item) => sum + item.credits, 0),
      activeCourses: db.attendance.length,
      pendingFee: db.fees.pendingAmount
    }
  });
});

// 2. Attendance with Subject Details & Safe Bunk Analytics
app.get('/api/attendance', (req, res) => {
  const enrichedAttendance = db.attendance.map(item => {
    const percentage = Math.round((item.attended / item.total) * 1000) / 10;
    // Calculate how many more classes student can bunk while maintaining >= 75%
    // attended / (total + x) >= 0.75  => attended / 0.75 - total >= x
    const safeBunks = Math.max(0, Math.floor((item.attended / 0.75) - item.total));

    // Calculate how many consecutive classes student must attend to reach 75% if below
    let requiredToRecover = 0;
    if (percentage < 75) {
      // (attended + y) / (total + y) = 0.75 => attended + y = 0.75*total + 0.75*y => 0.25*y = 0.75*total - attended
      requiredToRecover = Math.max(0, Math.ceil((0.75 * item.total - item.attended) / 0.25));
    }

    return {
      ...item,
      percentage,
      isLow: percentage < 75,
      isWarning: percentage >= 75 && percentage < 80,
      safeBunks,
      requiredToRecover
    };
  });

  const totalAttended = db.attendance.reduce((sum, item) => sum + item.attended, 0);
  const totalClasses = db.attendance.reduce((sum, item) => sum + item.total, 0);
  const overall = Math.round((totalAttended / totalClasses) * 1000) / 10;

  res.json({
    overall,
    subjects: enrichedAttendance,
    totalAttended,
    totalClasses,
    targetAttendance: 75
  });
});

// 3. Attendance Simulation / What-If Predictor
app.post('/api/attendance/simulate', (req, res) => {
  const { code, action, count = 1 } = req.body;
  const subject = db.attendance.find(s => s.code === code);
  if (!subject) return res.status(404).json({ error: "Subject not found" });

  let newAttended = subject.attended;
  let newTotal = subject.total + parseInt(count);

  if (action === 'attend') {
    newAttended += parseInt(count);
  }

  const projectedPercentage = Math.round((newAttended / newTotal) * 1000) / 10;
  res.json({
    subject: subject.name,
    code: subject.code,
    currentPercentage: Math.round((subject.attended / subject.total) * 1000) / 10,
    projectedPercentage,
    status: projectedPercentage >= 75 ? "Safe" : "Critical Warning"
  });
});

// 4. Timetable
app.get('/api/timetable', (req, res) => {
  const day = req.query.day || "Wednesday";
  const schedule = db.timetable[day] || db.timetable["Wednesday"];
  
  // Highlight next upcoming lecture (mock for 10:30 AM Wednesday)
  const enriched = schedule.map((slot, index) => ({
    ...slot,
    isCurrent: index === 1,
    isNext: index === 2
  }));

  res.json({
    day,
    availableDays: Object.keys(db.timetable),
    schedule: enriched
  });
});

// 5. Campus Navigation & Blocks
app.get('/api/campus/blocks', (req, res) => {
  res.json(db.campusBlocks);
});

// Route Finder from Hostel to Target Room/Block
app.get('/api/campus/route', (req, res) => {
  const { from = "mandovi-hostel", to = "aryabhatta", room = "Room 304" } = req.query;
  const startBlock = db.campusBlocks.find(b => b.id === from) || db.campusBlocks[3];
  const destBlock = db.campusBlocks.find(b => b.id === to) || db.campusBlocks[0];

  const dx = destBlock.coords.x - startBlock.coords.x;
  const dy = destBlock.coords.y - startBlock.coords.y;
  const distance = Math.round(Math.sqrt(dx * dx + dy * dy) * 1.4); // approx meters
  const walkMinutes = Math.max(2, Math.round(distance / 75)); // approx 75m/min

  res.json({
    from: startBlock.name,
    to: `${destBlock.name} - ${room}`,
    distanceMeters: distance,
    walkTimeMinutes: walkMinutes,
    steps: [
      `Exit ${startBlock.name} main gate toward Central Avenue walkway.`,
      `Walk straight past the Central Library & Palm Fountain (approx ${Math.round(distance * 0.6)}m).`,
      `Turn right at the Academic Quadrangle entrance.`,
      `Enter ${destBlock.name} front lobby, take the elevator/stairs to ${room.includes('3') ? '3rd Floor' : '1st Floor'}.`,
      `Arrive at ${room}.`
    ],
    pathCoordinates: [
      startBlock.coords,
      { x: (startBlock.coords.x + destBlock.coords.x) / 2, y: startBlock.coords.y - 40 },
      destBlock.coords
    ]
  });
});

// 6. Mess Menu & Meal Rating
app.get('/api/mess/menu', (req, res) => {
  const day = req.query.day || db.messMenu.Today;
  const dayMenu = db.messMenu.schedule[day] || db.messMenu.schedule["Wednesday"];
  res.json({
    today: db.messMenu.Today,
    selectedDay: day,
    menu: dayMenu,
    recentRatings: db.messMenu.ratings
  });
});

app.post('/api/mess/rate', (req, res) => {
  const { student = "Aryan Sharma", rating, comment, meal = "Lunch" } = req.body;
  const newReview = {
    student,
    rating: parseInt(rating) || 5,
    comment: comment || "Delicious meal, well prepared!",
    time: "Just now"
  };
  db.messMenu.ratings.unshift(newReview);
  res.json({ success: true, review: newReview, totalReviews: db.messMenu.ratings.length });
});

// 7. Fees Breakdown & Payment Processing
app.get('/api/fees', (req, res) => {
  res.json(db.fees);
});

app.post('/api/fees/pay', (req, res) => {
  const { amount, method = "UPI" } = req.body;
  const payAmount = parseFloat(amount) || db.fees.pendingAmount;

  if (payAmount <= 0) {
    return res.status(400).json({ error: "Invalid payment amount" });
  }

  // Update DB
  db.fees.paidAmount += payAmount;
  db.fees.pendingAmount = Math.max(0, db.fees.pendingAmount - payAmount);
  if (db.fees.pendingAmount === 0) {
    db.fees.status = "All Dues Cleared";
  }

  // Mark pending items as paid
  db.fees.breakdown.forEach(item => {
    if (item.status === "Pending") {
      item.status = "Paid";
      item.paidOn = new Date().toLocaleDateString('en-GB');
      item.txId = `TXN-${Math.floor(100000 + Math.random() * 900000)}`;
    }
  });

  const txId = `UPI/${Date.now().toString().slice(-8)}/CAMPUS`;
  const receipt = {
    receiptNo: `REC-2026-NOV-${Math.floor(1000 + Math.random() * 9000)}`,
    date: new Date().toLocaleString(),
    amountPaid: payAmount,
    txRef: txId,
    mode: method,
    status: "Success",
    studentName: db.student.name,
    rollNo: db.student.rollNo,
    itemsCovered: "Central Mess Advance + Exam Fee (Sem V)"
  };

  db.fees.receipts.unshift(receipt);

  res.json({
    success: true,
    message: "Fee payment processed successfully!",
    receipt,
    newStatus: db.fees
  });
});

// 8. Campus AI Copilot (UniBot)
app.post('/api/chat', (req, res) => {
  const { message } = req.body;
  const q = (message || "").toLowerCase();

  let response = "";
  let actionCard = null;

  if (q.includes("attendance") || q.includes("bunk") || q.includes("miss") || q.includes("75")) {
    response = "Aapki overall attendance **84.6%** hai. Computer Networks (72%) ko chhod kar baki sabhi subjects safe zone me hain! AI & ML me aap 3 classes aur DBMS me 2 classes bina 75% se niche gire miss kar sakte hain.";
    actionCard = { type: "attendance", label: "Open Attendance Calculator", tab: "attendance" };
  } else if (q.includes("mess") || q.includes("food") || q.includes("lunch") || q.includes("dinner") || q.includes("khana")) {
    response = "Aaj Wednesday ka special menu hai! Lunch me **Chole Bhature, Pulao, Boondi Raita & Moong Dal Halwa** hai. Dinner me **Shahi Paneer / Egg Masala** aur Ice Cream serve hogi!";
    actionCard = { type: "mess", label: "View Weekly Mess Menu", tab: "mess" };
  } else if (q.includes("class") || q.includes("room") || q.includes("block") || q.includes("where") || q.includes("kaha") || q.includes("location")) {
    response = "Aapki agli class **Room 304, Aryabhatta Block** (3rd Floor) me hai. Mandovi Hostel se wahan pahunchne me approx 3.5 minutes ka walk hai.";
    actionCard = { type: "map", label: "Open Campus Navigator", tab: "map" };
  } else if (q.includes("fee") || q.includes("dues") || q.includes("pay") || q.includes("paisa")) {
    if (db.fees.pendingAmount > 0) {
      response = `Aapka **₹${db.fees.pendingAmount.toLocaleString()}** pending hai (Mess Advance: ₹10,000 + Exam Fee: ₹4,500). Due date 25th November 2026 hai. Aap online 1-click me pay kar sakte hain!`;
      actionCard = { type: "fee", label: "Pay Fees Online", tab: "fees" };
    } else {
      response = "Aapke semester ke sabhi dues cleared hain! Koi pending fee nahi hai. Aap digital receipt download kar sakte hain.";
      actionCard = { type: "fee", label: "View Receipts", tab: "fees" };
    }
  } else if (q.includes("library") || q.includes("kitab") || q.includes("book")) {
    response = "Tagore Central Library 24x7 open hai. Digital library access aur RFID self-checkout counters 1st Floor par available hain.";
    actionCard = { type: "map", label: "Locate Library on Map", tab: "map" };
  } else if (q.includes("sos") || q.includes("emergency") || q.includes("help") || q.includes("doctor")) {
    response = "🚨 Campus Medical Clinic 24x7 active hai (Ext: 108). Emergency ambulance Mandovi & Shivalik hostel gate par stationed rehti hai. SOS button dabakar aap turant security alert bhej sakte hain!";
    actionCard = { type: "sos", label: "Trigger Emergency SOS", tab: "sos" };
  } else {
    response = `Hello ${db.student.name}! Mai aapka CampusPulse AI Assistant hu. Aap mujhse classes, block navigation, hostel, attendance bunk prediction, mess menu ya fee payment ke baare me kuch bhi pooch sakte hain.`;
  }

  res.json({
    reply: response,
    actionCard,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });
});

// 9. Emergency SOS Alert
app.post('/api/sos', (req, res) => {
  const { location = "Mandovi Hostel B-312", type = "Medical Assistance" } = req.body;
  const alertId = `SOS-${Date.now().toString().slice(-6)}`;
  res.json({
    success: true,
    alertId,
    message: `🚨 Emergency Alert Dispatched! Campus Quick Response Team & Medical Van routed to ${location}.`,
    responseTimeEstimate: "2 - 4 minutes",
    wardenNotified: true,
    securityDispatchCode: "QRT-UNIT-04"
  });
});

// Serve frontend fallback
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 CampusPulse University Portal Running on Port ${PORT}`);
    console.log(`🔗 Local URL: http://localhost:${PORT}`);
    console.log(`====================================================`);
  });
}
