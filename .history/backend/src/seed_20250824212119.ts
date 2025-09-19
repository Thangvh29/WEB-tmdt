// src/seed/seed.ts
import mongoose from 'mongoose';
import Category from '../models/category.model';

const seedCategories = async () => {
  try {
    // Kết nối tới MongoDB (thay 'your_db_name' bằng tên database của bạn)
    await mongoose.connect('mongodb://localhost:27017/your_db_name');

    // Kiểm tra và thêm danh mục
    const categories = await Category.find();
    if (categories.length === 0) {
      await Category.insertMany([
        { name: 'laptop' },
        { name: 'gpu' },
        { name: 'monitor' },
        { name: 'cpu' },
        { name: 'mainboard' },
        { name: 'ram' },
        { name: 'storage' },
        { name: 'fan' },
        { name: 'keyboard' },
        { name: 'mouse' },
        { name: 'mousepad' },
        { name: 'headphone' },
        { name: 'light' },
        { name: 'accessory' },
        // Danh mục mới liên quan đến cửa hàng bán máy tính
        { name: 'power_supply' },      // Nguồn máy tính
        { name: 'case' },             // Vỏ case
        { name: 'cooling_system' },   // Hệ thống làm mát
        { name: 'sound_card' },       // Card âm thanh
        { name: 'network_card' },     // Card mạng
        { name: 'ups' },              // UPS (Nguồn dự phòng)
        { name: 'speaker' },          // Loa
        { name: 'webcam' },           // Webcam
        { name: 'microphone' },       // Micro
        { name: 'pc_assembly' },      // Dịch vụ lắp ráp PC
        { name: 'upgrade_service' },  // Dịch vụ nâng cấp
        { name: 'peripheral' },       // Thiết bị ngoại vi khác
      ]);
      console.log('Seed categories success');
    } else {
      console.log('Categories already seeded');
    }
    mongoose.connection.close();
  } catch (err) {
    console.error('Seed error:', err);
    mongoose.connection.close();
  }
};

seedCategories();