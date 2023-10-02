const fs = require("fs");

const removeFiles = (files) => {
  if (files && files.length > 0) {
    return Promise.all(
      files.map(
        (file) =>
          new Promise((res, rej) => {
            try {
              fs.unlink(file.path, (err) => {
                if (err) throw err;
                res();
              });
            } catch (err) {
              console.error(err);
              rej(err);
            }
          })
      )
    );
  }
};
module.exports = removeFiles;
