package main

import (
	"archive/zip"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"github.com/gin-gonic/gin"
)

const maxUploadSize int64 = 500 << 20 // 500 MiB

var uploadMu sync.Mutex

// 注册到 server.go 的 POST /api/upload-dataset
func UploadDataset(c *gin.Context) {
	uploadMu.Lock()
	defer uploadMu.Unlock()

	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxUploadSize)

	if err := c.Request.ParseMultipartForm(32 << 20); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "读取上传文件失败，或文件总大小超过 500 MiB",
		})
		return
	}

	files := c.Request.MultipartForm.File["files"]
	if len(files) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "请选择一个 ZIP 文件或多张图片",
		})
		return
	}

	if err := os.MkdirAll(webUploadDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "创建上传目录失败: " + err.Error(),
		})
		return
	}

	// 先写入临时文件，成功后再更新当前数据集状态。
	tmpDir, err := os.MkdirTemp(webUploadDir, "upload-*")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "创建临时目录失败: " + err.Error(),
		})
		return
	}
	defer os.RemoveAll(tmpDir)

	var zipPath string
	var datasetName string
	var fileCount int

	if len(files) == 1 && strings.EqualFold(filepath.Ext(filepath.Base(files[0].Filename)), ".zip") {
		zipPath = filepath.Join(tmpDir, "dataset.zip")
		if err := saveUploadedFile(files[0], zipPath); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
			return
		}

		count, err := countZipFiles(zipPath)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "ZIP 文件无效或无法读取: " + err.Error(),
			})
			return
		}
		fileCount = count
		datasetName = filepath.Base(files[0].Filename)
	} else {
		zipPath = filepath.Join(tmpDir, "dataset.zip")
		count, err := zipImages(files, zipPath)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
			return
		}
		fileCount = count
		datasetName = fmt.Sprintf("图片数据集（%d 张图片）", count)
	}

	info, err := os.Stat(zipPath)
	if err != nil || info.Size() == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "上传文件为空或无法读取",
		})
		return
	}

	finalPath := filepath.Join(webUploadDir, "dataset.zip")
	if err := os.Rename(zipPath, finalPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "保存数据集失败: " + err.Error(),
		})
		return
	}

	// 保留现有 Preparation() 的输入方式。
	webInFile = finalPath
	webDatasetName = datasetName
	webDatasetSize = info.Size()
	webDatasetCount = fileCount

	c.JSON(http.StatusOK, gin.H{
		"success":   true,
		"message":   "数据集上传成功",
		"name":      webDatasetName,
		"size":      webDatasetSize,
		"fileCount": webDatasetCount,
	})
}

func saveUploadedFile(file *multipart.FileHeader, dst string) error {
	src, err := file.Open()
	if err != nil {
		return fmt.Errorf("打开上传文件失败")
	}
	defer src.Close()

	out, err := os.OpenFile(dst, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0644)
	if err != nil {
		return fmt.Errorf("创建目标文件失败")
	}
	defer out.Close()

	n, err := io.Copy(out, src)
	if err != nil {
		return fmt.Errorf("保存上传文件失败")
	}
	if n == 0 {
		return fmt.Errorf("不能上传空文件")
	}
	return nil
}

func zipImages(files []*multipart.FileHeader, dst string) (int, error) {
	out, err := os.Create(dst)
	if err != nil {
		return 0, fmt.Errorf("创建 ZIP 文件失败")
	}

	zw := zip.NewWriter(out)
	count := 0

	for _, fh := range files {
		name := filepath.Base(fh.Filename)
		ext := strings.ToLower(filepath.Ext(name))
		switch ext {
		case ".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp":
		default:
			zw.Close()
			out.Close()
			return 0, fmt.Errorf("不支持的文件类型: %s", ext)
		}

		src, err := fh.Open()
		if err != nil {
			zw.Close()
			out.Close()
			return 0, fmt.Errorf("读取图片失败")
		}

		entry, err := zw.Create(fmt.Sprintf("%03d_%s", count+1, name))
		if err == nil {
			_, err = io.Copy(entry, src)
		}
		src.Close()

		if err != nil {
			zw.Close()
			out.Close()
			return 0, fmt.Errorf("打包图片失败")
		}
		count++
	}

	if err := zw.Close(); err != nil {
		out.Close()
		return 0, fmt.Errorf("完成 ZIP 打包失败")
	}
	if err := out.Close(); err != nil {
		return 0, fmt.Errorf("关闭 ZIP 文件失败")
	}
	if count == 0 {
		return 0, fmt.Errorf("没有有效图片")
	}
	return count, nil
}

func countZipFiles(path string) (int, error) {
	zr, err := zip.OpenReader(path)
	if err != nil {
		return 0, err
	}
	defer zr.Close()

	count := 0
	for _, f := range zr.File {
		if f.FileInfo().IsDir() {
			continue
		}
		if f.UncompressedSize64 > uint64(maxUploadSize) {
			return 0, fmt.Errorf("ZIP 内存在过大的文件")
		}
		count++
	}
	if count == 0 {
		return 0, fmt.Errorf("ZIP 内没有文件")
	}
	return count, nil
}

// 注册到 server.go 的 GET /api/dataset-info
func GetDatasetInfo(c *gin.Context) {
	uploadMu.Lock()
	defer uploadMu.Unlock()

	c.JSON(http.StatusOK, gin.H{
		"success":   webDatasetName != "",
		"uploaded":  webDatasetName != "",
		"name":      webDatasetName,
		"size":      webDatasetSize,
		"fileCount": webDatasetCount,
	})
}
