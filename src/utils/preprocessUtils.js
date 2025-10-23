import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * 预处理图片文件夹，检测命名规范并生成标准格式的测试数据
 * @param {string} folderA - 变化前图片文件夹路径
 * @param {string} folderB - 变化后图片文件夹路径
 * @param {string} tempDir - 临时处理目录路径
 * @returns {Promise<Object>} 处理结果
 */
export const preprocessImageFolders = async (folderA, folderB, tempDir) => {
  try {
    // 1. 检查文件夹是否存在
    await checkFolderExists(folderA);
    await checkFolderExists(folderB);

    // 2. 读取文件夹中的文件
    const filesA = await fs.readdir(folderA);
    const filesB = await fs.readdir(folderB);

    // 3. 检查文件夹是否为空
    if (filesA.length === 0) {
      throw new Error('变化前文件夹为空');
    }
    if (filesB.length === 0) {
      throw new Error('变化后文件夹为空');
    }

    // 4. 过滤出图片文件
    const imageFilesA = filterImageFiles(filesA);
    const imageFilesB = filterImageFiles(filesB);

    if (imageFilesA.length === 0) {
      throw new Error('变化前文件夹中没有找到图片文件');
    }
    if (imageFilesB.length === 0) {
      throw new Error('变化后文件夹中没有找到图片文件');
    }

    // 5. 匹配图片文件（根据文件名）
    const matchedFiles = matchImageFiles(imageFilesA, imageFilesB, folderA, folderB);

    if (matchedFiles.length === 0) {
      throw new Error('没有找到匹配的图片文件对');
    }

    // 6. 创建临时处理目录
    await createTempDirectory(tempDir);

    // 7. 复制匹配的图片到临时目录并生成测试文件
    const testFileContent = await copyAndRenameImages(matchedFiles, tempDir);

    return {
      success: true,
      message: `成功处理 ${matchedFiles.length} 组图片`,
      totalImages: matchedFiles.length,
      tempDir: tempDir
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * 检查文件夹是否存在
 * @param {string} folderPath - 文件夹路径
 */
const checkFolderExists = async (folderPath) => {
  try {
    const stats = await fs.stat(folderPath);
    if (!stats.isDirectory()) {
      throw new Error(`${folderPath} 不是一个文件夹`);
    }
  } catch (error) {
    throw new Error(`文件夹不存在: ${folderPath}`);
  }
};

/**
 * 过滤出图片文件
 * @param {Array<string>} files - 文件列表
 * @returns {Array<string>} 图片文件列表
 */
const filterImageFiles = (files) => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.bmp', '.tif', '.tiff'];
  return files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return imageExtensions.includes(ext);
  });
};

/**
 * 匹配图片文件对
 * @param {Array<string>} filesA - 变化前图片文件列表
 * @param {Array<string>} filesB - 变化后图片文件列表
 * @param {string} folderA - 变化前文件夹路径
 * @param {string} folderB - 变化后文件夹路径
 * @returns {Array<Object>} 匹配的图片文件对
 */
const matchImageFiles = (filesA, filesB, folderA, folderB) => {
  const matchedFiles = [];
  const nameMapB = new Map();

  // 创建文件名到完整路径的映射
  filesB.forEach(file => {
    const baseName = path.basename(file, path.extname(file));
    nameMapB.set(baseName.toLowerCase(), path.join(folderB, file));
  });

  // 匹配文件
  filesA.forEach(file => {
    const baseName = path.basename(file, path.extname(file));
    const lowerName = baseName.toLowerCase();
    
    if (nameMapB.has(lowerName)) {
      matchedFiles.push({
        fileA: path.join(folderA, file),
        fileB: nameMapB.get(lowerName),
        baseName: baseName
      });
      nameMapB.delete(lowerName); // 避免重复匹配
    }
  });

  return matchedFiles;
};

/**
 * 创建临时处理目录
 * @param {string} tempDir - 临时目录路径
 */
const createTempDirectory = async (tempDir) => {
  // 创建临时目录
  try {
    await fs.mkdir(tempDir, { recursive: true });
  } catch (error) {
    throw new Error(`无法创建临时目录: ${error.message}`);
  }

  // 创建 images_A 和 images_B 子目录
  const imagesADir = path.join(tempDir, 'images_A');
  const imagesBDir = path.join(tempDir, 'images_B');

  try {
    await fs.mkdir(imagesADir, { recursive: true });
    await fs.mkdir(imagesBDir, { recursive: true });
  } catch (error) {
    throw new Error(`无法创建子目录: ${error.message}`);
  }
};

/**
 * 复制并重新命名图片文件
 * @param {Array<Object>} matchedFiles - 匹配的图片文件对
 * @param {string} tempDir - 临时目录路径
 * @returns {Promise<string>} 测试文件内容
 */
const copyAndRenameImages = async (matchedFiles, tempDir) => {
  const testLines = [];

  for (let i = 0; i < matchedFiles.length; i++) {
    const { fileA, fileB } = matchedFiles[i];
    const newName = `${String(i + 1).padStart(4, '0')}${path.extname(fileA)}`;
    
    const destA = path.join(tempDir, 'images_A', newName);
    const destB = path.join(tempDir, 'images_B', newName);
    
    // 复制文件
    try {
      await fs.copyFile(fileA, destA);
      await fs.copyFile(fileB, destB);
      
      // 添加到测试文件内容
      testLines.push(`images_A/${newName} images_B/${newName}`);
    } catch (error) {
      throw new Error(`复制文件失败: ${error.message}`);
    }
  }

  // 写入 test.txt 文件
  const testFilePath = path.join(tempDir, 'test.txt');
  try {
    await fs.writeFile(testFilePath, testLines.join('\n'));
  } catch (error) {
    throw new Error(`写入测试文件失败: ${error.message}`);
  }

  return testLines.join('\n');
};

/**
 * 检查文件名是否规范
 * @param {string} filename - 文件名
 * @returns {boolean} 是否规范
 */
export const isFilenameStandard = (filename) => {
  // 简单的文件名规范检查，可以根据实际需求调整
  const validPattern = /^[a-zA-Z0-9_\-\.]+$/;
  return validPattern.test(filename);
};