@echo off
chcp 65001 >nul
title 音乐云 - 在线音乐平台

echo.
echo ========================================
echo           音乐云 - 在线音乐平台
echo ========================================
echo.

echo 正在检查Node.js环境...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 未检测到Node.js，请先安装Node.js
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js环境检测通过

echo 正在检查依赖包...
if not exist "node_modules" (
    echo 📦 首次运行，正在安装依赖包...
    npm install
    if errorlevel 1 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
    echo ✅ 依赖安装完成
) else (
    echo ✅ 依赖包已存在
)

echo 正在检查数据库文件...
if not exist "music.db" (
    echo 📊 正在初始化数据库...
    node -e "
        const sqlite3 = require('sqlite3').verbose();
        const db = new sqlite3.Database('./music.db');
        db.serialize(() => {
            db.run('CREATE TABLE IF NOT EXISTS songs (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, artist TEXT, file_path TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)');
            db.run('CREATE INDEX IF NOT EXISTS idx_songs_artist ON songs(artist)');
        });
        db.close();
        console.log('✅ 数据库初始化完成');
    "
) else (
    echo ✅ 数据库文件已存在
)

echo 正在检查上传目录...
if not exist "uploads" mkdir uploads
if not exist "test_uploads" mkdir test_uploads

echo.
echo ========================================
echo           启动信息
echo ========================================
echo.
echo 📍 访问地址: http://localhost:3000
echo 📁 前端文件: client/ 目录
echo 💾 数据库: music.db
echo 📂 上传目录: uploads/
echo.
echo 按 Ctrl+C 停止服务
echo.

echo 🚀 正在启动服务器...
node server.js