// utils/multer.js
import multer from "multer";
import path from "path";

const storage = multer.diskStorage({});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext !== ".jpg" && ext !== ".jpeg" && ext !== ".png") {
    cb(new Error("File type not supported"), false);
  } else {
    cb(null, true);
  }
};

const upload = multer({ storage, fileFilter });

export default upload;
