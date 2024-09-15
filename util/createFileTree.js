/**
 * Creates a file tree based on the given object.
 * @param {object} fileTree - The file tree object to be created.
 * @param {string} basePath - The base directory where the file tree will be created.
 */
function createFileTree(fileTree, basePath) {
  Object.keys(fileTree).forEach((key) => {
    const value = fileTree[key];
    const fullPath = new SuFile(path.resolve(basePath, key.replace(/^\//, ""))); // Remove leading '/' if present

    if (typeof value === "object") {
      // If value is an object, create a directory
      if (!fullPath.exist()) {
        fullPath.create(SuFile.NEW_FOLDERS);
      }
      // Recursively create subdirectories and files
      createFileTree(value, fullPath.getPath());
    } else if (typeof value === "string") {
      // If value is a string, treat it as file content
      fullPath.write(value);
    }
  });
}

export { createFileTree };
