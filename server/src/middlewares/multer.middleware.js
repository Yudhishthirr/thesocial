import multer from "multer";
import fs from "fs";
import path from "path";

const tempDir = path.join(process.cwd(), "public", "temp");

// ensure temp dir exists
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    // keep original name or you can create unique name:
    // cb(null, `${Date.now()}-${file.originalname}`);
    cb(null, file.originalname);
  },
});

export const upload = multer({
  storage,
});
