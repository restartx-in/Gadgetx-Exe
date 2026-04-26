const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

const tempUploadPath = path.join(__dirname, '..', 'uploads', 'temp');

// Use sync method and check for existence to avoid errors on server restart
if (!require('fs').existsSync(tempUploadPath)) {
  require('fs').mkdirSync(tempUploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tempUploadPath); 
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

const upload = multer({ storage });

// --- PRINT HEADER IMAGE HANDLER ---
const movePrintHeaderImage = async (file, tenantId) => {
  if (!file || !tenantId) return null;

  const finalDirectory = path.join(
    __dirname, '..', 'uploads', 'garage', String(tenantId), 'print', 'image'
  );
  await fs.mkdir(finalDirectory, { recursive: true });

  const newPath = path.join(finalDirectory, file.filename);
  const oldPath = file.path; 

  try {
    await fs.rename(oldPath, newPath);
    // Return the relative path for the database, replacing backslashes for URL safety
    return path.join('garage', String(tenantId), 'print', 'image', file.filename).replace(/\\/g, "/");
  } catch (error) {
    console.error("Error moving print header file:", error);
    try { await fs.unlink(oldPath); } catch (e) {} // Clean up temp file on failure
    return null;
  }
};

// --- NEW: PRINT QR CODE HANDLER ---
const movePrintQrImage = async (file, tenantId) => {
  if (!file || !tenantId) return null;

  // We'll store QR codes in a 'qr' subfolder to keep things organized
  const finalDirectory = path.join(
    __dirname, '..', 'uploads', 'garage', String(tenantId), 'print', 'qr'
  );
  await fs.mkdir(finalDirectory, { recursive: true });

  const newPath = path.join(finalDirectory, file.filename);
  const oldPath = file.path; 

  try {
    await fs.rename(oldPath, newPath);
    // Return the relative path for the database
    return path.join('garage', String(tenantId), 'print', 'qr', file.filename).replace(/\\/g, "/");
  } catch (error) {
    console.error("Error moving print QR file:", error);
    try { await fs.unlink(oldPath); } catch (e) {} 
    return null;
  }
};

// --- ITEM IMAGE HANDLER ---
const moveItemImage = async (file, userId, itemId) => {
  if (!file || !userId || !itemId) return null;

  const finalDirectory = path.join(__dirname, '..', 'uploads', String(userId), String(itemId));
  await fs.mkdir(finalDirectory, { recursive: true });

  const newPath = path.join(finalDirectory, file.filename);
  const oldPath = file.path; 

  try {
    await fs.rename(oldPath, newPath);
    return path.join(String(userId), String(itemId), file.filename).replace(/\\/g, "/");
  } catch (error) {
    console.error("Error moving file:", error);
    try { await fs.unlink(oldPath); } catch (e) {}
    return null;
  }
};

const deleteItemImageDirectory = async (userId, itemId) => {
  if (!userId || !itemId) return;
  try {
    const itemDirectory = path.join(__dirname, '..', 'uploads', String(userId), String(itemId));
    await fs.rm(itemDirectory, { recursive: true, force: true });
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error(`Failed to delete directory for item ${itemId}:`, err);
    }
  }
};

module.exports = {
  upload, 
  movePrintHeaderImage,
  movePrintQrImage, // <--- Exporting the new function here
  moveItemImage,
  deleteItemImageDirectory,
};