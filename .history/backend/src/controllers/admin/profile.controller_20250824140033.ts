// Static uploads
const uploadsPath = path.resolve(__dirname, '../uploads'); // ra backend/uploads
app.use('/uploads', express.static(uploadsPath));
console.log('Static uploads served from:', uploadsPath);
