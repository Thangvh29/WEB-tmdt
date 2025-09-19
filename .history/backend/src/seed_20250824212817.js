// d:\vscode\Web bán đồ điện tử\backend\src\seed.js
import mongoose from 'mongoose';
import Category from './dist/models/category.model.js'; // Đường dẫn sau khi biên dịch

const seedCategories = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/your_db_name'); // Thay 'your_db_name'
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
        { name: 'power_supply' },
        { name: 'case' },
        { name: 'cooling_system' },
        { name: 'sound_card' },
        { name: 'network_card' },
        { name: 'ups' },
        { name: 'speaker' },
        { name: 'webcam' },
        { name: 'microphone' },
        { name: 'pc_assembly' },
        { name: 'upgrade_service' },
        { name: 'peripheral' },
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