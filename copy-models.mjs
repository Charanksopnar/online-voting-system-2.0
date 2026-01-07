// Script to copy face-api models from node_modules to public/models
import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sourceDir = join(__dirname, 'node_modules', '@vladmandic', 'face-api', 'model');
const targetDir = join(__dirname, 'public', 'models');

// Ensure target directory exists
if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true });
}

// Copy all model files
if (existsSync(sourceDir)) {
    const files = readdirSync(sourceDir);
    files.forEach(file => {
        const srcPath = join(sourceDir, file);
        const destPath = join(targetDir, file);
        try {
            copyFileSync(srcPath, destPath);
            console.log(`Copied: ${file}`);
        } catch (err) {
            console.error(`Failed to copy ${file}:`, err.message);
        }
    });
    console.log(`\n✅ Models copied to ${targetDir}`);
} else {
    console.error('❌ Source model directory not found. Run "npm install" first.');
}
