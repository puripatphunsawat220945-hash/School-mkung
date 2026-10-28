const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');

const app = express();

// ตั้งค่าให้รองรับการส่งข้อมูล JSON และให้คนอื่นเข้ามาใช้งานได้
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ให้ Express เปิดไฟล์หน้าเว็บในโฟลเดอร์ public อัตโนมัติ
app.use(express.static(path.join(__dirname, 'public')));

// 1. เชื่อมต่อ MongoDB (ถ้ารันในเครื่องตัวเองใช้ URL นี้ได้เลย)
const MONGO_URI = 'mongodb://localhost:27017/student_management';
mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ เชื่อมต่อฐานข้อมูล MongoDB สำเร็จ'))
    .catch(err => console.error('❌ เชื่อมต่อ MongoDB ล้มเหลว:', err));

// 2. สร้างโครงสร้างการเก็บข้อมูล
const systemSchema = new mongoose.Schema({
    systemId: { type: String, default: 'default', unique: true },
    roomNames: { type: Object, default: {} },
    rosters: { type: Object, default: {} },
    allRecords: { type: Object, default: {} },
    scoreCols: { type: Object, default: {} },
    allScores: { type: Object, default: {} },
    examCols: { type: Object, default: {} },
    currentTeacherName: { type: String, default: 'ยังไม่ระบุชื่อ' }
}, { timestamps: true });

const SystemData = mongoose.model('SystemData', systemSchema);

// 3. API สำหรับโหลดข้อมูลทั้งหมดตอนเปิดเว็บ
app.get('/api/data', async (req, res) => {
    try {
        let data = await SystemData.findOne({ systemId: 'default' });
        if (!data) {
            data = await SystemData.create({ systemId: 'default' });
        }
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4. API สำหรับบันทึกข้อมูล (อัปเดตแยกส่วนตาม key เช่น rosters, roomNames)
app.post('/api/data/:key', async (req, res) => {
    try {
        const { key } = req.params;
        const updateQuery = {};
        updateQuery[key] = req.body;

        await SystemData.findOneAndUpdate(
            { systemId: 'default' },
            { $set: updateQuery },
            { new: true, upsert: true }
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// สตาร์ทเซิร์ฟเวอร์
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 ระบบพร้อมใช้งานแล้วที่ http://localhost:${PORT}`);
});
